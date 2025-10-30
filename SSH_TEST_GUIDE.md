# SSH 접속 상태에서 MCP 서버 테스트 가이드

## SSH 접속 시 동작 방식

MCP 서버는 SSH 접속 상태에서도 정상 작동합니다. 다음과 같이 동작합니다:

### 1. 작업 디렉토리
- `process.cwd()`를 사용하여 현재 SSH 세션의 작업 디렉토리를 동적으로 사용
- `workingDir` 설정이 없으면 SSH 접속 후 현재 위치를 사용

### 2. 환경 변수
- SSH 세션의 환경 변수를 상속받음 (`process.env`)
- 서비스별 환경 변수 (`env` 설정)는 SSH 환경에서도 정상 작동

### 3. 설정 파일 경로
- 상대 경로: `config/services.json` (현재 작업 디렉토리 기준)
- SSH 접속 후 프로젝트 디렉토리로 이동하면 자동으로 찾음

## SSH 접속 후 테스트 방법

### 1. 원격 서버에 연결
```bash
ssh user@remote-server
cd /path/to/collaboration-mcp
```

### 2. 필요한 명령어 확인
```bash
which gemini
which grok
which node
```

### 3. MCP 서버 테스트
```bash
# 기본 테스트
./test-ssh-scenario.sh

# 또는 직접 테스트
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_services","arguments":{}}}' | node dist/index.js
```

### 4. Cursor에서 SSH 연결

SSH 접속 상태에서 Cursor를 사용하는 경우:

**방법 1: 원격 서버에 직접 MCP 서버 설정**
- 원격 서버의 `~/.cursor/` 또는 프로젝트 디렉토리에 설정 추가
- 원격 서버 경로로 설정

**방법 2: 원격 파일 시스템 마운트**
- SSHFS 등을 사용하여 원격 디렉토리를 로컬에 마운트
- 로컬 Cursor에서 마운트된 경로 사용

## SSH 접속 시 주의사항

1. **명령어 경로**: 원격 서버에 `gemini`, `grok` 등이 설치되어 있어야 함
2. **Node.js 버전**: 원격 서버에 Node.js가 설치되어 있어야 함
3. **환경 변수**: SSH 세션의 환경 변수가 자동으로 전달됨
4. **네트워크**: API 호출이 필요한 서비스는 원격 서버에서 인터넷 접근 가능해야 함

## 실제 SSH 테스트 시나리오

```bash
# 1. SSH 접속
ssh user@remote-server

# 2. 프로젝트 디렉토리로 이동
cd /path/to/collaboration-mcp

# 3. 환경 확인
echo "작업 디렉토리: $(pwd)"
echo "사용자: $USER"
echo "호스트: $HOSTNAME"

# 4. MCP 서버 테스트
node dist/index.js
```

## SSH 접속 상태 확인

SSH 접속 상태에서 다음 환경 변수를 확인할 수 있습니다:
- `SSH_CONNECTION`: SSH 연결 정보
- `SSH_CLIENT`: SSH 클라이언트 정보
- `SSH_TTY`: SSH 터미널 정보

이 환경 변수들을 통해 SSH 접속 상태를 감지할 수 있습니다.

