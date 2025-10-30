# 시놀로지 OAuth2 서버 연동 가이드

## 개요

시놀로지 NAS (`backup.local`)의 OAuth2 서비스를 사용하여 MCP 서버에 인증을 추가합니다.

## 1. 시놀로지 NAS 설정

### 1.1 OAuth Service 패키지 설치

1. DSM에 관리자 계정으로 로그인
2. `패키지 센터` → `OAuth Service` 검색 및 설치
3. 설치 후 활성화

### 1.2 SSO 클라이언트 설정

1. `제어판` → `도메인/LDAP` → `SSO 클라이언트` 이동
2. `OpenID Connect SSO 서비스 활성화` 선택
3. `OpenID Connect SSO 설정` 클릭

### 1.3 OAuth2 애플리케이션 등록

시놀로지의 OAuth2/OpenID Connect 엔드포인트를 확인하려면:

**Well-known Configuration Endpoint:**
```
https://backup.local/.well-known/openid-configuration
```

또는 시놀로지에서 직접 OAuth2 애플리케이션 등록:

1. **애플리케이션 이름**: `collaboration-mcp`
2. **리디렉션 URI**: `http://ubun-ai.local:8091/oauth2/callback` (또는 실제 MCP 서버 URL)
3. **클라이언트 ID**: 시놀로지에서 생성된 클라이언트 ID
4. **클라이언트 시크릿**: 시놀로지에서 생성된 클라이언트 시크릿
5. **권한 부여 범위**: `openid profile email`

### 1.4 시놀로지 OAuth2 엔드포인트 확인

시놀로지 NAS의 일반적인 OAuth2 엔드포인트:

```
인증 엔드포인트: https://backup.local/oauth2/authorize
토큰 엔드포인트: https://backup.local/oauth2/token
사용자 정보 엔드포인트: https://backup.local/oauth2/userinfo
JWKS 엔드포인트: https://backup.local/oauth2/.well-known/jwks.json
```

**실제 엔드포인트 확인 방법:**
```bash
# Well-known configuration 조회
curl https://backup.local/.well-known/openid-configuration

# 또는
curl https://backup.local/oauth2/.well-known/openid-configuration
```

## 2. MCP 서버 설정

### 2.1 환경 변수 설정

`.env` 파일 또는 환경 변수에 다음 추가:

```bash
# OAuth2 활성화
MCP_OAUTH2_ENABLED=true

# 시놀로지 OAuth2 서버 설정
MCP_OAUTH2_ISSUER=https://backup.local
MCP_OAUTH2_AUTHORIZATION_ENDPOINT=https://backup.local/oauth2/authorize
MCP_OAUTH2_TOKEN_ENDPOINT=https://backup.local/oauth2/token
MCP_OAUTH2_USERINFO_ENDPOINT=https://backup.local/oauth2/userinfo
MCP_OAUTH2_JWKS_ENDPOINT=https://backup.local/oauth2/.well-known/jwks.json

# 클라이언트 정보
MCP_OAUTH2_CLIENT_ID=your-client-id-from-synology
MCP_OAUTH2_CLIENT_SECRET=your-client-secret-from-synology

# 리디렉션 URI (시놀로지에 등록한 것과 일치해야 함)
MCP_OAUTH2_REDIRECT_URI=http://ubun-ai.local:8091/oauth2/callback

# 검증 옵션
MCP_OAUTH2_AUDIENCE=mcp-server  # (선택적)
MCP_OAUTH2_SCOPE=openid profile email
```

### 2.2 토큰 검증 방식

**옵션 A: JWT 토큰 검증 (권장)**
- 시놀로지가 JWT 토큰을 발급하는 경우
- JWKS 엔드포인트에서 공개 키를 가져와 검증
- 오프라인 검증 가능 (서버 부하 적음)

**옵션 B: 토큰 Introspection**
- OAuth2 토큰 introspection 엔드포인트 사용
- 매 요청마다 시놀로지 서버에 검증 요청
- 토큰 상태 실시간 확인 가능

## 3. 구현 내용

### 3.1 OAuth2 미들웨어

HTTP 요청의 `Authorization: Bearer <token>` 헤더에서 토큰을 추출하고 검증합니다.

### 3.2 토큰 검증 플로우

1. 요청 헤더에서 Bearer 토큰 추출
2. 토큰 형식 확인 (JWT인지 확인)
3. 검증 방식 선택:
   - JWT: JWKS에서 공개 키 가져와서 검증
   - Access Token: Introspection 엔드포인트로 검증
4. 검증 성공 시 요청 계속 진행
5. 검증 실패 시 401 Unauthorized 반환

### 3.3 필요한 라이브러리

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "jwks-rsa": "^3.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0"
  }
}
```

## 4. 테스트

### 4.1 시놀로지 엔드포인트 확인

```bash
# Well-known configuration 확인
curl https://backup.local/.well-known/openid-configuration

# JWKS 확인
curl https://backup.local/oauth2/.well-known/jwks.json
```

### 4.2 토큰 획득 (시놀로지에서)

OAuth2 Authorization Code Flow를 통해 토큰 획득:
1. 브라우저에서 인증 엔드포인트 접속
2. 로그인 후 인증 코드 받기
3. 토큰 엔드포인트로 액세스 토큰 교환

### 4.3 MCP 서버에 토큰 전송

```bash
curl -X POST http://ubun-ai.local:8091/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## 5. 문제 해결

### 시놀로지 Well-known 엔드포인트를 찾을 수 없는 경우

시놀로지 버전에 따라 엔드포인트가 다를 수 있습니다:

- `https://backup.local/.well-known/openid-configuration`
- `https://backup.local/oauth2/.well-known/openid-configuration`
- `https://backup.local/api/oauth2/.well-known/openid-configuration`

### 인증서 오류가 발생하는 경우

시놀로지의 자체 서명 인증서를 사용하는 경우:
- Node.js에서 자체 서명 인증서를 허용하도록 설정 필요
- 또는 프로덕션에서는 신뢰할 수 있는 CA 인증서 사용

### CORS 오류

시놀로지 OAuth2 서버의 CORS 설정 확인 필요 (시놀로지 관리자 설정 참조)

## 6. 보안 고려사항

1. **HTTPS 사용**: OAuth2는 반드시 HTTPS를 통해 통신해야 함
2. **클라이언트 시크릿 보호**: 환경 변수나 안전한 설정 파일에 저장
3. **토큰 만료 확인**: 토큰의 `exp` 클레임 확인
4. **토큰 재사용 방지**: Refresh Token으로 새 토큰 발급

## 참고 자료

- [OAuth 2.0 표준](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [시놀로지 SSO 문서](https://kb.synology.com/)
- [JWKS (JSON Web Key Set)](https://tools.ietf.org/html/rfc7517)

