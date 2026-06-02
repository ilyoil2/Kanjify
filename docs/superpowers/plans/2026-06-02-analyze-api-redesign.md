# Analyze API Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `POST /api/analyze-kanji/` 엔드포인트가 한자 정보를 AI 대신 `tbl_kanji` DB에서 조회하고, AI는 word_info + examples + DB 미보유 한자만 담당하도록 전환한다.

**Architecture:** 입력 단어를 개별 한자로 분리 → `tbl_kanji` 일괄 조회 → AI는 word_info/examples + DB 미보유 한자 nodes만 생성 → 두 결과를 조립해 기존 JSON 구조로 반환. 캐싱은 기존 `tbl_word` 유지.

**Tech Stack:** Django REST Framework, psycopg2(PostgreSQL), Google Gemini / OpenRouter (fallback), Python unittest.mock

---

## File Map

| 파일 | 역할 |
|------|------|
| `backend/api/kanji_utils.py` | **신규** — 한자 추출, 부수 파싱, DB→node 매핑 순수 함수 모음 |
| `backend/api/ai_utils.py` | **수정** — `PROMPT_TEMPLATE` 제거, `build_prompt()` 신규, `analyze_kanji(word, missing_kanjis)` 시그니처 변경 |
| `backend/api/views.py` | **수정** — `analyze_kanji_view` 내부 로직 교체 |
| `backend/api/tests/test_kanji_utils.py` | **신규** — kanji_utils 단위 테스트 |
| `backend/api/tests/test_analyze_view.py` | **신규** — view 통합 테스트 (DB/AI mocked) |
| `backend/api/tests/__init__.py` | **신규** — 패키지 초기화 |

---

## Task 1: `kanji_utils.py` 생성 — 순수 헬퍼 함수

**Files:**
- Create: `backend/api/kanji_utils.py`
- Create: `backend/api/tests/__init__.py`
- Create: `backend/api/tests/test_kanji_utils.py`

- [ ] **Step 1: 테스트 파일과 `__init__.py` 생성**

```python
# backend/api/tests/__init__.py
# (비워둠)
```

```python
# backend/api/tests/test_kanji_utils.py
from django.test import TestCase
from unittest.mock import MagicMock
from api.kanji_utils import extract_kanjis, extract_radical_char, db_kanji_to_node


class ExtractKanjisTest(TestCase):
    def test_basic(self):
        self.assertEqual(extract_kanjis("弱体"), ["弱", "体"])

    def test_mixed_input(self):
        self.assertEqual(extract_kanjis("弱いbody"), ["弱"])

    def test_empty(self):
        self.assertEqual(extract_kanjis(""), [])

    def test_no_kanji(self):
        self.assertEqual(extract_kanjis("ひらがな"), [])


class ExtractRadicalCharTest(TestCase):
    def test_standard_format(self):
        # "弓 (활 궁, 3획)" → '弓'
        self.assertEqual(extract_radical_char("弓 (활 궁, 3획)"), "弓")

    def test_none_input(self):
        self.assertIsNone(extract_radical_char(None))

    def test_empty_string(self):
        self.assertIsNone(extract_radical_char(""))

    def test_non_kanji_first_char(self):
        self.assertIsNone(extract_radical_char("(없음)"))


class DbKanjiToNodeTest(TestCase):
    def _make_kanji(self, **kwargs):
        obj = MagicMock()
        defaults = {
            "kanji": "弱",
            "korean_reading": "약할 약",
            "korean_reading_detail": "약할 약, 가냘플 약",
            "radical_desc_ko": "弓 (활 궁, 3획)",
            "onyomi": "ジャク",
            "kunyomi": "よわい",
            "etymology": "활이 휘어진 모양",
            "stroke_count_ko": "10획",
            "stroke_count_ja": "１０画",
            "radical_ja": "弓部（きゅう）",
            "level": "４級",
            "meaning_ja": "よわい",
        }
        defaults.update(kwargs)
        for k, v in defaults.items():
            setattr(obj, k, v)
        return obj

    def test_components_from_radical(self):
        node = db_kanji_to_node(self._make_kanji())
        self.assertEqual(node["components"], ["弓"])

    def test_is_ai_generated_false(self):
        node = db_kanji_to_node(self._make_kanji())
        self.assertFalse(node["is_ai_generated"])

    def test_db_detail_present(self):
        node = db_kanji_to_node(self._make_kanji())
        self.assertIsNotNone(node["db_detail"])
        self.assertEqual(node["db_detail"]["onyomi"], "ジャク")

    def test_no_radical(self):
        node = db_kanji_to_node(self._make_kanji(radical_desc_ko=None))
        self.assertEqual(node["components"], [])
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd backend && python manage.py test api.tests.test_kanji_utils -v 2
```

