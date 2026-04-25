import time

from django.core.management.base import BaseCommand
from django.db.models import Q
from deep_translator import GoogleTranslator

from api.models import Vocabulary

BATCH_SIZE = 100
SLEEP_BETWEEN_BATCHES = 1.0


def _trim_meaning(meaning_en: str) -> str:
    """앞 2개 글로스만 사용 (번역 퀄리티 향상)."""
    if not meaning_en:
        return ""
    parts = [p.strip() for p in meaning_en.split(',')]
    return ', '.join(parts[:2])


class Command(BaseCommand):
    help = 'meaning_en을 한국어로 번역하여 meaning_ko 채우기'

    def add_arguments(self, parser):
        parser.add_argument('--batch-size', type=int, default=BATCH_SIZE)
        parser.add_argument('--sleep', type=float, default=SLEEP_BETWEEN_BATCHES)
        parser.add_argument('--limit', type=int, default=None, help='최대 번역할 unique string 개수')

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        sleep_sec = options['sleep']
        limit = options['limit']

        # 아직 meaning_ko 없는 unique meaning_en 목록
        # null이거나 빈 문자열인 경우 모두 포함
        query = Vocabulary.objects.filter(
            Q(meaning_en__isnull=False) & ~Q(meaning_en=''),
            Q(meaning_ko__isnull=True) | Q(meaning_ko='')
        )
        
        untranslated = list(
            query.values_list('meaning_en', flat=True).distinct()
        )

        if not untranslated:
            self.stdout.write(self.style.SUCCESS('번역할 항목 없음.'))
            return

        if limit:
            untranslated = untranslated[:limit]

        self.stdout.write(f'번역 대상 unique meaning_en: {len(untranslated)}개 (전체 미번역 중 일부일 수 있음)')
        translator = GoogleTranslator(source='en', target='ko')

        total_updated = 0
        for i in range(0, len(untranslated), batch_size):
            batch = untranslated[i:i + batch_size]
            trimmed = [_trim_meaning(m) for m in batch]

            self.stdout.write(f'  Processing batch {i//batch_size + 1} ({len(batch)} items)...')
            try:
                results = translator.translate_batch(trimmed)
            except Exception as e:
                self.stderr.write(f'번역 실패 (batch {i}~{i+len(batch)}): {e}')
                results = [None] * len(batch)

            en_to_ko_batch: dict[str, str] = {}
            for original, translated in zip(batch, results):
                if translated:
                    en_to_ko_batch[original] = translated

            if en_to_ko_batch:
                # 해당 배치의 번역 결과로 DB 업데이트
                records = Vocabulary.objects.filter(
                    meaning_en__in=en_to_ko_batch.keys()
                ).filter(
                    Q(meaning_ko__isnull=True) | Q(meaning_ko='')
                )
                to_update = []
                for record in records:
                    ko = en_to_ko_batch.get(record.meaning_en)
                    if ko:
                        record.meaning_ko = ko
                        to_update.append(record)
                
                if to_update:
                    Vocabulary.objects.bulk_update(to_update, ['meaning_ko'], batch_size=500)
                    total_updated += len(to_update)

            done = min(i + batch_size, len(untranslated))
            self.stdout.write(f'  {done}/{len(untranslated)} (Unique strings) 완료... (Records updated: {total_updated})')
            
            if done < len(untranslated):
                time.sleep(sleep_sec)

        self.stdout.write(self.style.SUCCESS(
            f'전체 완료: {total_updated}개 레코드 업데이트'
        ))
