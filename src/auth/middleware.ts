import { IncomingMessage, ServerResponse } from 'http';
import {
  extractBearerToken,
  verifyOAuth2Token,
  getOAuth2Config,
  type TokenVerificationResult,
} from './oauth2.js';

export interface AuthContext {
  authenticated: boolean;
  userId?: string;
  username?: string;
  email?: string;
  tokenPayload?: any;
}

/**
 * OAuth2 authentication middleware
 */
export async function authenticateRequest(
  req: IncomingMessage
): Promise<AuthContext> {
  const config = getOAuth2Config();

  // If OAuth2 is disabled, allow all requests
  if (!config.enabled) {
    return {
      authenticated: true,
    };
  }

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    console.log('[OAuth2] No token provided');
    return {
      authenticated: false,
    };
  }

  // Verify token
  const verification = await verifyOAuth2Token(token, config);

  if (!verification.valid) {
    console.log(`[OAuth2] Token verification failed: ${verification.error || 'Unknown error'}`);
    return {
      authenticated: false,
    };
  }

  console.log('[OAuth2] Token verified successfully');

  // Extract user information from token payload
  const payload = verification.payload;
  const userId = payload?.sub || payload?.user_id;
  const username = payload?.preferred_username || payload?.username || payload?.name;
  const email = payload?.email;

  return {
    authenticated: true,
    userId,
    username,
    email,
    tokenPayload: payload || verification.userInfo,
  };
}

/**
 * Send 401 Unauthorized response
 */
export function sendUnauthorized(res: ServerResponse, reason?: string): void {
  res.writeHead(401, {
    'Content-Type': 'application/json',
    'WWW-Authenticate': 'Bearer',
  });
  res.end(
    JSON.stringify({
      error: 'Unauthorized',
      message: reason || 'Authentication required',
    })
  );
}

/**
 * Check if authentication is required
 */
export function isAuthenticationRequired(): boolean {
  const config = getOAuth2Config();
  return config.enabled;
}