Expected: `ImportError: cannot import name 'extract_kanjis' from 'api.kanji_utils'`

- [ ] **Step 3: `kanji_utils.py` 구현**

```python
# backend/api/kanji_utils.py

def extract_kanjis(text):
    return [c for c in text if '一' <= c <= '鿿' or '㐀' <= c <= '䶿']


def extract_radical_char(radical_desc_ko):
    if not radical_desc_ko:
        return None
    first = radical_desc_ko[0]
    if '一' <= first <= '鿿' or '㐀' <= first <= '䶿':
        return first
    return None


def db_kanji_to_node(kanji_obj):
    radical_char = extract_radical_char(kanji_obj.radical_desc_ko)
    return {
        "reading": kanji_obj.korean_reading or "",
        "meaning": kanji_obj.korean_reading_detail or "",
        "components": [radical_char] if radical_char else [],
        "is_ai_generated": False,
        "db_detail": {
            "korean_reading_detail": kanji_obj.korean_reading_detail,
            "onyomi": kanji_obj.onyomi,
            "kunyomi": kanji_obj.kunyomi,
            "etymology": kanji_obj.etymology,
            "stroke_count_ko": kanji_obj.stroke_count_ko,
            "stroke_count_ja": kanji_obj.stroke_count_ja,
            "radical_desc_ko": kanji_obj.radical_desc_ko,
            "radical_ja": kanji_obj.radical_ja,
            "level": kanji_obj.level,
            "meaning_ja": kanji_obj.meaning_ja,
        },
    }
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
python manage.py test api.tests.test_kanji_utils -v 2
```

Expected: `OK (8 tests)`

---

## Task 2: `ai_utils.py` 수정 — 프롬프트 축소 및 시그니처 변경

**Files:**
- Modify: `backend/api/ai_utils.py`

- [ ] **Step 1: `PROMPT_TEMPLATE` 제거 후 `build_prompt()` 함수로 교체**

`ai_utils.py`에서 `PROMPT_TEMPLATE = """..."""` 블록(14~59번 줄)을 삭제하고 아래 함수로 교체:

```python
def build_prompt(word, missing_kanjis=None):
    if missing_kanjis:
        missing_list = ", ".join(missing_kanjis)
        missing_nodes_instruction = f"""
또한 다음 한자들은 DB에 없으므로 AI가 직접 분석하여 nodes에 포함하라: {missing_list}
각 한자에 대해 한국어 사전 기준으로 reading(음), meaning(훈)을 작성하고 components를 분석하라.
"""
    else:
        missing_nodes_instruction = "nodes는 빈 객체 {{}}로 반환하라."

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
```

- [ ] **Step 2: `analyze_kanji()` 시그니처 변경**

`analyze_kanji(word)` → `analyze_kanji(word, missing_kanjis=None)`:

```python
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
```

- [ ] **Step 3: 기존 테스트가 여전히 통과하는지 확인**

```bash
python manage.py test api.tests -v 2
```

Expected: `OK`

---

## Task 3: `views.py` 수정 — `analyze_kanji_view` 로직 교체

**Files:**
- Modify: `backend/api/views.py`
- Create: `backend/api/tests/test_analyze_view.py`

- [ ] **Step 1: 테스트 먼저 작성**

