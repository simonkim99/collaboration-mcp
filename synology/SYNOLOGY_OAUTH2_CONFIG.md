# 시놀로지 OAuth2 설정 완료 정보

## 클라이언트 정보

- **클라이언트 ID**: `96eca09f712a021c0252d9c40c866e91`
- **클라이언트 시크릿**: 없음 (Public Client)
- **서버**: `backup.local` (포트 443, 기본 HTTPS)

## 환경 변수 설정

시놀로지 OAuth2를 사용하려면 다음 환경 변수를 설정하세요:

```bash
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=8091
export MCP_OAUTH2_ENABLED=true
export MCP_OAUTH2_ISSUER=https://backup.local
export MCP_OAUTH2_CLIENT_ID=96eca09f712a021c0252d9c40c866e91
export MCP_OAUTH2_USERINFO_ENDPOINT=https://backup.local/oauth2/userinfo
export MCP_OAUTH2_TOKEN_ENDPOINT=https://backup.local/oauth2/token
```

또는 `.env` 파일을 생성하여 설정:

```bash
MCP_TRANSPORT=http
MCP_HTTP_PORT=8091
MCP_OAUTH2_ENABLED=true
MCP_OAUTH2_ISSUER=https://backup.local:5091
MCP_OAUTH2_CLIENT_ID=96eca09f712a021c0252d9c40c866e91
MCP_OAUTH2_USERINFO_ENDPOINT=https://backup.local:5091/oauth2/userinfo
MCP_OAUTH2_TOKEN_ENDPOINT=https://backup.local:5091/oauth2/token
```

## 토큰 검증 방식

시크릿이 없는 Public Client이므로 다음과 같은 순서로 토큰을 검증합니다:

1. **JWKS 검증** (시놀로지에서 JWKS 엔드포인트를 제공하는 경우)
2. **Introspection** (시크릿 없이 Bearer 토큰으로 시도)
3. **Userinfo 엔드포인트** (최종 fallback) - 현재 사용 중

Userinfo 엔드포인트를 사용하면:
- Bearer 토큰을 Authorization 헤더에 포함하여 `/oauth2/userinfo`에 요청
- 유효한 토큰이면 사용자 정보 반환
- 유효하지 않으면 401 에러

## 서버 시작

```bash
MCP_TRANSPORT=http \
MCP_HTTP_PORT=8091 \
MCP_OAUTH2_ENABLED=true \
MCP_OAUTH2_ISSUER=https://backup.local \
MCP_OAUTH2_CLIENT_ID=96eca09f712a021c0252d9c40c866e91 \
MCP_OAUTH2_USERINFO_ENDPOINT=https://backup.local/oauth2/userinfo \
npm start
```

## 토큰 획득 방법

시놀로지 OAuth2 서버에서 토큰을 획득하려면 OAuth2 Authorization Code Flow를 사용해야 합니다:

1. **인증 엔드포인트로 리디렉션**:
   ```
   https://backup.local/oauth2/authorize?
     client_id=96eca09f712a021c0252d9c40c866e91&
     response_type=code&
     redirect_uri=http://ubun-ai.local:8091/oauth2/callback&
     scope=openid profile email
   ```

2. **인증 후 리디렉션으로 인증 코드 받기**

3. **토큰 엔드포인트로 액세스 토큰 교환**:
   ```bash
   curl -X POST https://backup.local/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code=YOUR_AUTH_CODE" \
     -d "client_id=96eca09f712a021c0252d9c40c866e91" \
     -d "redirect_uri=http://ubun-ai.local:8091/oauth2/callback"
   ```

4. **응답에서 access_token 추출**

## 테스트

### 1. 인증 없이 요청 (401 예상)

```bash
curl -X POST http://ubun-ai.local:8091/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

예상 응답:
```json
{
  "error": "Unauthorized",
  "message": "OAuth2 token required"
}
```

### 2. 토큰으로 요청

```bash
OAUTH2_TOKEN=your-access-token-here
curl -X POST http://ubun-ai.local:8091/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OAUTH2_TOKEN}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### 3. Userinfo 엔드포인트 직접 테스트

```bash
# 유효한 토큰으로 테스트
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://backup.local/oauth2/userinfo
```

## 문제 해결

### 인증서 오류

시놀로지가 자체 서명 인증서를 사용하는 경우, Node.js에서 SSL 검증을 비활성화해야 할 수 있습니다 (개발 환경만):

```typescript
// 개발 환경에서만 사용
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

**주의**: 프로덕션에서는 절대 사용하지 마세요!

### Userinfo 엔드포인트가 401을 반환하는 경우

1. 토큰이 만료되었는지 확인
2. 토큰이 올바른 형식인지 확인 (Bearer 토큰)
3. 시놀로지에서 클라이언트 ID가 올바르게 등록되었는지 확인

### CORS 오류

브라우저에서 테스트하는 경우, 시놀로지 서버의 CORS 설정이 필요할 수 있습니다. 
서버에서 직접 curl로 테스트하면 CORS 문제를 피할 수 있습니다.

