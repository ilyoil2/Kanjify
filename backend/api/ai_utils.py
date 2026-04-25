import os
import json
import google.generativeai as genai
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

# Gemini 설정
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

PROMPT_TEMPLATE = """너는 한자 구조 분석기이다. 사용자가 입력한 단어(한자 또는 히라가나)에 대해, 해당 단어를 구성하는 한자를 분석하고 JSON 형식으로만 응답하라.

[절대 규칙]
1. 반드시 JSON 형식으로만 응답하라.
- 설명, 마크다운, 코드블록, 주석 절대 금지
- JSON 외 텍스트 포함 시 실패로 간주됨

2. 모든 한자 및 구성요소는 nodes 객체에 정의되어야 한다.

3. 각 노드는 반드시 다음 필드를 포함한다:
- reading: 한글 음
- meaning: 한글 뜻
- components: 배열

4. meaning은 반드시 "뜻"만 작성하고, reading은 별도로 분리한다.
(예: "밭", "전" ← "밭 전" 금지)

5. 구성요소는 실제 존재하는 한자 단위로만 분해하라.
- 임의 분해 금지
- 획 단위 분해 금지

6. 재귀적으로 분해하되, 의미 없는 분해는 하지 않는다.
- 더 이상 자연스럽게 분해되지 않으면 components는 []로 한다.

7. 순환 구조 금지
- 직접 또는 간접 자기참조 금지

8. 모든 구성요소는 반드시 nodes에 존재해야 한다.

9. 각 한자는 한 번만 정의한다. (중복 금지)

10. 정보가 불확실하면 해당 필드에 "정보 없음"을 사용한다.

---

[출력 형식]
{
  "nodes": {
    "한자": {
      "reading": "음",
      "meaning": "뜻",
      "components": ["구성요소1", "구성요소2"]
    }
  },
  "origin": {
    "한자": "유래 설명"
  },
  "confidence": "high | low"
}

---

[예시]
입력: "간단"
출력:
{
  "nodes": {
    "簡": {
      "reading": "간",
      "meaning": "대쪽",
      "components": ["竹", "間"]
    },
    "竹": {
      "reading": "죽",
      "meaning": "대나무",
      "components": []
    },
    "間": {
      "reading": "간",
      "meaning": "사이",
      "components": ["門", "日"]
    },
    "門": {
      "reading": "문",
      "meaning": "문",
      "components": []
    },
    "日": {
      "reading": "일",
      "meaning": "해",
      "components": []
    }
  },
  "origin": {
    "簡": "대나무에 글을 적던 것에서 유래"
  },
  "confidence": "high"
}

---
이 규칙을 절대 위반하지 말고 응답하라.

입력: "{word}"
"""

def analyze_kanji(word):
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = PROMPT_TEMPLATE.format(word=word)
    
    response = model.generate_content(prompt)
    
    try:
        # 응답 텍스트에서 JSON 부분만 추출 (정규표현식이나 더 정교한 파싱)
        text = response.text.strip()
        
        # ```json ... ``` 또는 ``` ... ``` 블록 제거
        if "```" in text:
            # json이라는 글자가 포함된 블록 우선 탐색
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
            else:
                # 일반 코드 블록 탐색
                code_match = re.search(r'```\s*(\{.*?\})\s*```', text, re.DOTALL)
                if code_match:
                    text = code_match.group(1)
        
        result = json.loads(text)
        
        # 2단계 검증: 형식 및 한자 유효성 검사
        if "nodes" not in result or "origin" not in result:
            raise ValueError("Invalid response format: missing nodes or origin")
            
        return result
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return {
            "error": "분석 중 오류가 발생했습니다.",
            "details": str(e),
            "raw_response": response.text if hasattr(response, 'text') else None
        }
