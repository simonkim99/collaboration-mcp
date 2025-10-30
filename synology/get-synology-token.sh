#!/bin/bash
# 시놀로지 OAuth2 토큰 획득 가이드

CLIENT_ID="96eca09f712a021c0252d9c40c866e91"
ISSUER="https://backup.local:5001/webman/sso"
AUTHORIZATION_ENDPOINT="https://backup.local:5001/webman/sso/SSOOauth.cgi"
TOKEN_ENDPOINT="https://backup.local:5001/webman/sso/SSOAccessToken.cgi"
USERINFO_ENDPOINT="https://backup.local:5001/webman/sso/SSOUserInfo.cgi"
REDIRECT_URI="http://ubun-ai.local:8091/oauth2/callback"

# PKCE 설정 (Proof Key for Code Exchange)
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n "${CODE_VERIFIER}" | openssl dgst -binary -sha256 | openssl base64 | tr -d "=+/" | cut -c1-43)

echo "=== 시놀로지 OAuth2 토큰 획득 ==="
echo ""

echo "1. 인증 URL 생성"
echo ""
echo "방법 A: Authorization Code Flow (PKCE 사용)"
echo "   브라우저에서 다음 URL을 열어 인증하세요:"
echo ""
AUTH_URL_CODE="${AUTHORIZATION_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=openid+email&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256"
echo "   ${AUTH_URL_CODE}"
echo ""
echo "   PKCE Code Verifier (토큰 교환에 필요):"
echo "   ${CODE_VERIFIER}"
echo ""
echo "방법 B: Implicit Flow (직접 토큰 받기, Public Client용)"
echo "   브라우저에서 다음 URL을 열어 인증하세요:"
echo ""
AUTH_URL_TOKEN="${AUTHORIZATION_ENDPOINT}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=openid+email"
echo "   ${AUTH_URL_TOKEN}"
echo ""
echo "   ⚠️  Implicit Flow 사용 시 브라우저 주소창의 fragment(#)에서 access_token을 추출하세요"
echo "   예: http://ubun-ai.local:8091/oauth2/callback#access_token=TOKEN&token_type=Bearer&expires_in=3600"
echo ""

echo "2. 인증 후 리디렉션 URL에서 code 파라미터 추출"
echo "   예: http://ubun-ai.local:8091/oauth2/callback?code=ABC123..."
echo ""

echo "3. 인증 코드로 토큰 교환 (PKCE 사용)"
echo "   다음 명령어를 실행하세요 (CODE를 실제 인증 코드로 변경):"
echo ""
echo "   CODE=your-auth-code-here"
echo "   CODE_VERIFIER=\"${CODE_VERIFIER}\""
echo "   curl -k -X POST ${TOKEN_ENDPOINT} \\"
echo "     -H 'Content-Type: application/x-www-form-urlencoded' \\"
echo "     -d 'grant_type=authorization_code' \\"
echo "     -d 'code=\${CODE}' \\"
echo "     -d 'client_id=${CLIENT_ID}' \\"
echo "     -d 'redirect_uri=${REDIRECT_URI}' \\"
echo "     -d 'code_verifier=\${CODE_VERIFIER}'"
echo ""

echo "4. 응답에서 access_token 추출하여 사용"
echo "   응답 예시:"
echo "   {"
echo "     \"access_token\": \"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...\","
echo "     \"token_type\": \"Bearer\","
echo "     \"expires_in\": 3600"
echo "   }"
echo ""

echo "5. 토큰으로 MCP 서버 테스트"
echo "   ACCESS_TOKEN=your-access-token-here"
echo "   curl -X POST http://ubun-ai.local:8091/mcp \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer \${ACCESS_TOKEN}' \\"
echo "     -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}'"
echo ""

