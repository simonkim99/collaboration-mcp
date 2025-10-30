#!/bin/bash
# OAuth2 인증 테스트 스크립트

echo "=== OAuth2 인증 테스트 ==="
echo ""

# 설정 확인
PORT=${MCP_HTTP_PORT:-3000}
ENDPOINT="http://localhost:${PORT}/mcp"

echo "1. 환경 변수 확인"
echo "   MCP_OAUTH2_ENABLED: ${MCP_OAUTH2_ENABLED:-false}"
echo "   MCP_OAUTH2_ISSUER: ${MCP_OAUTH2_ISSUER:-not set}"
echo "   MCP_OAUTH2_JWKS_ENDPOINT: ${MCP_OAUTH2_JWKS_ENDPOINT:-not set}"
echo ""

# 시놀로지 OAuth2 서버 확인
if [ -n "$MCP_OAUTH2_ISSUER" ]; then
    echo "2. 시놀로지 OAuth2 서버 확인"
    SYNO_ISSUER=${MCP_OAUTH2_ISSUER}
    
    echo "   Well-known configuration 확인:"
    curl -s "${SYNO_ISSUER}/.well-known/openid-configuration" 2>/dev/null | python3 -m json.tool 2>/dev/null | head -15 || echo "   ⚠️  엔드포인트를 찾을 수 없습니다"
    echo ""
    
    echo "   JWKS 확인:"
    JWKS_ENDPOINT=${MCP_OAUTH2_JWKS_ENDPOINT:-${SYNO_ISSUER}/oauth2/.well-known/jwks.json}
    curl -s "${JWKS_ENDPOINT}" 2>/dev/null | python3 -m json.tool 2>/dev/null | head -10 || echo "   ⚠️  JWKS 엔드포인트를 찾을 수 없습니다"
    echo ""
fi

# 인증 없이 요청 테스트
echo "3. 인증 없이 요청 테스트"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✓ 인증이 필요한 상태입니다 (OAuth2 활성화됨)"
    echo "   응답: $(echo "$BODY" | python3 -m json.tool 2>/dev/null | head -5)"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "   ⚠️  인증 없이 접근 가능합니다 (OAuth2 비활성화 또는 설정 필요)"
else
    echo "   ⚠️  예상치 못한 응답: HTTP $HTTP_CODE"
fi
echo ""

# Bearer 토큰으로 요청 테스트
if [ -n "$OAUTH2_TOKEN" ]; then
    echo "4. Bearer 토큰으로 요청 테스트"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${OAUTH2_TOKEN}" \
      -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✓ 토큰 인증 성공"
        echo "   응답: $(echo "$BODY" | python3 -m json.tool 2>/dev/null | head -10)"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "   ✗ 토큰 인증 실패"
        echo "   응답: $(echo "$BODY" | python3 -m json.tool 2>/dev/null | head -5)"
    else
        echo "   ⚠️  예상치 못한 응답: HTTP $HTTP_CODE"
    fi
    echo ""
else
    echo "4. Bearer 토큰 테스트 (건너뜀)"
    echo "   OAUTH2_TOKEN 환경 변수가 설정되지 않았습니다"
    echo ""
fi

echo "=== 테스트 완료 ==="
echo ""
echo "사용법:"
echo "  # OAuth2 비활성화 테스트"
echo "  ./test-oauth2.sh"
echo ""
echo "  # OAuth2 활성화 테스트"
echo "  MCP_OAUTH2_ENABLED=true MCP_OAUTH2_ISSUER=https://backup.local ./test-oauth2.sh"
echo ""
echo "  # 토큰으로 테스트"
echo "  OAUTH2_TOKEN=your-token-here ./test-oauth2.sh"

