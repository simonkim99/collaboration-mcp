# Cursor에 MCP 서버 연결하기

## 서버 테스트 완료 ✅

모든 MCP 프로토콜 테스트가 통과했습니다:
- ✅ Initialize 응답 정상
- ✅ Tools List 응답 정상  
- ✅ List Services 툴 작동 정상

## Cursor 설정 방법

### 방법 1: Cursor UI를 통한 설정 (권장)

1. Cursor를 열고 `Cmd + ,` (또는 `Settings`) 를 눌러 설정을 엽니다
2. "MCP" 또는 "Model Context Protocol" 검색
3. "MCP Servers" 섹션 찾기
4. 다음 설정 추가:

```json
{
  "mcpServers": {
    "collaboration-mcp": {
      "command": "node",
      "args": ["/Users/simonkim/_works/collaboration-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### 방법 2: 설정 파일 직접 편집

설정 파일 위치: `~/Library/Application Support/Cursor/User/settings.json`

`settings.json` 파일에 다음을 추가:

```json
{
  "mcpServers": {
    "collaboration-mcp": {
      "command": "node",
      "args": ["/Users/simonkim/_works/collaboration-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### 방법 3: 워크스페이스별 설정

프로젝트 내 `.cursor/mcp.json` 파일 생성:

```json
{
  "mcpServers": {
    "collaboration-mcp": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "cwd": "${workspaceFolder}",
      "env": {}
    }
  }
}
```

## 서버 재시작

설정 변경 후 Cursor를 재시작해야 합니다.

## 테스트

서버가 연결되면 Cursor에서 다음 명령을 시도해보세요:

```
@mcp list_services
```

또는 채팅에서:
```
@mcp chat_with_service service="제니" prompt="안녕하세요"
```

## 현재 설정된 서비스

- **제니** (aliases: jenny): gemini -m gemini-2.5-fresh
- **제나** (aliases: jenna): grok -m grok-2.5-pro

## 문제 해결

서버가 연결되지 않으면:

1. 서버가 실행 가능한지 확인:
   ```bash
   node /Users/simonkim/_works/collaboration-mcp/dist/index.js
   ```

2. 테스트 스크립트 실행:
   ```bash
   ./test-mcp.sh
   ```

3. Cursor 로그 확인:
   - `Cmd + Shift + P` → "Developer: Toggle Developer Tools"
   - Console 탭에서 에러 확인

