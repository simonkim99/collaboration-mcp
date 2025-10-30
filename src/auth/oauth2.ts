import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';
import https from 'https';

export interface OAuth2Config {
  enabled: boolean;
  issuer: string;
  clientId?: string;
  clientSecret?: string;
  authorizationEndpoint?: string;
  jwksEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  audience?: string;
  scope?: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  error?: string;
  payload?: jwt.JwtPayload;
  userInfo?: any;
}

/**
 * Create JWKS client for token verification
 */
function createJwksClient(jwksUri: string): jwksClient.JwksClient {
  return jwksClient({
    jwksUri,
    cache: true,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 5,
  });
}

/**
 * Get signing key from JWKS
 */
async function getSigningKey(
  client: jwksClient.JwksClient,
  kid: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      if (!signingKey) {
        reject(new Error('Unable to get signing key'));
        return;
      }
      resolve(signingKey);
    });
  });
}

/**
 * Verify JWT token using JWKS
 */
async function verifyJwtToken(
  token: string,
  jwksUri: string,
  issuer: string,
  audience?: string
): Promise<jwt.JwtPayload> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new Error('Invalid token format');
  }

  const client = createJwksClient(jwksUri);
  
  // JWKS 클라이언트에 SSL 검증 비활성화 설정 (자체 서명 인증서용)
  // 참고: jwks-rsa는 내부적으로 axios를 사용하므로 환경 변수로 제어
  const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (!originalRejectUnauthorized) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  try {
    const signingKey = await getSigningKey(client, decoded.header.kid);

    const verified = jwt.verify(token, signingKey, {
      issuer,
      audience,
      algorithms: ['RS256', 'RS384', 'RS512'],
    }) as jwt.JwtPayload;
    
    return verified;
  } finally {
    // 원래 설정 복원
    if (!originalRejectUnauthorized) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }
  }
}

/**
 * Verify token using introspection endpoint
 */
async function verifyTokenIntrospection(
  token: string,
  tokenEndpoint: string,
  clientId: string,
  clientSecret?: string
): Promise<any> {
  try {
    const authConfig = clientSecret
      ? {
          auth: {
            username: clientId,
            password: clientSecret,
          },
        }
      : {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };

    const response = await axios.post(
      tokenEndpoint,
      new URLSearchParams({
        token,
        token_type_hint: 'access_token',
      }),
      {
        ...authConfig,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...authConfig.headers,
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // 자체 서명 인증서 허용 (개발 환경)
        }),
      }
    );

    if (!response.data.active) {
      throw new Error('Token is not active');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Token introspection failed: ${error.response?.status} ${error.response?.statusText}`
      );
    }
    throw error;
  }
}

/**
 * Verify token using userinfo endpoint (for public clients)
 */
async function verifyTokenViaUserinfo(
  token: string,
  userinfoEndpoint: string
): Promise<any> {
  try {
    const response = await axios.get(userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // 자체 서명 인증서 허용 (개발 환경)
      }),
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Token is invalid or expired');
      }
      throw new Error(
        `Userinfo verification failed: ${error.response?.status} ${error.response?.statusText}`
      );
    }
    throw error;
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify OAuth2 token
 */
export async function verifyOAuth2Token(
  token: string,
  config: OAuth2Config
): Promise<TokenVerificationResult> {
  if (!config.enabled) {
    return { valid: true }; // Authentication disabled
  }

  if (!token) {
    return {
      valid: false,
      error: 'No token provided',
    };
  }

  try {
    // Try JWT verification first (if JWKS endpoint is configured)
    if (config.jwksEndpoint) {
      const payload = await verifyJwtToken(
        token,
        config.jwksEndpoint,
        config.issuer,
        config.audience
      );

      // Check token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return {
          valid: false,
          error: 'Token has expired',
        };
      }

      return {
        valid: true,
        payload,
      };
    }

    // Fallback to introspection (if token endpoint is configured)
    if (config.tokenEndpoint && config.clientId) {
      try {
        const introspectionResult = await verifyTokenIntrospection(
          token,
          config.tokenEndpoint,
          config.clientId,
          config.clientSecret
        );

        return {
          valid: true,
          userInfo: introspectionResult,
        };
      } catch (error) {
        // If introspection fails, try userinfo endpoint as fallback
        if (config.userinfoEndpoint) {
          try {
            const userInfo = await verifyTokenViaUserinfo(
              token,
              config.userinfoEndpoint
            );
            return {
              valid: true,
              userInfo,
            };
          } catch (userinfoError) {
            // Both failed
            return {
              valid: false,
              error:
                userinfoError instanceof Error
                  ? userinfoError.message
                  : 'Token verification failed',
            };
          }
        }
        // No userinfo endpoint, return introspection error
        return {
          valid: false,
          error:
            error instanceof Error ? error.message : 'Token verification failed',
        };
      }
    }

    // Fallback to userinfo endpoint (if configured and no introspection)
    if (config.userinfoEndpoint) {
      try {
        const userInfo = await verifyTokenViaUserinfo(
          token,
          config.userinfoEndpoint
        );
        return {
          valid: true,
          userInfo,
        };
      } catch (error) {
        return {
          valid: false,
          error:
            error instanceof Error ? error.message : 'Token verification failed',
        };
      }
    }

    // If neither JWKS, introspection, nor userinfo is configured, return error
    return {
      valid: false,
      error: 'OAuth2 verification not properly configured',
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Get OAuth2 configuration from environment variables
 */
export function getOAuth2Config(): OAuth2Config {
  const enabled = process.env.MCP_OAUTH2_ENABLED === 'true';
  const issuer = process.env.MCP_OAUTH2_ISSUER || 'https://backup.local:5001/webman/sso';

  const config: OAuth2Config = {
    enabled,
    issuer,
  };

  if (enabled) {
    config.clientId = process.env.MCP_OAUTH2_CLIENT_ID;
    config.clientSecret = process.env.MCP_OAUTH2_CLIENT_SECRET;
    config.authorizationEndpoint =
      process.env.MCP_OAUTH2_AUTHORIZATION_ENDPOINT ||
      `${issuer}/SSOOauth.cgi`;
    config.jwksEndpoint =
      process.env.MCP_OAUTH2_JWKS_ENDPOINT ||
      `${issuer}/openid-jwks.json`;
    config.tokenEndpoint =
      process.env.MCP_OAUTH2_TOKEN_ENDPOINT ||
      `${issuer}/SSOAccessToken.cgi`;
    config.userinfoEndpoint =
      process.env.MCP_OAUTH2_USERINFO_ENDPOINT ||
      `${issuer}/SSOUserInfo.cgi`;
    config.audience = process.env.MCP_OAUTH2_AUDIENCE;
    config.scope = process.env.MCP_OAUTH2_SCOPE || 'openid email';
  }

  return config;
}

