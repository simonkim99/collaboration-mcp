# 자연어 채팅 사용법

## 새로운 기능: `chat_natural` 툴

이제 "제니 안녕"과 같은 자연어 입력으로 직접 AI 서비스와 대화할 수 있습니다!

## 사용 방법

### Cursor에서 사용하기

Cursor 채팅에서 다음 명령을 사용하세요:

```
@mcp chat_natural input="제니 안녕"
```

또는 더 긴 메시지:
```
@mcp chat_natural input="제니 오늘 날씨가 어때?"
```

### 서비스 이름 인식

이 툴은 자동으로 서비스 이름을 인식합니다:

- **한글 이름**: "제니", "제나"
- **영문 별칭**: "jenny", "jenna"

### 사용 예시

1. **제니에게 인사하기**
   ```
   @mcp chat_natural input="제니 안녕하세요"
   ```

2. **별칭 사용하기**
   ```
   @mcp chat_natural input="jenny hello"
   ```

3. **제나에게 질문하기**
   ```
   @mcp chat_natural input="제나 전문적인 조언을 부탁드립니다"
   ```

4. **추론 모드 사용**
   ```
   @mcp chat_natural input="제니 복잡한 문제를 분석해주세요" useInference=true
   ```

## 동작 원리

1. 입력 문자열에서 서비스 이름을 찾습니다
2. 서비스 이름 뒤의 텍스트를 프롬프트로 사용합니다
3. 자동으로 role과 personality를 추가합니다
4. 해당 서비스로 메시지를 전달합니다

## 서비스 이름 형식

서비스 이름 다음에 공백 또는 콜론(:)이 있어야 합니다:

- ✅ "제니 안녕" → 제니, "안녕"
- ✅ "제니: 안녕" → 제니, "안녕"
- ✅ "jenny hello" → jenny, "hello"
- ❌ "제니안녕" → 인식 불가 (공백 필요)

## 기존 툴과의 차이

- **chat_with_service**: 명시적으로 service와 prompt를 지정
  ```
  @mcp chat_with_service service="제니" prompt="안녕"
  ```

- **chat_natural**: 자연어 입력으로 자동 파싱
  ```
  @mcp chat_natural input="제니 안녕"
  ```

둘 다 같은 결과를 반환하지만, `chat_natural`이 더 자연스럽습니다!

