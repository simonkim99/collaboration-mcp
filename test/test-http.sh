#!/bin/bash
# HTTP Transport 테스트 스크립트

echo "=== HTTP Transport MCP 서버 테스트 ==="
echo ""

# 서버 포트
PORT=${MCP_HTTP_PORT:-8091}
ENDPOINT="http://ubun-ai.local:${PORT}/mcp"

echo "1. 서버 시작 확인"
echo "   엔드포인트: ${ENDPOINT}"
echo "   서버가 실행 중인지 확인하세요 (MCP_TRANSPORT=http npm start)"
echo ""

# 서버가 실행 중인지 확인
if ! curl -s -o /dev/null -w "%{http_code}" "${ENDPOINT}" > /dev/null 2>&1; then
    echo "⚠️  서버가 실행되지 않았거나 연결할 수 없습니다."
    echo "   다음 명령어로 서버를 시작하세요:"
    echo "   MCP_TRANSPORT=http MCP_HTTP_PORT=${PORT} npm start"
    echo ""
    exit 1
fi

echo "2. Initialize 테스트"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"http-test","version":"1.0.0"}}}' | \
curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d @- | python3 -m json.tool 2>/dev/null | head -10
echo ""

echo "3. Tools List 테스트"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d @- | python3 -m json.tool 2>/dev/null | head -20
echo ""

echo "4. List Services 테스트"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_services","arguments":{}}}' | \
curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d @- | python3 -m json.tool 2>/dev/null | grep -A 5 "content" | head -8
echo ""

echo "5. OPTIONS (CORS) 테스트"
curl -s -X OPTIONS "${ENDPOINT}" \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control" | head -5
echo ""

echo "=== 테스트 완료 ==="
echo ""
echo "참고:"
echo "- 현재 HTTP transport는 기본 구현만 되어 있어 일부 기능이 작동하지 않을 수 있습니다"
echo "- 실제 MCP 프로토콜 브리징을 완료하려면 handleMcpRequest 함수를 개선해야 합니다"

