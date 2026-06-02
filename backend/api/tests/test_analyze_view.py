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

        self.assertIn("弱", data["nodes"])
        self.assertIn("体", data["nodes"])
        self.assertIn("弓", data["nodes"])

        self.assertFalse(data["nodes"]["弱"]["is_ai_generated"])
        self.assertIsNotNone(data["nodes"]["弱"]["db_detail"])

        mock_ai.assert_called_once_with("弱体", missing_kanjis=[])


class AnalyzeKanjiViewSomeMissingTest(TestCase):
    @patch("api.views.Word.objects.filter")
    @patch("api.views.Kanji.objects.filter")
    @patch("api.views.analyze_kanji")
    def test_some_kanjis_missing(self, mock_ai, mock_kanji_filter, mock_word_filter):
        mock_word_filter.return_value.first.return_value = None

        weak_obj = _make_kanji_obj("弱")
        mock_kanji_filter.side_effect = [
            [weak_obj],  # 첫 번째 filter
            [],          # 두 번째 filter (부수 弓, 없음)
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

        mock_ai.assert_called_once_with("弱体", missing_kanjis=["体"])

        self.assertTrue(data["nodes"]["体"]["is_ai_generated"])
        self.assertIsNone(data["nodes"]["体"]["db_detail"])

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
