# Cursor MCP 서버 연결 설정

## 설정 방법

Cursor에서 MCP 서버를 연결하려면 다음 단계를 따르세요:

### 1. Cursor 설정 파일 위치

Cursor의 MCP 설정 파일은 다음 위치에 있습니다:
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- 또는 Cursor 설정에서 MCP 서버를 추가

### 2. 설정 파일에 추가

Cursor 설정 파일에 다음 내용을 추가하세요:

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

또는 상대 경로를 사용하려면:

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

### 3. 테스트

서버가 정상 작동하는지 확인:

```bash
cd /Users/simonkim/_works/collaboration-mcp
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
```

정상 응답 예시:
```json
{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"collaboration-mcp","version":"0.1.0"}},"jsonrpc":"2.0","id":1}
```

### 4. 사용 가능한 MCP 툴

서버가 연결되면 다음 툴들을 사용할 수 있습니다:

- `list_services`: 등록된 서비스 목록 조회
- `chat_with_service`: 서비스로 채팅
- `get_service_config`: 서비스 설정 조회
- `add_service`: 새 서비스 추가
- `update_service`: 서비스 설정 수정
- `remove_service`: 서비스 삭제

### 5. 예시 명령

```
@mcp list_services
@mcp chat_with_service service="제니" prompt="안녕하세요"
```

