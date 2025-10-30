#!/bin/bash
# 실제 토큰으로 테스트하는 스크립트

if [ -z "$OAUTH2_TOKEN" ]; then
    echo "⚠️  OAUTH2_TOKEN 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "사용법:"
    echo "  OAUTH2гани_TOKEN=your-token-here ./test-with-token.sh"
    echo ""
    echo "토큰 획득 방법:"
    echo "  ./get-synology-token.sh"
    exit 1
fi

PORT=${MCP_HTTP_PORT:-8091}
ENDPOINT="http://ubun-ai.local:${PORT}/mcp"

echo "=== OAuth2 토큰으로 MCP 서버 테스트 ==="
echo "엔드포인트: ${ENDPOINT}"
echo "토큰 (처음 20자): ${OAUTH2_TOKEN:0:20}..."
echo ""

echo "1. Tools List 테스트:"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OAUTH2_TOKEN}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ 인증 성공!"
    echo "   응답:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null | head -20
elif [ "$HTTP_CODE" = "401" ]; then
    echo "   ✗ 인증 실패 (401 Unauthorized)"
    echo "   응답:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo "   가능한 원인:"
    echo "   - 토큰이 만료되었습니다"
    echo "   - 토큰 형식이 올바르지 않습니다"
    echo "   - 시놀로지 서버에서 토큰 검증 실패"
else
    echo "   ⚠️  예상치 못한 응답: HTTP $HTTP_CODE"
    echo "   응답:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi
echo ""

echo "2. Userinfo 엔드포인트 직접 테스트:"
USERINFO_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${OAUTH2_TOKEN}" \
  "https://backup.local:5001/webman/sso/SSOUserInfo.cgi")

USERINFO_CODE=$(echo "$USERINFO_RESPONSE" | tail -1)
USERINFO_BODY=$(echo "$USERINFO_RESPONSE" | sed '$d')

if [ "$USERINFO_CODE" = "200" ]; then
    echo "   ✓ Userinfo 엔드포인트 응답 성공"
    echo "   사용자 정보:"
    echo "$USERINFO_BODY" | python3 -m json.tool 2>/dev/null || echo "$USERINFO_BODY"
elif [ "$USERINFO_CODE" = "401" ]; then
    echo "   ✗ Userinfo 엔드포인트에서 토큰 거부됨"
    echo "   토큰이 유효하지 않거나 만료되었을 수 있습니다"
else
    echo "   ⚠️  예상치 못한 응답: HTTP $USERINFO_CODE"
fi
echo ""

echo "=== 테스트 완료 ==="

