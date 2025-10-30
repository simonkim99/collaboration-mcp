#!/bin/bash
# 시놀로지 서버 포트 확인 스크립트

SYNO_HOST="backup.local"

echo "=== 시놀로지 서버 포트 확인 ==="
echo ""

# 일반적인 포트들 확인
PORTS=(443 80 5000 5001 5091 8443)

echo "포트 확인 중..."
for port in "${PORTS[@]}"; do
    if [ "$port" = "443" ] || [ "$port" = "8443" ]; then
        PROTOCOL="https"
    else
        PROTOCOL="http"
    fi
    
    STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" --connect-timeout 2 "${PROTOCOL}://${SYNO_HOST}:${port}/oauth2/authorize" 2>/dev/null)
    
    if [ "$STATUS" != "000" ] && [ "$STATUS" != "" ]; then
        echo "  ✓ 포트 ${port} (${PROTOCOL}): HTTP ${STATUS}"
    else
        CONNECT=$(curl -s -k -o /dev/null -w "%{http_code}" --connect-timeout 2 "${PROTOCOL}://${SYNO_HOST}:${port}" 2>/dev/null)
        if [ "$CONNECT" != "000" ] && [ "$CONNECT" != "" ]; then
            echo "  ✓ 포트 ${port} (${PROTOCOL}): 연결 가능 (HTTP ${CONNECT})"
        fi
    fi
done

echo ""
echo "OAuth2 엔드포인트 테스트:"
echo ""

# 기본 HTTPS 포트 (443)로 테스트
echo "1. https://backup.local/oauth2/authorize (포트 443):"
curl -k -s -o /dev/null -w "   HTTP Status: %{http_code}\n" "https://backup.local/oauth2/authorize" || echo "   연결 실패"
echo ""

echo "2. https://backup.local:443/oauth2/authorize:"
curl -k -s -o /dev/null -w "   HTTP Status: %{http_code}\n" "https://backup.local:443/oauth2/authorize" || echo "   연결 실패"
echo ""

echo "=== 확인 완료 ==="
echo ""
echo "권장: 기본 HTTPS 포트(443)를 사용하거나, 시놀로지 DSM 설정에서 확인한 실제 포트를 사용하세요."

