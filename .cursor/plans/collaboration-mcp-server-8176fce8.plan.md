<!-- 8176fce8-64bf-4926-8847-3c1fb3f24b6b faea2e3e-2c89-4210-a969-aee428a93993 -->
# Collaboration MCP Server 구현 계획

## 프로젝트 구조

```
collaboration-mcp/
├── src/
│   ├── index.ts              # 진입점 (stdio/HTTP 선택)
│   ├── server.ts             # MCP 서버 코어
│   ├── transport/
│   │   ├── stdio.ts          # stdio 전송 레이어
│   │   └── http.ts           # HTTP 전송 레이어
│   ├── services/
│   │   ├── executor.ts       # 쉘 명령 실행기
│   │   ├── parser.ts         # 출력 파싱 (텍스트/stream-json)
│   │   └── formatter.ts      # 프롬프트 포맷팅 (role/personality)
│   ├── config/
│   │   ├── manager.ts        # 설정 파일 관리
│   │   ├── schema.ts         # TypeScript 타입 정의
│   │   └── defaults.json     # 기본 설정
│   └── tools/
│       ├── chat.ts           # 채팅 툴 (서비스 호출)
│       └── services.ts       # 서비스 관리 툴
├── config/
│   └── services.json         # 서비스 설정 파일
├── package.json
├── tsconfig.json
└── README.md
```

## 주요 기능

### 1. 서비스 설정 스키마 (`config/schema.ts`)

- `name`: 서비스 이름 (제니, 제나 등)
- `command`: 기본 쉘 명령
- `model`: 기본 모델
- `inferenceModel`: 추론 모델 (선택)
- `options`: 
  - `promptFlag`: 프롬프트 플래그 (`-p` 또는 `positional`)
  - `modelFlag`: 모델 플래그 (`-m`)
  - `dirFlag`: 디렉토리 플래그 (`-d`)
  - `inputFormat`: `text` 또는 `stream-json`
  - `outputFormat`: `text` 또는 `stream-json`
- `env`: 환경 변수 (APIKEY, BASEURL 등)
- `role`: 기본 역할
- `personality`: 성격 설명
- `workingDir`: 작업 디렉토리 (선택)

### 2. 쉘 명령 실행기 (`services/executor.ts`)

- 환경 변수 설정 후 명령 실행
- 작업 디렉토리 설정
- 입력/출력 포맷 처리
- stream-json 입력시 JSON 스트림 생성

### 3. 출력 파서 (`services/parser.ts`)

- 텍스트 출력: 그대로 반환
- stream-json: JSON 스트림 파싱하여 가독성 있게 포맷팅

### 4. 프롬프트 포맷터 (`services/formatter.ts`)

- 기본 모드: `role`과 `personality`를 프롬프트 앞에 자동 추가
- 추론 모드: 추론 모델 사용 시 별도 처리 또는 모델 변경

### 5. MCP 툴

- `chat_with_service`: 지정된 서비스로 채팅 (모델 선택 가능, 추론 모드 플래그)
- `list_services`: 등록된 서비스 목록 조회
- `add_service`: 새 서비스 추가
- `update_service`: 서비스 설정 수정
- `remove_service`: 서비스 삭제
- `get_service_config`: 서비스 설정 조회

### 6. 전송 레이어 분리

- `transport/stdio.ts`: stdio 기반 MCP 서버 (로컬 연결용)
- `transport/http.ts`: HTTP 기반 MCP 서버 (더 넓은 호환성)

## 설정 파일 예시 (`config/services.json`)

```json
{
  "services": [
    {
      "name": "제니",
      "command": "gemini",
      "model": "gemini-2.5-fresh",
      "inferenceModel": "gemini-2.5-pro",
      "options": {
        "promptFlag": "-p",
        "modelFlag": "-m",
        "dirFlag": "-d",
        "inputFormat": "text",
        "outputFormat": "text"
      },
      "env": {},
      "role": "assistant",
      "personality": "친근하고 도움이 되는",
      "workingDir": null
    },
    {
      "name": "제나",
      "command": "grok",
      "model": "grok-2.5-pro",
      "inferenceModel": "grok-2.5-pro-thinking",
      "options": {
        "promptFlag": "positional",
        "modelFlag": "-m",
        "dirFlag": "-d",
        "inputFormat": "stream-json",
        "outputFormat": "stream-json"
      },
      "env": {
        "BASEURL": "${BASEURL}",
        "APIKEY": "${APIKEY}"
      },
      "role": "assistant",
      "personality": "전문적인 지식을 가지고 정중한 말투를 사용하는",
      "workingDir": null
    }
  ]
}
```

## 주요 구현 파일

1. **src/index.ts**: CLI 인자로 `stdio` 또는 `http` 선택, 해당 전송 레이어 초기화
2. **src/server.ts**: MCP 서버 인스턴스 생성, 툴/리소스 등록
3. **src/services/executor.ts**: `exec()` 사용하여 쉘 명령 실행, 환경 변수 주입, workingDir가 없으면 `process.cwd()` 동적 사용, 입출력 포맷 플래그 자동 추가
4. **src/config/manager.ts**: `services.json` 읽기/쓰기, 검증, 별칭으로 서비스 검색 기능
5. **src/services/parser.ts**: `stream-json` 패키지로 JSON 스트림 파싱
6. **src/config/manager.ts**: `services.json` 읽기/쓰기, 검증

## 의존성

- `@modelcontextprotocol/sdk`: MCP 프로토콜 구현
- `stream-json`: JSON 스트림 파싱
- `node:child_process`: 쉘 명령 실행
- TypeScript 관련 패키지

## MCP 툴 상세

### chat_with_service

- 파라미터: `service` (필수), `prompt` (필수), `useInference` (선택, 기본 false), `model` (선택, 기본 모델 오버라이드)
- 동작: 프롬프트 포맷팅 → 쉘 명령 실행 → 출력 파싱 → 반환

### 서비스 관리 툴들

- 설정 파일 읽기/쓰기
- 스키마 검증
- 중복 이름 체크

## 전송 레이어

### stdio.ts

- `process.stdin/stdout` 사용
- Cursor, VS Code 등 로컬 클라이언트 연결

### http.ts

- Express/Fastify로 HTTP 서버 구축
- `/mcp` 엔드포인트에서 MCP 프로토콜 처리
- 다른 MCP 클라이언트가 HTTP로 연결 가능

### To-dos

- [ ] 프로젝트 초기 설정: package.json, tsconfig.json, 기본 디렉토리 구조 생성
- [ ] 서비스 설정 스키마 및 타입 정의 (config/schema.ts, config/manager.ts)
- [ ] 쉘 명령 실행기 및 출력 파서 구현 (services/executor.ts, services/parser.ts)
- [ ] 프롬프트 포맷터 구현 (services/formatter.ts) - role/personality 자동 추가, 추론 모드 지원
- [ ] MCP 툴 구현 (tools/chat.ts, tools/services.ts) - 채팅 및 서비스 관리
- [ ] MCP 서버 코어 구현 (server.ts) - 툴 등록 및 핸들러
- [ ] stdio 전송 레이어 구현 (transport/stdio.ts)
- [ ] HTTP 전송 레이어 구현 (transport/http.ts)
- [ ] 진입점 구현 (index.ts) - stdio/HTTP 선택 로직
- [ ] 기본 설정 파일 및 예시 생성 (config/services.json)