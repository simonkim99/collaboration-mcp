# 시놀로지 OAuth2 연결 문제 해결 가이드

## 현재 문제

브라우저에서 인증 URL 접속 시 "찾을 수 없다" 오류 발생

## 원인 분석

테스트 결과, 시놀로지 서버(`backup.local:5001`)에서 다음 경로들이 응답하지 않음:
- `/oauth2/authorize` → 404
- `/webapi/oauth2/authorize` → 404
- `/dsm/sso/oauth2/authorize` → 404

**가능한 원인:**
1. OAuth Service 패키지가 설치되지 않았거나 비활성화됨
2. SSO 클라이언트가 제대로 설정되지 않음
3. 시놀로지의 실제 OAuth2 엔드포인트 경로가 다름

## 해결 방법

### 1. 시놀로지 DSM에서 OAuth2 설정 확인

**DSM에 로그인하여 확인:**

1. **OAuth Service 패키지 확인**
   - `패키지 센터` → `OAuth Service` 검색
   - 설치되어 있는지 확인
   - 설치되어 있다면 실행 중인지 확인

2. **SSO 클라이언트 설정 확인**
   - `제어판` → `도메인/LDAP` → `SSO 클라이언트` 이동
   - `OpenID Connect SSO 서비스 활성화`가 체크되어 있는지 확인
   - `OpenID Connect SSO 설정` 클릭하여 설정 확인

3. **클라이언트 ID 확인**
   - SSO 클라이언트 목록에서 클라이언트 ID `96eca09f712a021c0252d9c40c866e91` 찾기
   - 해당 클라이언트의 설정 확인

4. **리디렉션 URI 확인**
   - 리디렉션 URI가 `http://ubun-ai.local:8091/oauth2/callback`로 등록되어 있는지 확인

### 2. 시놀로지에서 실제 OAuth2 엔드포인트 확인

시놀로지 DSM의 SSO 클라이언트 설정에서 다음 정보를 확인하세요:

1. **인증 URL (Authorization Endpoint)**
   - 보통 다음과 같은 형식:
     - `https://backup.local:5001/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login`
     - 또는 다른 경로일 수 있음

2. **Well-known Configuration 확인**
   - 시놀로지가 OpenID Connect를 지원하는 경우:
     ```
     https://backup.local:5001/.well-known/openid-configuration
     ```
   - 또는:
     ```
     https://backup.local:5001/oauth2/.well-known/openid-configuration
     ```

### 3. 대안: 시놀로지 WebAPI 사용

시놀로지의 표준 OAuth2 대신 WebAPI를 사용할 수도 있습니다. 하지만 OAuth2를 직접 사용하려면 OAuth Service 패키지가 필요합니다.

## 다음 단계

시놀로지 DSM에서 확인한 **실제 OAuth2 엔드포인트 URL**을 알려주시면, 설정을 업데이트하겠습니다.

확인해야 할 정보:
1. 인증 URL (Authorization Endpoint)
2. 토큰 URL (Token Endpoint)  
3. 사용자 정보 URL (UserInfo Endpoint)
4. JWKS URL (선택적)

## 임시 해결책: OAuth2 비활성화

개발 중이라면 OAuth2를 일시적으로 비활성화할 수 있습니다:

```bash
MCP_OAUTH2_ENABLED=false ./start-server.sh
```

이렇게 하면 인증 없이 MCP 서버를 테스트할 수 있습니다.

