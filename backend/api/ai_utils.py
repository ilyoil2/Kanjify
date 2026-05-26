import os
import json
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

PROMPT_TEMPLATE = """너는 일본어 학습 전문가이다. 사용자가 입력한 단어에 대해 한자 구조 분석과 실용 예문 3개를 JSON으로 응답하라.

[분석 지침]
1. 한자 분석: 각 한자의 구성요소를 계통학적으로 분석하여 'nodes'에 담으라.
2. 예문: 해당 단어의 실용 예문 딱 3개를 작성하라 (sentence, reading, meaning).

[절대 규칙]
1. 반드시 JSON으로만 응답하라.
2. 'nodes'의 모든 구성요소는 반드시 키(key)로 존재해야 한다.
3. 토큰 절약을 위해 모든 설명은 생략하고 결과 데이터만 아주 짧게 작성하라.

---

[출력 형식]
{{
  "word_info": {{
    "meaning_ko": "뜻",
    "reading_hiragana": "발음",
    "reading_katakana": "발음"
  }},
  "examples": [
    {{ "sentence": "문장1", "reading": "발음1", "meaning": "해석1" }},
    {{ "sentence": "문장2", "reading": "발음2", "meaning": "해석2" }},
    {{ "sentence": "문장3", "reading": "발음3", "meaning": "해석3" }}
  ],
  "nodes": {{
    "한자": {{
      "reading": "음",
      "meaning": "뜻",
      "components": ["요소1", "요소2"]
    }},
    "요소1": {{
      "reading": "음",
      "meaning": "뜻",
      "components": []
    }}
  }},
  "confidence": "high"
}}

---

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
