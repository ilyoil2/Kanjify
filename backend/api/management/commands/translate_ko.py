import time

from django.core.management.base import BaseCommand
from deep_translator import GoogleTranslator

from api.models import Vocabulary

BATCH_SIZE = 100
SLEEP_BETWEEN_BATCHES = 1.0


def _trim_meaning(meaning_en: str) -> str:
    """앞 2개 글로스만 사용 (번역 퀄리티 향상)."""
    parts = [p.strip() for p in meaning_en.split(',')]
    return ', '.join(parts[:2])


class Command(BaseCommand):
    help = 'meaning_en을 한국어로 번역하여 meaning_ko 채우기'

    def add_arguments(self, parser):
        parser.add_argument('--batch-size', type=int, default=BATCH_SIZE)
        parser.add_argument('--sleep', type=float, default=SLEEP_BETWEEN_BATCHES)

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        sleep_sec = options['sleep']

        # 아직 meaning_ko 없는 unique meaning_en 목록
        untranslated = list(
            Vocabulary.objects
            .filter(meaning_en__isnull=False, meaning_ko__isnull=True)
            .values_list('meaning_en', flat=True)
            .distinct()
        )

        if not untranslated:
            self.stdout.write(self.style.SUCCESS('번역할 항목 없음.'))
            return

        self.stdout.write(f'번역 대상 unique meaning_en: {len(untranslated)}개')
        translator = GoogleTranslator(source='en', target='ko')
        en_to_ko: dict[str, str] = {}

        for i in range(0, len(untranslated), batch_size):
            batch = untranslated[i:i + batch_size]
            trimmed = [_trim_meaning(m) for m in batch]

            try:
                results = translator.translate_batch(trimmed)
            except Exception as e:
                self.stderr.write(f'번역 실패 (batch {i}~{i+len(batch)}): {e}')
                results = [None] * len(batch)

            for original, translated in zip(batch, results):
                if translated:
                    en_to_ko[original] = translated

            done = min(i + batch_size, len(untranslated))
            self.stdout.write(f'  {done}/{len(untranslated)} 완료...')
            if done < len(untranslated):
                time.sleep(sleep_sec)

        # bulk update
        records = Vocabulary.objects.filter(
            meaning_en__in=en_to_ko.keys(),
            meaning_ko__isnull=True,
        )
        updated = 0
        to_update = []
        for record in records:
            ko = en_to_ko.get(record.meaning_en)
            if ko:
                record.meaning_ko = ko
                to_update.append(record)

        Vocabulary.objects.bulk_update(to_update, ['meaning_ko'], batch_size=500)
        updated = len(to_update)

        self.stdout.write(self.style.SUCCESS(
            f'완료: {len(en_to_ko)}개 번역, {updated}개 레코드 업데이트'
        ))
