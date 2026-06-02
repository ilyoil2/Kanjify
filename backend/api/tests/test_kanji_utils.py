from django.test import TestCase
from unittest.mock import MagicMock
from api.kanji_utils import extract_kanjis, extract_components_from_etymology, db_kanji_to_node


class ExtractKanjisTest(TestCase):
    def test_basic(self):
        self.assertEqual(extract_kanjis("弱体"), ["弱", "体"])

    def test_mixed_input(self):
        self.assertEqual(extract_kanjis("弱いbody"), ["弱"])

    def test_empty(self):
        self.assertEqual(extract_kanjis(""), [])

    def test_no_kanji(self):
        self.assertEqual(extract_kanjis("ひらがな"), [])


class ExtractComponentsFromEtymologyTest(TestCase):
    def test_standard_format(self):
        self.assertEqual(
            extract_components_from_etymology("百(일백 백) + 冖(덮을 멱)"),
            ["百", "冖"]
        )

    def test_none_input(self):
        self.assertEqual(extract_components_from_etymology(None), [])

    def test_empty_string(self):
        self.assertEqual(extract_components_from_etymology(""), [])

    def test_no_kanji_paren_pattern(self):
        self.assertEqual(extract_components_from_etymology("활이 휘어진 모양"), [])

    def test_dedup(self):
        # 같은 한자 중복 제거
        self.assertEqual(
            extract_components_from_etymology("木(나무 목) + 木(나무 목)"),
            ["木"]
        )


class DbKanjiToNodeTest(TestCase):
    def _make_kanji(self, **kwargs):
        obj = MagicMock()
        defaults = {
            "kanji": "明",
            "korean_reading": "밝을 명",
            "korean_reading_detail": "밝을 명",
            "radical_desc_ko": "日 (해 일, 4획)",
            "onyomi": "メイ",
            "kunyomi": "あかるい",
            "etymology": "日(해 일) + 月(달 월)",
            "stroke_count_ko": "8획",
            "stroke_count_ja": "８画",
            "radical_ja": "日部（にち）",
            "level": "６級",
            "meaning_ja": "あかるい",
        }
        defaults.update(kwargs)
        for k, v in defaults.items():
            setattr(obj, k, v)
        return obj

    def test_components_from_etymology(self):
        node = db_kanji_to_node(self._make_kanji())
        self.assertEqual(node["components"], ["日", "月"])

    def test_no_etymology_components(self):
        node = db_kanji_to_node(self._make_kanji(etymology="해와 달이 합쳐진 모양"))
        self.assertEqual(node["components"], [])

    def test_is_ai_generated_false(self):
        node = db_kanji_to_node(self._make_kanji())
        self.assertFalse(node["is_ai_generated"])

    def test_db_detail_present(self):
        node = db_kanji_to_node(self._make_kanji())
        self.assertIsNotNone(node["db_detail"])
        self.assertEqual(node["db_detail"]["onyomi"], "メイ")

    def test_self_reference_excluded(self):
        node = db_kanji_to_node(self._make_kanji(
            kanji="日", etymology="日(해 일)"
        ))
        self.assertNotIn("日", node["components"])

    def test_reading_and_meaning_mapping(self):
        node = db_kanji_to_node(self._make_kanji(
            korean_reading="밝을 명",
            korean_reading_detail="밝을 명",
        ))
        self.assertEqual(node["reading"], "밝을 명")
        self.assertEqual(node["meaning"], "밝을 명")
