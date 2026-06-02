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
