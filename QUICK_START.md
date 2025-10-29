# 빠른 시작 가이드

## ✅ 설정 완료!

MCP 서버가 Cursor에 연결되었습니다.

## 다음 단계

### 1. Cursor 재시작
설정이 적용되도록 Cursor를 완전히 종료하고 다시 시작하세요.

### 2. 테스트하기

Cursor 채팅에서 다음 명령을 시도해보세요:

#### 서비스 목록 확인
```
@mcp list_services
```

#### 서비스로 채팅
```
@mcp chat_with_service service="제니" prompt="안녕하세요"
```

또는 별칭 사용:
```
@mcp chat_with_service service="jenny" prompt="Hello"
```

#### 서비스 설정 확인
```
@mcp get_service_config nameOrAlias="제니"
```

## 현재 설정된 서비스

### 제니 (Jenny)
- **이름**: 제니
- **별칭**: jenny
- **명령**: gemini
- **모델**: gemini-2.5-fresh
- **추론 모델**: gemini-2.5-pro

### 제나 (Jenna)
- **이름**: 제나
- **별칭**: jenna
- **명령**: grok
- **모델**: grok-2.5-pro
- **추론 모델**: grok-2.5-pro-thinking

## 사용 가능한 모든 MCP 툴

1. **list_services** - 등록된 서비스 목록 조회
2. **chat_with_service** - 서비스로 채팅
   - `service`: 서비스 이름 또는 별칭
   - `prompt`: 보낼 프롬프트
   - `useInference`: 추론 모델 사용 (선택)
   - `model`: 모델 오버라이드 (선택)
3. **get_service_config** - 서비스 설정 조회
4. **add_service** - 새 서비스 추가
5. **update_service** - 서비스 설정 수정
6. **remove_service** - 서비스 삭제

## 문제 해결

### 서버가 응답하지 않는 경우

1. 서버 경로 확인:
   ```bash
   ls -la /Users/simonkim/_works/collaboration-mcp/dist/index.js
   ```

2. 서버 테스트:
   ```bash
   cd /Users/simonkim/_works/collaboration-mcp
   ./test-mcp.sh
   ```

3. Cursor 로그 확인:
   - `Cmd + Shift + P` → "Developer: Toggle Developer Tools"
   - Console 탭에서 에러 확인

## 추가 설정

서비스 설정은 `config/services.json` 파일에서 수정할 수 있습니다.

설정 변경 후 서버를 재시작할 필요는 없습니다 (런타임에 설정 파일을 읽습니다).

