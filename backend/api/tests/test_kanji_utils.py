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

    def test_reading_and_meaning_mapping(self):
        node = db_kanji_to_node(self._make_kanji(
            korean_reading="약할 약",
            korean_reading_detail="약할 약, 가냘플 약",
        ))
        self.assertEqual(node["reading"], "약할 약")
        self.assertEqual(node["meaning"], "약할 약, 가냘플 약")
