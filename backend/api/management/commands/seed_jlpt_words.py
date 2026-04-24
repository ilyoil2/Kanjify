import json
from pathlib import Path
from xml.etree.ElementTree import iterparse

from django.core.management.base import BaseCommand

from api.models import Vocabulary

PROJECT_ROOT = Path(__file__).resolve().parents[4]
LEVEL_MAP = {1: 'N1', 2: 'N2', 3: 'N3', 4: 'N4', 5: 'N5'}
MAX_GLOSSES = 3


def _is_katakana(text: str) -> bool:
    return bool(text) and all('゠' <= c <= 'ヿ' or c in 'ーー・' for c in text)


def _clean_gloss(gloss: str) -> str:
    """뒤에 붙은 '...'만 제거. 앞에 붙은 '...'는 _pick_meaning에서 junk로 처리."""
    g = gloss.strip()
    if g.endswith('...'):
        g = g[:-3].rstrip(' ,')
    return g.strip()


def _pick_meaning(glosses_by_sense: list[list[str]]) -> str | None:
    for sense_glosses in glosses_by_sense:
        valid = []
        for g in sense_glosses:
            if g.startswith('-') or g.startswith('...'):
                continue
            valid.append(_clean_gloss(g))
        if valid:
            return ', '.join(valid[:MAX_GLOSSES])
    # 모든 sense가 접미사 전용이면 첫 번째 sense 원본 사용 (fallback)
    if glosses_by_sense:
        return ', '.join(_clean_gloss(g) for g in glosses_by_sense[0][:MAX_GLOSSES])
    return None


def parse_jmdict(jmdict_path: Path) -> tuple[dict[tuple, str], dict[str, str], dict[str, str]]:
    exact: dict[tuple, str] = {}    # (keb, reb) → meaning
    keb_only: dict[str, str] = {}   # keb → meaning
    reb_only: dict[str, str] = {}   # reb → meaning (k_ele 없는 entry)

    keb_list: list[str] = []
    reb_list: list[str] = []
    glosses_by_sense: list[list[str]] = []
    current_glosses: list[str] = []

    for event, elem in iterparse(str(jmdict_path), events=('start', 'end')):
        if event == 'start':
            if elem.tag == 'entry':
                keb_list = []
                reb_list = []
                glosses_by_sense = []
                current_glosses = []
            elif elem.tag == 'sense':
                current_glosses = []
        elif event == 'end':
            if elem.tag == 'keb' and elem.text:
                keb_list.append(elem.text)
            elif elem.tag == 'reb' and elem.text:
                reb_list.append(elem.text)
            elif elem.tag == 'gloss' and elem.text:
                current_glosses.append(elem.text)
            elif elem.tag == 'sense':
                if current_glosses:
                    glosses_by_sense.append(current_glosses)
            elif elem.tag == 'entry':
                meaning = _pick_meaning(glosses_by_sense)
                if meaning:
                    if keb_list:
                        for keb in keb_list:
                            for reb in reb_list:
                                exact.setdefault((keb, reb), meaning)
                            keb_only.setdefault(keb, meaning)
                    else:
                        for reb in reb_list:
                            reb_only.setdefault(reb, meaning)
                elem.clear()

    return exact, keb_only, reb_only


def _entry_priority(entry: Vocabulary) -> tuple:
    """낮을수록 우선 유지: N숫자 큰 것(N5) 우선, 그 다음 히라가나 우선."""
    n = int(entry.n_level[1]) if entry.n_level else 0
    return (-(n), int(_is_katakana(entry.reading or '')))


def deduplicate(entries: list[Vocabulary]) -> list[Vocabulary]:
    # (kanji, meaning_en) 기준으로 그룹핑 후 우선순위 1위만 유지
    best: dict[tuple, Vocabulary] = {}
    for e in entries:
        key = (e.kanji, e.meaning_en)
        existing = best.get(key)
        if existing is None or _entry_priority(e) < _entry_priority(existing):
            best[key] = e
    return list(best.values())


class Command(BaseCommand):
    help = 'Seed JLPT vocabulary, optionally merging English meanings from JMdict'

    def add_arguments(self, parser):
        parser.add_argument('--jlpt', type=str, default=None, help='Path to JLPTWords.json')
        parser.add_argument('--jmdict', type=str, default=None, help='Path to JMdict_e XML file')
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing Vocabulary rows before seeding',
        )

    def handle(self, *args, **options):
        jlpt_path = Path(options['jlpt']) if options['jlpt'] else PROJECT_ROOT / 'JLPTWords.json'
        jmdict_path = Path(options['jmdict']) if options['jmdict'] else PROJECT_ROOT / 'JMdict_e'

        if not jlpt_path.exists():
            self.stderr.write(f'JLPTWords.json not found: {jlpt_path}')
            return

        exact: dict[tuple, str] = {}
        keb_only: dict[str, str] = {}
        reb_only: dict[str, str] = {}
        if jmdict_path.exists():
            self.stdout.write('JMdict 파싱 중...')
            exact, keb_only, reb_only = parse_jmdict(jmdict_path)
            self.stdout.write(
                f'JMdict 로드 완료 (exact: {len(exact):,}개, keb: {len(keb_only):,}개, reb-only: {len(reb_only):,}개)'
            )
        else:
            self.stdout.write(self.style.WARNING(f'JMdict_e 없음, meaning_en은 null로 저장됩니다: {jmdict_path}'))

        if options['clear']:
            deleted, _ = Vocabulary.objects.all().delete()
            self.stdout.write(f'{deleted}개 기존 데이터 삭제.')

        with open(jlpt_path, encoding='utf-8') as f:
            jlpt_data: dict = json.load(f)

        raw_entries: list[Vocabulary] = []
        for kanji, readings in jlpt_data.items():
            for item in readings:
                reading = item.get('reading')
                meaning_en = (
                    exact.get((kanji, reading))
                    or keb_only.get(kanji)
                    or reb_only.get(kanji)
                    or reb_only.get(reading)
                )
                raw_entries.append(Vocabulary(
                    kanji=kanji,
                    reading=reading,
                    n_level=LEVEL_MAP.get(item.get('level')),
                    meaning_en=meaning_en,
                ))

        entries = deduplicate(raw_entries)
        Vocabulary.objects.bulk_create(entries, ignore_conflicts=True)

        matched = sum(1 for e in entries if e.meaning_en)
        removed = len(raw_entries) - len(entries)
        self.stdout.write(self.style.SUCCESS(
            f'{len(entries)}개 삽입 완료 '
            f'(중복 제거: {removed}개, 영어 뜻 매핑: {matched}개 / {len(entries)}개)'
        ))
