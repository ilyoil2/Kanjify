from django.db import models

class Vocabulary(models.Model):
    class NLevel(models.TextChoices):
        N1 = 'N1', 'N1'
        N2 = 'N2', 'N2'
        N3 = 'N3', 'N3'
        N4 = 'N4', 'N4'
        N5 = 'N5', 'N5'

    class MemorizeStatus(models.TextChoices):
        NOT_STARTED = 'NOT_STARTED', 'Not Started'
        LEARNING = 'LEARNING', 'Learning'
        MASTERED = 'MASTERED', 'Mastered'

    kanji = models.CharField(max_length=100)
    hiragana = models.CharField(max_length=200)
    katakana = models.CharField(max_length=200, blank=True, null=True)
    meaning = models.TextField()
    n_level = models.CharField(
        max_length=2,
        choices=NLevel.choices,
        default=NLevel.N5
    )
    memorize_status = models.CharField(
        max_length=20,
        choices=MemorizeStatus.choices,
        default=MemorizeStatus.NOT_STARTED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.kanji} ({self.hiragana})"

    class Meta:
        db_table = 'tbl_vocabulary'
