import os
import json
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

PROMPT_TEMPLATE = """너는 한자 자원(字源) 및 계통학 전문가이다. 사용자가 입력한 단어에 대해 각 한자의 구조를 분석하되, 특히 '형성자'의 경우 성부(발음)와 의부(의미)를 학술적 근거에 따라 정확히 구분하여 JSON 형식으로 응답하라.

[분석 및 유래 지침]
1. 자원(字源)의 정확성: 단순히 현대 자형이 비슷해 보인다고 해서 엉뚱한 글자를 구성 요소로 삼지 마라.
- 예: '漢'의 성부는 '堇(근)'이 아니라 '𦰩(한)'이다. 이와 같이 자형이 유사하나 계통이 다른 글자를 엄격히 구분하라.
2. 형성자(形聲字) 분석: 발음 역할을 하는 부분(성부)과 의미 역할을 하는 부분(의부)을 정확히 찾아내라. 성부의 경우 실제 고대 발음의 연관성을 고려하라.
3. 분해 판단: [분해 판단 원칙]에 따라, 자형 변형으로 인해 현대 자형 기준의 분해가 무의미하거나 어원을 왜곡할 경우 분해하지 말고 상세한 유래를 적으라.
4. 학술적 근거: 설문해자(說文解字) 및 최신 문자학 연구 결과를 바탕으로 한자의 원형과 변천 과정을 설명하라.

[분해 판단 원칙]
1. 분해 전 판단: 이 글자가 '의미 있게 분해 가능한지'를 먼저 판단하라.
2. 분해 금지 대상: 독체자, 자형 변형이 심해 분해가 어원을 왜곡하는 글자, 무의미한 획 조각들.
3. 처리 방법: 분해하지 않을 경우 components를 []로 두고, origin에 자형의 변천과 형상 원리를 상세히 기술하라.

[절대 규칙]
1. 반드시 JSON 형식으로만 응답하라.
2. 모든 구성요소는 반드시 nodes에 개별 노드로 정의되어야 한다.
3. [중요] components 배열에는 반드시 해당 한자 원문(Kanji) 또는 부수 기호만 포함해야 하며, 절대 한글이나 일어로 번역하지 마라.
4. word_info 필드에는 단어 전체의 한국어 뜻, 히라가나, 가타카나를 정확히 작성하라.

---

[출력 형식]
{{
  "word_info": {{
    "meaning_ko": "뜻",
    "reading_hiragana": "발음",
    "reading_katakana": "발음"
  }},
  "nodes": {{
    "한자": {{
      "reading": "음",
      "meaning": "뜻",
      "components": ["요소1", "요소2"]
    }}
  }},
  "origin": {{
    "한자": "정확한 자원(字源)에 근거한 상세 설명"
  }},
  "confidence": "high | low"
}}

---

[예시: 정확한 성부 분석]
입력: "漢"
출력:
{{
  "word_info": {{
    "meaning_ko": "한나라, 한강, 사내",
    "reading_hiragana": "かん",
    "reading_katakana": "カン"
  }},
  "nodes": {{
    "漢": {{
      "reading": "한",
      "meaning": "한나라",
      "components": ["氵", "𦰩"]
    }},
    "氵": {{
      "reading": "수",
      "meaning": "물",
      "components": []
    }},
    "𦰩": {{
      "reading": "한",
      "meaning": "성부(발음)",
      "components": []
    }}
  }},
  "origin": {{
    "漢": "의미를 나타내는 '氵(물 수)'와 발음을 나타내는 '𦰩(한)'이 결합한 형성자이다. 성부인 '𦰩'은 '堇(근)'과 모양이 비슷하나 실제로는 다른 계통의 글자이며, 여기서는 발음을 나타내는 기호로 쓰였다. 본래 한강(漢江)을 뜻하는 글자였으나 점차 국가명이나 종족 명칭으로 확장되었다."
  }},
  "confidence": "high"
}}

---
이 규칙을 절대 위반하지 말고 응답하라.

입력: "{word}"
"""

def analyze_kanji(word):
    try:
        # 임포트 에러가 서버 전체를 죽이지 않도록 함수 내부에서 임포트
        try:
            import google.generativeai as genai
        except ImportError:
            return {"error": "google-generativeai 패키지가 설치되어 있지 않습니다. pip install google-generativeai 를 실행하세요."}

        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return {"error": "GOOGLE_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요."}
            
        genai.configure(api_key=api_key)
        
        # 가장 범용적인 최신 Flash 모델로 변경 (1.5가 목록에 없으므로 대체)
        model = genai.GenerativeModel('models/gemini-flash-latest')
        prompt = PROMPT_TEMPLATE.format(word=word)

        
        response = model.generate_content(prompt)
        
        if not response.candidates:
            return {"error": "AI가 응답을 생성하지 못했습니다. (Safety Filter 등에 의해 차단되었을 수 있습니다.)"}
            
        try:
            text = response.text.strip()
        except ValueError as e:
            return {
                "error": "안전 정책에 의해 응답이 차단되었습니다.",
                "details": str(e),
                "feedback": getattr(response, 'prompt_feedback', 'No feedback available')
            }

        if "```" in text:
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
            else:
                code_match = re.search(r'```\s*(\{.*?\})\s*```', text, re.DOTALL)
                if code_match:
                    text = code_match.group(1)
        
        result = json.loads(text)
        return result
    except Exception as e:
        import traceback
        print(f"Error in analyze_kanji: {e}")
        print(traceback.format_exc())
        return {
            "error": "분석 중 오류가 발생했습니다.",
            "details": str(e)
        }
