# HTTP Transport 보안 검토 및 개선 방안

## 현재 상태 분석

### 현재 구현 상태
1. **HTTP Transport**: 기본 HTTP 서버만 구현됨
2. **보안**: 인증/인가 없음, CORS가 모든 origin 허용 (`*`)
3. **MCP 프로토콜 브리징**: `handleMcpRequest`가 placeholder 구현
4. **HTTPS**: 미지원
5. **인증**: 없음

### 문제점
- **로컬 환경**: 문제 없음 (로컬에서만 사용)
- **외부 접속**: 보안 위험
  - 평문 HTTP로 데이터 전송 (중간자 공격 가능)
  - 인증 없이 모든 요청 허용
  - API 키나 서비스 설정 노출 위험

## 외부 접속 시 필요한 보안 기능

### 1. HTTPS/TLS (필수)
**목적**: 데이터 전송 암호화

**구현 방법**:
- Node.js의 `https` 모듈 사용
- SSL/TLS 인증서 필요
  - 개발: 자체 서명 인증서 (self-signed)
  - 프로덕션: Let's Encrypt 등 신뢰할 수 있는 CA 인증서

**환경 변수**:
```bash
MCP_HTTPS=true
MCP_SSL_CERT=/path/to/cert.pem
MCP_SSL_KEY=/path/to/key.pem
MCP_SSL_PORT=443
```

### 2. 인증 방식 옵션

#### 옵션 A: API Key 인증 (간단, 빠른 구현)
**장점**:
- 구현 간단
- 빠른 프로토타이핑에 적합
- 환경 변수나 설정 파일로 관리 가능

**단점**:
- 토큰 만료/갱신 없음
- 사용자별 권한 관리 어려움

**구현**:
- HTTP 헤더에 API 키 검증: `Authorization: Bearer <api-key>`
- 환경 변수: `MCP_API_KEY` 또는 설정 파일

#### 옵션 B: OAuth2 인증 (강력, 프로덕션 적합)
**장점**:
- 표준 인증 프로토콜
- 토큰 만료/갱신 지원
- 사용자별 권한 관리 가능
- 여러 OAuth2 제공자 지원 (GitHub, Google, etc.)

**단점**:
- 구현 복잡도 높음
- OAuth2 서버/클라이언트 설정 필요

**구현**:
- OAuth2 Bearer Token 검증
- JWT 토큰 검증 또는 OAuth2 인증 서버 연동
- 라이브러리: `passport`, `jsonwebtoken`, `oauth2-server`

#### 옵션 C: 기타 인증 방식
- **mTLS (Mutual TLS)**: 클라이언트 인증서 검증
- **Basic Auth**: 단순하지만 HTTPS 필수
- **IP Whitelist**: 특정 IP만 허용 (간단하지만 유연성 낮음)

### 3. CORS 설정 강화
**현재**: 모든 origin 허용 (`*`)
**개선**: 특정 origin만 허용

```typescript
const ALLOWED_ORIGINS = process.env.MCP_CORS_ORIGINS?.split(',') || ['*'];
```

## 구현 계획

### Phase 1: 기본 HTTP 테스트 및 프로토콜 브리징 개선
- [ ] 현재 HTTP transport 테스트
- [ ] 실제 MCP 서버와 HTTP 요청 브리징 구현
- [ ] MCP 프로토콜 메시지 핸들링 개선

### Phase 2: HTTPS 지원 추가
- [ ] HTTPS 서버 구현
- [ ] 자체 서명 인증서 생성 스크립트
- [ ] 환경 변수로 HTTP/HTTPS 선택 가능하게

### Phase 3: API Key 인증 (빠른 보안)
- [ ] API Key 검증 미들웨어
- [ ] 환경 변수/설정 파일에서 키 관리
- [ ] 헤더 기반 인증

### Phase 4: OAuth2 인증 (선택적, 고급)
- [ ] OAuth2 라이브러리 통합
- [ ] Bearer Token 검증
- [ ] OAuth2 제공자 설정

### Phase 5: 보안 강화
- [ ] Rate Limiting (DDoS 방지)
- [ ] Request Validation 강화
- [ ] 로깅 및 모니터링
- [ ] CORS 설정 강화

## 권장 구현 순서

1. **우선**: HTTP 테스트 및 프로토콜 브리징 개선
2. **다음**: HTTPS 지원 (자체 서명 인증서로 시작)
3. **그 다음**: API Key 인증 (빠른 보안)
4. **필요시**: OAuth2 추가 (프로덕션 환경)

## 보안 고려사항

### 개발 환경
- 자체 서명 인증서 사용 OK
- API Key나 OAuth2 선택적

### 프로덕션 환경
- **필수**: HTTPS (신뢰할 수 있는 CA 인증서)
- **권장**: OAuth2 또는 강력한 API Key 관리
- **추가**: Rate Limiting, 로깅, 모니터링

## 설정 예시

### 로컬 개발 (보안 없음)
```bash
MCP_TRANSPORT=http
MCP_HTTP_PORT=3000
```

### 로컬 HTTPS (자체 서명 인증서)
```bash
MCP_TRANSPORT=https
MCP_HTTPS_PORT=3000
MCP_SSL_CERT=./certs/localhost.crt
MCP_SSL_KEY=./certs/localhost.key
```

### 프로덕션 (HTTPS + API Key)
```bash
MCP_TRANSPORT=https
MCP_HTTPS_PORT=443
MCP_SSL_CERT=/etc/ssl/certs/mcp-server.crt
MCP_SSL_KEY=/etc/ssl/private/mcp-server.key
MCP_API_KEY=your-secure-api-key-here
MCP_CORS_ORIGINS=https://client1.example.com,https://client2.example.com
```

### 프로덕션 (HTTPS + OAuth2)
```bash
MCP_TRANSPORT=https
MCP_HTTPS_PORT=443
MCP_SSL_CERT=/etc/ssl/certs/mcp-server.crt
MCP_SSL_KEY=/etc/ssl/private/mcp-server.key
MCP_OAUTH2_ENABLED=true
MCP_OAUTH2_ISSUER=https://auth.example.com
MCP_OAUTH2_AUDIENCE=mcp-server
MCP_CORS_ORIGINS=https://client1.example.com
```

## 참고 자료

- [Node.js HTTPS 문서](https://nodejs.org/api/https.html)
- [Let's Encrypt](https://letsencrypt.org/)
- [OAuth2 표준](https://oauth.net/2/)
- [MCP 프로토콜 명세](https://modelcontextprotocol.io/)

