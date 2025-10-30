#!/bin/bash
# 시놀로지 OAuth2 엔드포인트 실제 경로 찾기

SYNO_HOST="backup.local:5001"
CLIENT_ID="96eca09f712a021c0252d9c40c866e91"

echo "=== 시놀로지 OAuth2 엔드포인트 실제 경로 찾기 ==="
echo ""

# 시놀로지에서 사용할 수 있는 다양한 경로 시도
ENDPOINTS=(
    "/oauth2/authorize"
    "/webapi/oauth2/authorize"
    "/dsm/sso/oauth2/authorize"
    "/sso/oauth2/authorize"
    "/api/oauth2/authorize"
    "/webapi/auth.cgi"
    "/dsm/oauth2/authorize"
)

echo "테스트할 엔드포인트:"
for endpoint in "${ENDPOINTS[@]}"; do
    URL="https://${SYNO_HOST}${endpoint}?client_id=${CLIENT_ID}&response_type=code"
    echo ""
    echo "테스트: ${URL}"
    
    RESPONSE=$(curl -k -s -w "\n%{http_code}" "${URL}" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d' | head -10)
    
    echo "  HTTP 상태: ${HTTP_CODE}"
    
    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | grep -qi "oauth\|authorize\|login\|error\|invalid"; then
            echo "  ✓ 응답 내용 (처음 5줄):"
            echo "$BODY" | head -5 | sed 's/^/    /'
        fi
    elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
        LOCATION=$(curl -k -s -I "${URL}" 2>&1 | grep -i "location:" | cut -d' ' -f2- | tr -d '\r')
        echo "  → 리디렉션: ${LOCATION}"
    elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
        echo "  ⚠️  ${HTTP_CODE} 응답 (파라미터 오류 가능성)"
        echo "  응답: $(echo "$BODY" | head -3 | tr '\n' ' ')"
    fi
done

echo ""
echo "=== 확인 사항 ==="
echo "시놀로지 DSM에서 다음을 확인하세요:"
echo "1. 제어판 > 도메인/LDAP > SSO 클라이언트"
echo "2. OAuth2 클라이언트 설정에서 '인증 URL' 또는 'Authorization Endpoint' 확인"
echo "3. OAuth Service 패키지가 설치되어 있고 활성화되어 있는지 확인"

