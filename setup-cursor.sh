#!/bin/bash
# Cursor MCP 서버 설정 스크립트

CURSOR_SETTINGS="$HOME/Library/Application Support/Cursor/User/settings.json"
BACKUP_FILE="${CURSOR_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"

echo "=== Cursor MCP 서버 설정 ==="
echo ""

# 백업 생성
if [ -f "$CURSOR_SETTINGS" ]; then
    echo "설정 파일 백업 중: $BACKUP_FILE"
    cp "$CURSOR_SETTINGS" "$BACKUP_FILE"
fi

# Python 스크립트로 JSON 수정
python3 << 'PYTHON_SCRIPT'
import json
import os
import sys

settings_path = os.path.expanduser("~/Library/Application Support/Cursor/User/settings.json")
server_path = "/Users/simonkim/_works/collaboration-mcp/dist/index.js"

# 설정 파일 읽기
if os.path.exists(settings_path):
    with open(settings_path, 'r', encoding='utf-8') as f:
        settings = json.load(f)
else:
    settings = {}

# MCP 서버 설정 추가
if "mcpServers" not in settings:
    settings["mcpServers"] = {}

settings["mcpServers"]["collaboration-mcp"] = {
    "command": "node",
    "args": [server_path],
    "env": {}
}

# 설정 파일 저장
os.makedirs(os.path.dirname(settings_path), exist_ok=True)
with open(settings_path, 'w', encoding='utf-8') as f:
    json.dump(settings, f, indent=4, ensure_ascii=False)

print(f"✅ Cursor 설정 파일 업데이트 완료: {settings_path}")
print(f"✅ MCP 서버 경로: {server_path}")
PYTHON_SCRIPT

echo ""
echo "=== 설정 완료 ==="
echo ""
echo "다음 단계:"
echo "1. Cursor를 재시작하세요"
echo "2. Cursor에서 @mcp list_services 명령을 테스트하세요"
echo ""

