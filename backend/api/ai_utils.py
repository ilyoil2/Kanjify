import os
import json
import requests
import re
import traceback
import logging
from django.conf import settings
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

PROMPT_TEMPLATE = """너는 세계 최고의 한자 어원 및 계통학 전문가이다. 사용자가 입력한 단어에 대해 자원(字源)에 근거한 한자 구조 분석과 실용 예문 3개를 JSON으로 응답하라.

[분석 지침]
1. 한자 어원 분석: 각 한자를 역사적 유래와 자원(字源)에 근거하여 분석하라.
2. 계층적 분해: 각 한자의 구성요소를 'nodes'에 담으라. 더 이상 나뉘지 않을 때까지 재귀적으로 분석하라.
3. 예문: 실용 예문 3개를 작성하라.

[중요: 데이터 정의]
- 'meaning': 한자의 **훈(뜻)**을 말한다. (예: '人'의 경우 "사람", '弱'의 경우 "약할")
- 'reading': 한자의 **음**을 말한다. (예: '人'의 경우 "인", '弱'의 경우 "약")
- 반드시 한국어 한자 사전 기준으로 응답하라. 일본어 발음(요와, 야스 등)이나 중국어 발음을 'reading'에 넣지 마라.

[절대 규칙]
1. 반드시 JSON으로만 응답하라.
2. 모든 노드는 반드시 뜻(meaning)과 음(reading)을 한국어 사전 기준으로 분리하라.
   - 예: "人": {{"meaning": "사람", "reading": "인", "components": []}}
   - 예: "弱": {{"meaning": "약할", "reading": "약", "components": ["弓", "冫"]}}

---

[출력 형식]
{{
  "word_info": {{
    "meaning_ko": "단어 전체의 뜻",
    "reading_hiragana": "일본어 히라가나 발음",
    "reading_katakana": "일본어 가타카나 발음"
  }},
  "examples": [
    {{ "sentence": "일본어 문장", "reading": "문장 읽는 법", "meaning": "한국어 해석" }},
    {{ "sentence": "문장2", "reading": "발음2", "meaning": "해석2" }},
    {{ "sentence": "문장3", "reading": "발음3", "meaning": "해석3" }}
  ],
  "nodes": {{
    "한자": {{
      "reading": "음",
      "meaning": "뜻",
      "components": ["요소1", "요소2"]
    }}
  }},
  "confidence": "high"
}}

---

입력: "{word}"
"""

def call_openrouter(prompt, model_name="openrouter/owl-alpha"):
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
                "model": model_name,
                "messages": [
                    {
                        "role": "system", 
                        "content": "너는 공신력 있는 한자 자원 정보를 제공하는 전문가이다. 반드시 한국어 한자 음과 뜻(훈음)을 정확히 구분하여 JSON으로 답변하라."
                    },
                    {"role": "user", "content": prompt}
                ],
            }),
            timeout=25
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
        model = genai.GenerativeModel("gemini-2.5-flash")
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
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        return None

def analyze_kanji(word):
    prompt = PROMPT_TEMPLATE.format(word=word)

    # 1. Google Gemini 우선 사용
    logger.info(f"--- Attempting analysis via direct Gemini for: {word} ---")
    text, gem_error = call_gemini(prompt)
    
    if text:
        result = parse_json_from_response(text)
        if result:
            logger.info("Direct Gemini analysis successful.")
            return result
        logger.warning(f"Direct Gemini returned invalid JSON: {text[:200]}...")
    else:
        logger.error(f"Direct Gemini failed: {gem_error}")

    # 2. Gemini 실패 시 OpenRouter 무료 상위 모델만 사용
    openrouter_model = "openrouter/owl-alpha"
    logger.info(f"--- Attempting fallback via OpenRouter ({openrouter_model}) for: {word} ---")
    text, or_error = call_openrouter(prompt, openrouter_model)
    
    if text:
        result = parse_json_from_response(text)
        if result and "nodes" in result:
            logger.info(f"OpenRouter analysis successful with model: {openrouter_model}")
            return result
        logger.warning(f"OpenRouter returned invalid JSON or structure: {text[:200]}...")
    else:
        logger.error(f"OpenRouter failed: {or_error}")

    # 3. 모든 시도 실패
    return {
        "error": "모든 AI 서비스 호출 및 모델 폴백에 실패했습니다.",
        "details": f"DirectGemini: {gem_error} | OpenRouter({openrouter_model}): {or_error}"
    }
