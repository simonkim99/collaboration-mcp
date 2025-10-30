#!/bin/bash
# MCP 서버 테스트 스크립트

echo "=== MCP 서버 테스트 ==="
echo ""

echo "1. Initialize 테스트:"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js

echo ""
echo "2. Tools List 테스트:"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node dist/index.js

echo ""
echo "3. List Services 테스트:"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_services","arguments":{}}}' | node dist/index.js

echo ""
echo "=== 테스트 완료 ==="

