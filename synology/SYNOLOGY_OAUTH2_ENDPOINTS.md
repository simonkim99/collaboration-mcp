# 시놀로지 OAuth2 엔드포인트 정보

## 확인된 엔드포인트

시놀로지 DSM의 Well-known Configuration에서 확인한 실제 엔드포인트:

**Well-known Configuration:**
```
https://backup.local:5001/webman/sso/.well-known/openid-configuration
```

## 실제 엔드포인트 URL

- **Issuer**: `https://backup.local:5001/webman/sso`
- **Authorization Endpoint**: `https://backup.local:5001/webman/sso/SSOOauth.cgi`
- **Token Endpoint**: `https://backup.local:5001/webman/sso/SSOAccessToken.cgi`
- **UserInfo Endpoint**: `https://backup.local:5001/webman/sso/SSOUserInfo.cgi`
- **JWKS URI**: `https://backup.local:5001/webman/sso/openid-jwks.json`

## 지원하는 기능

- **Grant Types**: `authorization_code`, `implicit`
- **Response Types**: `code`, `code id_token`, `id_token`, `id_token token`
- **Scopes**: `openid`, `email`, `groups`
- **Code Challenge Methods**: `S256`, `plain`
- **Token Endpoint Auth Methods**: `client_secret_basic`, `client_secret_post`
- **ID Token Signing**: `RS256`

## 설정 예시

```bash
export MCP_OAUTH2_ISSUER=https://backup.local:5001/webman/sso
export MCP_OAUTH2_CLIENT_ID=96eca09f712a021c0252d9c40c866e91
export MCP_OAUTH2_AUTHORIZATION_ENDPOINT=https://backup.local:5001/webman/sso/SSOOauth.cgi
export MCP_OAUTH2_TOKEN_ENDPOINT=https://backup.local:5001/webman/sso/SSOAccessToken.cgi
export MCP_OAUTH2_USERINFO_ENDPOINT=https://backup.local:5001/webman/sso/SSOUserInfo.cgi
export MCP_OAUTH2_JWKS_ENDPOINT=https://backup.local:5001/webman/sso/openid-jwks.json
```

## 인증 URL 예시

```
https://backup.local:5001/webman/sso/SSOOauth.cgi?client_id=96eca09f712a021c0252d9c40c866e91&response_type=code&redirect_uri=http://ubun-ai.local:8091/oauth2/callback&scope=openid+email
```

## 토큰 교환 예시

```bash
curl -X POST https://backup.local:5001/webman/sso/SSOAccessToken.cgi \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "client_id=96eca09f712a021c0252d9c40c866e91" \
  -d "redirect_uri=http://ubun-ai.local:8091/oauth2/callback"
```

