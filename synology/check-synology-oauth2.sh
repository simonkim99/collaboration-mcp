#!/bin/bash
# 시놀로지 OAuth2 서버 엔드포인트 확인 스크립트

SYNO_HOST=${1:-backup.local}
SYNO_ISSUER="https://${SYNO_HOST}"

echo "=== 시놀로지 OAuth2 서버 엔드포인트 확인 ==="
echo "서버: ${SYNO_ISSUER}"
echo ""

# Well-known OpenID Configuration 확인
echo "1. OpenID Connect Well-known Configuration:"
echo "   ${SYNO_ISSUER}/.well-known/openid-configuration"
curl -s -k "${SYNO_ISSUER}/.well-known/openid-configuration" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "   ⚠️  엔드포인트를 찾을 수 없습니다"
echo ""

# OAuth2 Well-known Configuration 확인
echo "2. OAuth2 Well-known Configuration:"
echo "   ${SYNO_ISSUER}/oauth2/.well-known/openid-configuration"
curl -s -k "${SYNO_ISSUER}/oauth2/.well-known/openid-configuration" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "   ⚠️  엔드포인트를 찾을 수 없습니다"
echo ""

# JWKS 확인
echo "3. JWKS (JSON Web Key Set):"
echo "   ${SYNO_ISSUER}/oauth2/.well-known/jwks.json"
curl -s -k "${SYNO_ISSUER}/oauth2/.well-known/jwks.json" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "   ⚠️  JWKS 엔드포인트를 찾을 수 없습니다"
echo ""

# 일반적인 OAuth2 엔드포인트 확인
echo "4. 일반적인 OAuth2 엔드포인트 확인:"
ENDPOINTS=(
    "${SYNO_ISSUER}/oauth2/authorize"
    "${SYNO_ISSUER}/oauth2/token"
    "${SYNO_ISSUER}/oauth2/userinfo"
    "${SYNO_ISSUER}/api/oauth2/authorize"
    "${SYNO_ISSUER}/api/oauth2/token"
)

for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "${endpoint}" 2>/dev/null)
    if [ "$STATUS" != "000" ] && [ "$STATUS" != "404" ]; then
        echo "   ✓ ${endpoint} (HTTP ${STATUS})"
    fi
done
echo ""

echo "=== 확인 완료 ==="
echo ""
echo "사용법:"
echo "  ./check-synology-oauth2.sh [hostname]"
echo "  예: ./check-synology-oauth2.sh backup.local"