# 만약 명령줄 인수로 코드가 제공되면 자동으로 토큰 교환 시도
if [ -n "$1" ]; then
    CODE="$1"
    echo "=== 자동 토큰 교환 시도 ==="
    echo "인증 코드: ${CODE}"
    echo ""
    
    # PKCE Code Verifier 사용 (없으면 기본 방식 시도)
    CODE_VERIFIER="${2:-${CODE_VERIFIER}}"
    
    if [ -z "${CODE_VERIFIER}" ]; then
        echo "⚠️  PKCE Code Verifier가 없습니다. 기본 방식으로 시도합니다."
        echo ""
        RESPONSE=$(curl -s -k -X POST "${TOKEN_ENDPOINT}" \
          -H "Content-Type: application/x-www-form-urlencoded" \
          -d "grant_type=authorization_code" \
          -d "code=${CODE}" \
          -d "client_id=${CLIENT_ID}" \
          -d "redirect_uri=${REDIRECT_URI}" 2>&1)
    else
        echo "PKCE Code Verifier 사용: ${CODE_VERIFIER}"
        echo ""
        RESPONSE=$(curl -s -k -X POST "${TOKEN_ENDPOINT}" \
          -H "Content-Type: application/x-www-form-urlencoded" \
          -d "grant_type=authorization_code" \
          -d "code=${CODE}" \
          -d "client_id=${CLIENT_ID}" \
          -d "redirect_uri=${REDIRECT_URI}" \
          -d "code_verifier=${CODE_VERIFIER}" 2>&1)
    fi
    
    echo "토큰 교환 요청 전송 중..."
    
    # 디버깅: 실제 요청 내용 확인
    echo "요청 상세:"
    if [ -z "${CODE_VERIFIER}" ]; then
        echo "  grant_type=authorization_code"
        echo "  code=${CODE}"
        echo "  client_id=${CLIENT_ID}"
        echo "  redirect_uri=${REDIRECT_URI}"
    else
        echo "  grant_type=authorization_code"
        echo "  code=${CODE}"
        echo "  client_id=${CLIENT_ID}"
        echo "  redirect_uri=${REDIRECT_URI}"
        echo "  code_verifier=${CODE_VERIFIER}"
    fi
    echo ""
    
    # 에러 체크
    if echo "${RESPONSE}" | grep -q "curl:"; then
        echo "⚠️  curl 오류 발생:"
        echo "${RESPONSE}"
        return
    fi
    
    echo "응답:"
    echo "${RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${RESPONSE}"
    echo ""
    
    # 성공 여부 확인
    if echo "${RESPONSE}" | grep -q '"access_token"'; then
        echo "✅ 토큰을 성공적으로 받았습니다!"
        echo ""
        echo "액세스 토큰:"
        echo "${RESPONSE}" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', 'N/A'))" 2>/dev/null || echo "N/A"
        echo ""
        echo "MCP 서버 테스트:"
        echo "  export TOKEN=\$(echo '${RESPONSE}' | python3 -c \"import sys, json; print(json.load(sys.stdin).get('access_token', ''))\" 2>/dev/null)"
        echo "  curl -X POST http://ubun-ai.local:8091/mcp \\"
        echo "    -H 'Content-Type: application/json' \\"
        echo "    -H \"Authorization: Bearer \${TOKEN}\" \\"
        echo "    -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{}}'"
    elif echo "${RESPONSE}" | grep -q '"error"'; then
        ERROR_MSG=$(echo "${RESPONSE}" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error_description', json.load(sys.stdin).get('error', 'Unknown error')))" 2>/dev/null || echo "알 수 없는 오류")
        echo "❌ 토큰 교환 실패: ${ERROR_MSG}"
        echo ""
        echo "가능한 원인:"
        echo "  1. 인증 코드가 이미 사용되었거나 만료됨 (인증 코드는 일회용)"
        echo "  2. redirect_uri가 정확히 일치하지 않음"
        echo "  3. 새로운 인증 코드를 받아야 함"
        echo ""
        echo "해결 방법:"
        echo "  1. 브라우저에서 인증 URL을 다시 열어서 새로운 인증 코드를 받으세요"
        echo "  2. OAuth2 콜백 페이지에서 제공된 curl 명령어를 사용하세요"
        echo ""
        echo "⚠️  시놀로지가 Public Client(시크릿 없음)를 지원하지 않을 수 있습니다."
        echo "   대신 Implicit Flow를 사용하세요:"
        echo ""
        echo "   ${AUTH_URL_TOKEN}"
        echo ""
        echo "   브라우저에서 위 URL을 열면 직접 토큰을 받을 수 있습니다."
    fi
fi

