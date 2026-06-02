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

def build_prompt(word, missing_kanjis=None):
    if missing_kanjis:
        missing_list = ", ".join(missing_kanjis)
        missing_nodes_instruction = f"""
또한 다음 한자들은 DB에 없으므로 AI가 직접 분석하여 nodes에 포함하라: {missing_list}
각 한자에 대해 한국어 사전 기준으로 reading(음), meaning(훈)을 작성하고 components를 분석하라.
"""
    else:
        missing_nodes_instruction = "nodes는 빈 객체 {}로 반환하라."

    return f"""너는 한자 전문가이다. 아래 단어에 대해 word_info, examples, nodes를 JSON으로 응답하라.

[중요: 데이터 정의]
- 'meaning': 한자의 훈(뜻). 예: '人' → "사람", '弱' → "약할"
- 'reading': 한자의 음. 예: '人' → "인", '弱' → "약"
- 반드시 한국어 한자 사전 기준으로 응답하라.

[출력 형식]
{{
  "word_info": {{
    "meaning_ko": "단어 전체의 한국어 뜻",
    "reading_hiragana": "히라가나 발음",
    "reading_katakana": "가타카나 발음"
  }},
  "examples": [
    {{"sentence": "일본어 문장", "reading": "읽기", "meaning": "한국어 해석"}},
    {{"sentence": "문장2", "reading": "발음2", "meaning": "해석2"}},
    {{"sentence": "문장3", "reading": "발음3", "meaning": "해석3"}}
  ],
  "nodes": {{
    "한자": {{"reading": "음", "meaning": "뜻", "components": ["구성요소"]}}
  }},
  "confidence": "high"
}}

{missing_nodes_instruction}

입력: "{word}"
반드시 JSON으로만 응답하라.
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

def analyze_kanji(word, missing_kanjis=None):
    prompt = build_prompt(word, missing_kanjis)

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

    return {
        "error": "모든 AI 서비스 호출 및 모델 폴백에 실패했습니다.",
        "details": f"DirectGemini: {gem_error} | OpenRouter({openrouter_model}): {or_error}"
    }
