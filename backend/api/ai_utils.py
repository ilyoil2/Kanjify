import os
import json
import requests
import re
import traceback
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

def call_openrouter(prompt):
    api_key = os.getenv("OPEN_ROUTER_KEY")
    if not api_key:
        return None, "OPEN_ROUTER_KEY가 설정되지 않았습니다."
    
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "google/gemini-2.0-flash-001", 
                "messages": [
                    {"role": "user", "content": prompt}
                ],
            }),
            timeout=15
        )
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content'], None
        else:
            return None, f"OpenRouter 오류: {response.status_code} - {response.text}"
    except Exception as e:
        return None, f"OpenRouter 요청 실패: {str(e)}"

def call_gemini(prompt):
    try:
        import google.generativeai as genai
    except ImportError:
        return None, "google-generativeai 패키지가 설치되어 있지 않습니다."

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None, "GOOGLE_API_KEY가 설정되지 않았습니다."
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        if not response.candidates:
            return None, "Gemini 응답 생성 실패 (Safety Filter 등)"
            
        try:
            return response.text.strip(), None
        except ValueError as e:
            return None, f"Gemini 안전 정책 차단: {str(e)}"
    except Exception as e:
        return None, f"Gemini 요청 실패: {str(e)}"

def parse_json_from_response(text):
    if not text:
        return None
        
    text = text.strip()
    if "```" in text:
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        else:
            code_match = re.search(r'```\s*(\{.*?\})\s*```', text, re.DOTALL)
            if code_match:
                text = code_match.group(1)
    
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # JSON 블록을 찾지 못한 경우 텍스트 전체에서 JSON 형태를 찾아봄
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except:
                pass
        return None

def analyze_kanji(word):
    prompt = PROMPT_TEMPLATE.format(word=word)
    
    # 1. OpenRouter 시도
    print(f"--- Attempting analysis via OpenRouter for: {word} ---")
    text, or_error = call_openrouter(prompt)
    
    if text:
        result = parse_json_from_response(text)
        if result:
            print("OpenRouter analysis successful.")
            return result
        print(f"OpenRouter returned invalid JSON: {text[:200]}...")
    else:
        print(f"OpenRouter failed: {or_error}")

    # 2. OpenRouter 실패 시 Gemini 시도
    print(f"--- Attempting fallback to direct Gemini for: {word} ---")
    text, gem_error = call_gemini(prompt)
    
    if text:
        result = parse_json_from_response(text)
        if result:
            print("Gemini analysis successful.")
            return result
        print(f"Gemini returned invalid JSON: {text[:200]}...")
    else:
        print(f"Gemini failed: {gem_error}")

    # 3. 둘 다 실패
    return {
        "error": "모든 AI 서비스 호출에 실패했습니다.",
        "details": f"OpenRouter: {or_error} | Gemini: {gem_error}"
    }
