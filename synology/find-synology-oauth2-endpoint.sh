#!/bin/bash
# 시놀로지 OAuth2 엔드포인트 찾기

SYNO_HOST="backup.local"
PORTS=(443 5001 8443)

echo "=== 시놀로지 OAuth2 엔드포인트 찾기 ==="
echo ""

# 다양한 경로 시도
PATHS=(
    "/oauth2/authorize"
    "/api/oauth2/authorize"
    "/webapi/oauth2/authorize"
    "/oauth/authorize"
    "/api/oauth/authorize"
    "/sso/oauth2/authorize"
    "/dsm/oauth2/authorize"
)

for port in "${PORTS[@]}"; do
    if [ "$port" = "443" ]; then
        PROTOCOL="https"
        PORT_STR=""
    else
        PROTOCOL="https"
        PORT_STR=":${port}"
    fi
    
    echo "포트 ${port} 테스트:"
    for path in "${PATHS[@]}"; do
        URL="${PROTOCOL}://${SYNO_HOST}${PORT_STR}${path}"
        STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "${URL}" 2>/dev/null)
        
        if [ "$STATUS" != "000" ] && [ "$STATUS" != "404" ] && [ "$STATUS" != "" ]; then
            echo "  ✓ ${URL} → HTTP ${STATUS}"
            
            # 실제 응답 확인
            RESPONSE=$(curl -k -s "${URL}" 2>/dev/null | head -5)
            if echo "$RESPONSE" | grep -qi "oauth\|authorize\|login\|error"; then
                echo "    응답: $(echo "$RESPONSE" | head -1)"
            fi
        fi
    done
    echo ""
done

echo "=== 추가 확인: 시놀로지 DSM 포트 ==="
echo "시놀로지 DSM은 보통 다음 포트를 사용합니다:"
echo "  - HTTP: 5000"
echo "  - HTTPS: 5001"
echo ""
echo "DSM에 로그인하여 다음 위치에서 OAuth2 설정을 확인하세요:"
echo "  제어판 > 도메인/LDAP > SSO 클라이언트"
echo "  또는"
echo "  패키지 센터 > OAuth Service 설정"

