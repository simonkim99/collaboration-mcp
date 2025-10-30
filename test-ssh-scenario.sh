#!/bin/bash
# SSH 접속 시나리오 테스트 스크립트

echo "=== SSH 접속 상태에서 MCP 서버 테스트 ==="
echo ""

# SSH 환경 변수 확인
echo "1. SSH 환경 변수 확인:"
echo "   SSH_CONNECTION: ${SSH_CONNECTION:-없음}"
echo "   SSH_CLIENT: ${SSH_CLIENT:-없음}"
echo "   USER: $USER"
echo "   HOME: $HOME"
echo "   PWD: $PWD"
echo ""

# 현재 작업 디렉토리 확인
echo "2. 현재 작업 디렉토리:"
pwd
echo ""

# 필요한 명령어들 확인
echo "3. 필요한 명령어 확인:"
echo -n "   gemini: "
which gemini > /dev/null && echo "✓ 설치됨 ($(which gemini))" || echo "✗ 없음"
echo -n "   grok: "
which grok > /dev/null && echo "✓ 설치됨 ($(which grok))" || echo "✗ 없음"
echo -n "   node: "
which node > /dev/null && echo "✓ 설치됨 ($(which node))" || echo "✗ 없음"
echo ""

# MCP 서버 기본 테스트
echo "4. MCP 서버 기본 기능 테스트:"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"ssh-test","version":"1.0.0"}}}' | node dist/index.js 2>&1 | python3 -m json.tool 2>/dev/null | grep -E "(protocolVersion|serverInfo)" | head -3
echo ""

# 서비스 목록 조회
echo "5. 서비스 목록 조회:"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_services","arguments":{}}}' | node dist/index.js 2>&1 | python3 -m json.tool 2>/dev/null | grep -A 5 "content" | head -8
echo ""

# 작업 디렉토리 테스트
echo "6. 작업 디렉토리 동적 확인 테스트:"
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"chat_natural","arguments":{"input":"제니 현재 작업 디렉토리가 어디야?"}}}' | node dist/index.js 2>&1 | python3 -m json.tool 2>/dev/null | grep -A 3 "content" | head -5
echo ""

echo "=== 테스트 완료 ==="
echo ""
echo "SSH 접속 시 고려사항:"
echo "1. 원격 서버에 gemini, grok 명령어가 설치되어 있어야 함"
echo "2. 원격 서버에 Node.js가 설치되어 있어야 함"
echo "3. 설정 파일 경로는 상대 경로나 원격 서버 경로로 설정 필요"
echo "4. 환경 변수는 SSH 세션의 환경 변수를 상속받음"