```python
# backend/api/tests/test_analyze_view.py
import json
from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch, MagicMock


def _make_kanji_obj(kanji, korean_reading="약할 약", korean_reading_detail="약할 약",
                    radical_desc_ko="弓 (활 궁, 3획)", **kwargs):
    obj = MagicMock()
    obj.kanji = kanji
    obj.korean_reading = korean_reading
    obj.korean_reading_detail = korean_reading_detail
    obj.radical_desc_ko = radical_desc_ko
    obj.onyomi = kwargs.get("onyomi", "ジャク")
    obj.kunyomi = kwargs.get("kunyomi", "よわい")
    obj.etymology = kwargs.get("etymology", "")
    obj.stroke_count_ko = kwargs.get("stroke_count_ko", "10획")
    obj.stroke_count_ja = kwargs.get("stroke_count_ja", "１０画")
    obj.radical_ja = kwargs.get("radical_ja", "")
    obj.level = kwargs.get("level", "４級")
    obj.meaning_ja = kwargs.get("meaning_ja", "")
    return obj


AI_RESULT = {
    "word_info": {"meaning_ko": "약한 몸", "reading_hiragana": "じゃくたい", "reading_katakana": "ジャクタイ"},
    "examples": [{"sentence": "彼は弱体だ。", "reading": "かれはじゃくたいだ。", "meaning": "그는 약체이다."}],
    "nodes": {},
    "confidence": "high",
}


class AnalyzeKanjiViewAllInDbTest(TestCase):
    @patch("api.views.Word.objects.filter")
    @patch("api.views.Kanji.objects.filter")
    @patch("api.views.analyze_kanji")
    def test_all_kanjis_in_db(self, mock_ai, mock_kanji_filter, mock_word_filter):
        # 캐시 없음
        mock_word_filter.return_value.first.return_value = None

        # DB에 弱, 体 모두 있음
        weak_obj = _make_kanji_obj("弱")
        body_obj = _make_kanji_obj("体", korean_reading="몸 체", radical_desc_ko=None)
        mock_kanji_filter.return_value = [weak_obj, body_obj]

        # 부수(弓) 조회 — 두 번째 filter 호출
        bow_obj = _make_kanji_obj("弓", korean_reading="활 궁", radical_desc_ko=None)
        mock_kanji_filter.side_effect = [
            [weak_obj, body_obj],  # 첫 번째 filter (입력 한자)
            [bow_obj],             # 두 번째 filter (부수)
        ]

        mock_ai.return_value = AI_RESULT

        response = self.client.post(
            "/api/analyze-kanji/",
            data=json.dumps({"word": "弱体"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 弱, 体, 弓 모두 nodes에 있어야 함
        self.assertIn("弱", data["nodes"])
        self.assertIn("体", data["nodes"])
        self.assertIn("弓", data["nodes"])

        # DB 한자는 is_ai_generated=False
        self.assertFalse(data["nodes"]["弱"]["is_ai_generated"])
        self.assertIsNotNone(data["nodes"]["弱"]["db_detail"])

        # AI는 missing_kanjis=[] 로 호출되어야 함
        mock_ai.assert_called_once_with("弱体", missing_kanjis=[])


class AnalyzeKanjiViewSomeMissingTest(TestCase):
    @patch("api.views.Word.objects.filter")
    @patch("api.views.Kanji.objects.filter")
    @patch("api.views.analyze_kanji")
    def test_some_kanjis_missing(self, mock_ai, mock_kanji_filter, mock_word_filter):
        mock_word_filter.return_value.first.return_value = None

        # 弱만 DB에 있음, 体는 없음
        weak_obj = _make_kanji_obj("弱")
        mock_kanji_filter.side_effect = [
            [weak_obj],  # 첫 번째 filter
            [],          # 두 번째 filter (부수 弓 조회, 없음)
        ]

        ai_result_with_node = {
            **AI_RESULT,
            "nodes": {
                "体": {"reading": "체", "meaning": "몸", "components": []}
            },
        }
        mock_ai.return_value = ai_result_with_node

        response = self.client.post(
            "/api/analyze-kanji/",
            data=json.dumps({"word": "弱体"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # AI는 missing_kanjis=["体"] 로 호출
        mock_ai.assert_called_once_with("弱体", missing_kanjis=["体"])

        # 体는 is_ai_generated=True
        self.assertTrue(data["nodes"]["体"]["is_ai_generated"])
        self.assertIsNone(data["nodes"]["体"]["db_detail"])

        # 弱은 is_ai_generated=False
        self.assertFalse(data["nodes"]["弱"]["is_ai_generated"])


class AnalyzeKanjiViewCacheHitTest(TestCase):
    @patch("api.views.Word.objects.filter")
    @patch("api.views.analyze_kanji")
    def test_cache_hit_skips_db_and_ai(self, mock_ai, mock_word_filter):
        cached = MagicMock()
        cached.result_data = {**AI_RESULT, "nodes": {"弱": {"reading": "약", "meaning": "약할", "components": []}}}
        mock_word_filter.return_value.first.return_value = cached

        response = self.client.post(
            "/api/analyze-kanji/",
            data=json.dumps({"word": "弱", "skip_history": True}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        mock_ai.assert_not_called()
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
python manage.py test api.tests.test_analyze_view -v 2
```

