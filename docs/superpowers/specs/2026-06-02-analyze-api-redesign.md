# 분석 API 재설계 스펙

## 목표

`POST /api/analyze-kanji/` 엔드포인트의 데이터 소스를 AI 전체 생성에서 DB + AI 혼합으로 전환한다.
- 한자 상세 데이터(부수, 획수, 음훈 등): `tbl_kanji` DB에서 조회
- 전체 단어 의미, 히라가나/가타카나, 예문: AI 생성
- DB에 없는 한자: AI가 기존 방식으로 보완, `is_ai_generated: true` 표시

---

## 데이터 흐름

```
입력: "弱体"
  │
  ├─ 1. Word 캐시(tbl_word) 확인 → 있으면 즉시 반환
  │
  ├─ 2. 한자 분리: ["弱", "体"]
  │
  ├─ 3. tbl_kanji 일괄 조회
  │      弱 → 있음 (DB)
  │      体 → 없음 (AI 대상)
  │
  ├─ 4. AI 호출 (항상 한 번)
  │      - word_info (전체 의미, 히라가나, 가타카나)
  │      - examples (예문 3개)
  │      - AI 대상 한자만 nodes 분석
  │
  ├─ 5. nodes 조립
  │      DB 한자: korean_reading → reading, radical 추출 → components
  │               is_ai_generated: false, db_detail 포함
  │      AI 한자: AI 반환값 사용, is_ai_generated: true
  │
  └─ 6. 최종 JSON을 tbl_word에 캐싱 후 반환
```

---

## 응답 구조

기존 구조를 유지하되, 각 노드에 `is_ai_generated`와 `db_detail` 필드 추가.

```json
{
  "word_info": {
    "meaning_ko": "약한 몸",
    "reading_hiragana": "じゃくたい",
    "reading_katakana": "ジャクタイ"
  },
  "examples": [
    {
      "sentence": "彼は弱体な体を鍛えた。",
      "reading": "かれはじゃくたいなからだをきたえた。",
      "meaning": "그는 약한 몸을 단련했다."
    }
  ],
  "nodes": {
    "弱": {
      "reading": "약",
      "meaning": "약할",
      "components": ["弓"],
      "is_ai_generated": false,
      "db_detail": {
        "korean_reading_detail": "약할 약",
        "onyomi": "ジャク",
        "kunyomi": "よわい",
        "etymology": "...",
        "stroke_count_ko": "10획",
        "radical_desc_ko": "弓 (활 궁, 3획)",
        "level": "４級"
      }
    },
    "弓": {
      "reading": "궁",
      "meaning": "활",
      "components": [],
      "is_ai_generated": false,
      "db_detail": { "..." : "..." }
    },
    "体": {
      "reading": "체",
      "meaning": "몸",
      "components": [],
      "is_ai_generated": true,
      "db_detail": null
    }
  },
  "confidence": "high"
}
```

---

## 변경 범위

### `backend/api/views.py`
- `analyze_kanji_view`: Word 캐시 확인 후 아래 로직으로 교체
  1. 입력 문자열에서 한자 문자만 추출 (유니코드 범위 필터)
  2. `Kanji.objects.filter(kanji__in=chars)` 일괄 조회
  3. DB 미보유 한자 목록 추출
  4. `analyze_kanji()` 호출 (word_info, examples, 미보유 한자 nodes)
  5. DB 한자 → nodes 매핑 (`korean_reading` → `reading`, `radical_desc_ko` 첫 문자 → `components`)
  6. 부수 한자도 `tbl_kanji`에서 조회해 nodes에 포함
  7. 조립된 JSON을 `tbl_word`에 캐싱

### `backend/api/ai_utils.py`
- `analyze_kanji()` 함수 시그니처 변경: `missing_kanjis` 파라미터 추가
- 프롬프트 축소: word_info + examples + missing_kanjis nodes만 요청
- DB에 없는 한자가 0개면 AI에 nodes 분석 요청하지 않음

### `backend/api/models.py`
- `Kanji` 모델 이미 추가됨 (`tbl_kanji`, 마이그레이션 미적용)
- `Vocabulary` 모델 Anki 스키마로 교체됨: `word`, `korean_reading_detail`, `korean_reading`, `radical_desc_ko`, `etymology`, `stroke_count_ko`, `radical_ja`, `stroke_count_ja`, `onyomi`, `kunyomi`, `meaning_ja`, `level`
- `WordStatus` → `Vocabulary` FK 유지 (학습 상태 기능 그대로)

---

## 부수 추출 규칙

`radical_desc_ko` 예시: `"弓 (활 궁, 3획)"`
→ 첫 번째 문자(`弓`)를 `components[0]`으로 사용
→ 해당 문자도 `tbl_kanji`에서 조회해 `nodes`에 포함
→ DB에 없으면 `components: []`로 처리 (부수 노드 생략)

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| 모든 한자가 DB에 없음 | AI가 전체 분석 (기존과 동일) |
| 일부 한자만 DB에 없음 | DB분 조립 + 없는 것만 AI, `is_ai_generated: true` |
| AI 호출 실패 | DB에 있는 한자만 반환, AI 대상 한자 에러 표시 |
| 부수가 DB에 없음 | `components: []` 처리 |

---

## 변경하지 않는 것

- 응답 JSON 최상위 구조 (`word_info`, `examples`, `nodes`, `confidence`)
- `tbl_word` 캐싱 전략
- 프론트엔드 기본 렌더링 로직 (`kanji-recursive-result.tsx`)
- `SearchHistory` 저장 로직
