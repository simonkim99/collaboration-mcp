#!/bin/bash
# MCP 서버 시작 스크립트

echo "=== MCP 서버 시작 ==="
echo ""

# 환경 변수 설정 (기본값)
MCP_TRANSPORT=${MCP_TRANSPORT:-http}
MCP_HTTP_PORT=${MCP_HTTP_PORT:-8091}
MCP_OAUTH2_ENABLED=${MCP_OAUTH2_ENABLED:-false}
MCP_OAUTH2_ISSUER=${MCP_OAUTH2_ISSUER:-https://backup.local:5001/webman/sso}
MCP_OAUTH2_CLIENT_ID=${MCP_OAUTH2_CLIENT_ID:-96eca09f712a021c0252d9c40c866e91}
MCP_OAUTH2_AUTHORIZATION_ENDPOINT=${MCP_OAUTH2_AUTHORIZATION_ENDPOINT:-https://backup.local:5001/webman/sso/SSOOauth.cgi}
MCP_OAUTH2_TOKEN_ENDPOINT=${MCP_OAUTH2_TOKEN_ENDPOINT:-https://backup.local:5001/webman/sso/SSOAccessToken.cgi}
MCP_OAUTH2_USERINFO_ENDPOINT=${MCP_OAUTH2_USERINFO_ENDPOINT:-https://backup.local:5001/webman/sso/SSOUserInfo.cgi}
MCP_OAUTH2_JWKS_ENDPOINT=${MCP_OAUTH2_JWKS_ENDPOINT:-https://backup.local:5001/webman/sso/openid-jwks.json}

echo "설정:"
echo "  TRANSPORT: ${MCP_TRANSPORT}"
echo "  HTTP_PORT: ${MCP_HTTP_PORT}"
echo "  OAuth2_ENABLED: ${MCP_OAUTH2_ENABLED}"
if [ "${MCP_OAUTH2_ENABLED}" = "true" ]; then
    echo "  OAuth2_ISSUER: ${MCP_OAUTH2_ISSUER}"
    echo "  OAuth2_CLIENT_ID: ${MCP_OAUTH2_CLIENT_ID}"
fi
echo ""

# 설정을 환경 변수로 export
export MCP_TRANSPORT
export MCP_HTTP_PORT
export MCP_OAUTH2_ENABLED
export MCP_OAUTH2_ISSUER
export MCP_OAUTH2_CLIENT_ID
export MCP_OAUTH2_AUTHORIZATION_ENDPOINT
export MCP_OAUTH2_USERINFO_ENDPOINT
export MCP_OAUTH2_TOKEN_ENDPOINT
export MCP_OAUTH2_JWKS_ENDPOINT

echo "서버 시작 중..."
echo "엔드포인트: http://ubun-ai.local:${MCP_HTTP_PORT}/mcp"
echo ""

# 서버 시작
npm start

