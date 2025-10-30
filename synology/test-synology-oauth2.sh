#!/bin/bash
# 시놀로지 OAuth2 설정으로 테스트

echo "=== 시놀로지 OAuth2 설정 테스트 ==="
echo ""

# 환경 변수 설정
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=8091
export MCP_OAUTH2_ENABLED=true
export MCP_OAUTH2_ISSUER=https://backup.local:5001/webman/sso
export MCP_OAUTH2_CLIENT_ID=96eca09f712a021c0252d9c40c866e91
# 시크릿 없음 (Public Client)
export MCP_OAUTH2_AUTHORIZATION_ENDPOINT=https://backup.local:5001/webman/sso/SSOOauth.cgi
export MCP_OAUTH2_TOKEN_ENDPOINT=https://backup.local:5001/webman/sso/SSOAccessToken.cgi
export MCP_OAUTH2_USERINFO_ENDPOINT=https://backup.local:5001/webman/sso/SSOUserInfo.cgi
export MCP_OAUTH2_JWKS_ENDPOINT=https://backup.local:5001/webman/sso/openid-jwks.json

echo "1. 환경 변수 확인:"
echo "   MCP_OAUTH2_ENABLED: ${MCP_OAUTH2_ENABLED}"
echo "   MCP_OAUTH2_ISSUER: ${MCP_OAUTH2_ISSUER}"
echo "   MCP_OAUTH2_CLIENT_ID: ${MCP_OAUTH2_CLIENT_ID}"
echo "   MCP_OAUTH2_CLIENT_SECRET: (없음 - Public Client)"
echo ""

echo "2. Userinfo 엔드포인트 확인:"
curl -s -k "${MCP_OAUTH2_USERINFO_ENDPOINT}" -o /dev/null -w "HTTP Status: %{http_code}\n" || echo "   연결 실패"
echo ""

echo "3. 서버 시작 준비:"
echo "   다음 명령어로 서버를 시작하세요:"
echo ""
echo "   MCP_TRANSPORT=http \\"
echo "   MCP_HTTP_PORT=8091 \\"
echo "   MCP_OAUTH2_ENABLED=true \\"
echo "   MCP_OAUTH2_ISSUER=https://backup.local:5001 \\"
echo "   MCP_OAUTH2_CLIENT_ID=96eca09f712a021c0252d9c40c866e91 \\"
echo "   MCP_OAUTH2_USERINFO_ENDPOINT=https://backup.local:5001/oauth2/userinfo \\"
echo "   npm start"
echo ""

echo "4. 토큰 테스트 (서버 실행 후):"
echo "   서버가 실행되면 다음 명령어로 테스트:"
echo ""
echo "   # 인증 없이 요청 (401 예상)"
echo "   curl -X POST http://ubun-ai.local:8091/mcp \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}'"
echo ""
echo "   # 토큰으로 요청 (OAUTH2_TOKEN 환경 변수 필요)"
echo "   OAUTH2_TOKEN=your-token-here \\"
echo "   curl -X POST http://ubun-ai.local:8091/mcp \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer \$OAUTH2_TOKEN' \\"
echo "     -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}'"
echo ""

echo "=== 설정 완료 ==="

