# Cursor에서 MCP 서버 테스트하기

## 1. 서버 연결 확인

Cursor를 재시작한 후, 다음 단계로 서버가 제대로 연결되었는지 확인하세요:

### 방법 1: Cursor 채팅에서 테스트

Cursor의 채팅 창에서 다음을 입력하세요:

```
@mcp list_services
```

또는 Composer에서:
- `@` 를 입력하면 MCP 툴 목록이 표시됩니다
- `list_services` 선택

### 방법 2: MCP 패널 확인

- `Cmd + Shift + P` (또는 `Ctrl + Shift + P`)
- "MCP" 검색
- MCP 관련 명령어들을 확인할 수 있습니다

## 2. 기본 테스트 명령어

### 서비스 목록 확인
```
@mcp list_services
```

기대 결과:
```
Available services:

- 제니 (aliases: jenny): gemini -m gemini-2.5-fresh
- 제나 (aliases: jenna): grok -m grok-2.5-pro
```

### 서비스 설정 확인
```
@mcp get_service_config nameOrAlias="제니"
```

### 서비스로 채팅 (실제 서비스가 설치된 경우)

만약 `gemini` 또는 `grok` 명령어가 시스템에 설치되어 있다면:

```
@mcp chat_with_service service="제니" prompt="안녕하세요, 자기소개해주세요"
```

또는 별칭 사용:
```
@mcp chat_with_service service="jenny" prompt="Hello"
```

## 3. 문제 해결

### 서버가 응답하지 않는 경우

1. **서버 프로세스 확인**
   ```bash
   ps aux | grep "dist/index.js"
   ```

2. **서버 로그 확인**
   Cursor 개발자 도구:
   - `Cmd + Shift + P` → "Developer: Toggle Developer Tools"
   - Console 탭에서 에러 확인

3. **수동 서버 테스트**
   ```bash
   cd /Users/simonkim/_works/collaboration-mcp
   ./test-mcp.sh
   ```

### "서비스를 찾을 수 없습니다" 에러

`config/services.json` 파일이 올바른지 확인:
```bash
cat /Users/simonkim/_works/collaboration-mcp/config/services.json
```

### AI 서비스 명령어가 없는 경우

`gemini` 또는 `grok` 명령어가 시스템에 설치되어 있지 않으면, 실제로는 실행할 수 없습니다. 하지만 설정 조회는 가능합니다:

```
@mcp list_services
@mcp get_service_config nameOrAlias="제니"
```

## 4. 서비스 추가하기

새로운 서비스를 추가하려면:

```
@mcp add_service serviceConfig={"name":"새서비스","command":"my-ai","model":"model-1","options":{"promptFlag":"-p","modelFlag":"-m","dirFlag":"-d","inputFormat":"text","outputFormat":"text"},"role":"assistant","personality":"도움이 되는"}
```

또는 `config/services.json` 파일을 직접 편집할 수도 있습니다.

## 5. 성공 확인

다음이 정상 작동하면 성공입니다:
- ✅ `@mcp list_services` 가 서비스 목록을 반환
- ✅ `@mcp get_service_config` 가 서비스 설정을 반환
- ✅ Cursor에서 MCP 툴 목록에 collaboration-mcp 툴들이 표시됨

