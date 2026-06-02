def extract_kanjis(text):
    return [c for c in text if '一' <= c <= '鿿' or '㐀' <= c <= '䶿']


def _is_cjk(ch):
    cp = ord(ch)
    return (0x3400 <= cp <= 0x9FFF) or cp >= 0x20000


def extract_components_from_etymology(etymology):
    """'百(일백 백) + 冖(덮을 멱)' 형식에서 ( 바로 앞 한자를 추출."""
    if not etymology:
        return []
    results = []
    for i, ch in enumerate(etymology):
        if i + 1 < len(etymology) and etymology[i + 1] == '(' and _is_cjk(ch):
            if ch not in results:
                results.append(ch)
    return results


def db_kanji_to_node(kanji_obj):
    components = extract_components_from_etymology(kanji_obj.etymology)
    # 자기 자신이 포함되는 경우 제거
    components = [c for c in components if c != kanji_obj.kanji]
    return {
        "reading": kanji_obj.korean_reading or "",
        "meaning": kanji_obj.korean_reading_detail or "",
        "components": components,
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