Expected: 일부 FAIL (nodes 구조나 is_ai_generated 필드 없음)

- [ ] **Step 3: `views.py` import 추가 및 `analyze_kanji_view` 교체**

파일 상단 import 블록에 추가:
```python
from .models import Vocabulary, Word, User, SearchHistory, WordButton, WordStatus, Kanji
from .kanji_utils import extract_kanjis, extract_radical_char, db_kanji_to_node
```

`analyze_kanji_view` 함수 전체를 아래로 교체 (220번 줄 근처):

```python
@api_view(['POST'])
def analyze_kanji_view(request):
    try:
        word = request.data.get('word')
        user_email = request.data.get('email')
        skip_history = request.data.get('skip_history', False)

        if not word:
            return Response({"error": "word is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. 캐시 확인
        cached = Word.objects.filter(input_text=word).first()
        if cached:
            if not skip_history:
                threading.Thread(target=save_analysis_to_db, args=(word, cached.result_data, user_email)).start()
            return Response(cached.result_data)

        # 2. 한자 분리 및 DB 조회
        chars = extract_kanjis(word)
        db_kanjis = {k.kanji: k for k in Kanji.objects.filter(kanji__in=chars)}
        missing = [c for c in chars if c not in db_kanjis]

        # 3. AI 호출 (word_info + examples + missing nodes)
        result = analyze_kanji(word, missing_kanjis=missing)
        if "error" in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 4. nodes 조립: DB 한자 추가 (AI 노드 덮어쓰기)
        nodes = result.get("nodes", {})
        radical_chars = set()
        for char, kanji_obj in db_kanjis.items():
            node = db_kanji_to_node(kanji_obj)
            nodes[char] = node
            radical_chars.update(node["components"])

        # 5. 부수도 DB에서 조회해 nodes에 포함
        extra_to_fetch = radical_chars - set(nodes.keys())
        for k in Kanji.objects.filter(kanji__in=extra_to_fetch):
            nodes[k.kanji] = db_kanji_to_node(k)

        # 6. AI 생성 노드에 is_ai_generated 마킹
        for char in list(nodes.keys()):
            if char not in db_kanjis and "is_ai_generated" not in nodes[char]:
                nodes[char]["is_ai_generated"] = True
                nodes[char]["db_detail"] = None

        result["nodes"] = nodes

        # 7. 저장 및 반환
        if not skip_history:
            threading.Thread(target=save_analysis_to_db, args=(word, result, user_email)).start()

        return Response(result)

    except Exception as e:
        logger.error(f"Unexpected error in analyze_kanji_view: {e}")
        logger.error(traceback.format_exc())
        return Response({
            "error": "서버 내부 오류가 발생했습니다.",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
python manage.py test api.tests -v 2
```

Expected: `OK` (전체 테스트 통과)

---

## Task 4: 프론트엔드 — `is_ai_generated` 표시

**Files:**
- Modify: `frontend/src/components/kanji-recursive-result.tsx`

- [ ] **Step 1: 현재 파일에서 node 렌더링 부분 확인**

`kanji-recursive-result.tsx`에서 각 노드를 렌더링하는 부분을 찾아 `is_ai_generated` 플래그가 있으면 "AI 분석" 뱃지를 표시 추가:

```tsx
{node.is_ai_generated && (
  <span className="ml-1 text-xs text-amber-500 font-medium">(AI 분석)</span>
)}
```

- [ ] **Step 2: 타입 정의 업데이트**

프로젝트 내 `KanjiNode` 또는 nodes 관련 TypeScript 타입에 필드 추가:

```typescript
interface KanjiNode {
  reading: string
  meaning: string
  components: string[]
  is_ai_generated?: boolean
  db_detail?: {
    korean_reading_detail: string | null
    onyomi: string | null
    kunyomi: string | null
    etymology: string | null
    stroke_count_ko: string | null
    stroke_count_ja: string | null
    radical_desc_ko: string | null
    radical_ja: string | null
    level: string | null
    meaning_ja: string | null
  } | null
}
```

- [ ] **Step 3: 서버 실행 후 수동 확인**

```bash
# backend
cd backend && python manage.py runserver 8002

# frontend (별도 터미널)
cd frontend && npm run dev
```

브라우저에서 한자 단어 입력 → DB에 있는 한자는 정상 표시, 없는 한자는 "(AI 분석)" 표시 확인.
