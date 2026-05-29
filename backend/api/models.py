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
    reading = models.CharField(max_length=200, null=True, blank=True)
    meaning_ko = models.TextField(null=True, blank=True)
    meaning_en = models.TextField(null=True, blank=True)
    n_level = models.CharField(
        max_length=2,
        choices=NLevel.choices,
        null=True,
        blank=True,
    )
    memorize_status = models.CharField(
        max_length=20,
        choices=MemorizeStatus.choices,
        default=MemorizeStatus.NOT_STARTED
    )
    hidden_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.kanji} ({self.reading})"

    class Meta:
        db_table = 'tbl_vocabulary'

class Word(models.Model):
    input_text = models.CharField(max_length=255, unique=True)
    meaning_ko = models.TextField(null=True, blank=True)
    reading_hiragana = models.CharField(max_length=200, null=True, blank=True)
    reading_katakana = models.CharField(max_length=200, null=True, blank=True)
    result_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.input_text

    class Meta:
        db_table = 'tbl_word'

class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'tbl_user'

class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    word_text = models.CharField(max_length=255)
    meaning_ko = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.word_text} ({self.user.username if self.user else 'Guest'})"

    class Meta:
        db_table = 'tbl_search_history'
        ordering = ['-created_at']

class WordButton(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='buttons'
    )
    hide_days = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=20, default='blue')

    class Meta:
        db_table = 'tbl_word_button'

class WordStatus(models.Model):
    vocabulary = models.OneToOneField(
        Vocabulary, on_delete=models.CASCADE, related_name='status'
    )
    button = models.ForeignKey(
        WordButton, on_delete=models.SET_NULL, null=True, related_name='word_statuses'
    )
    hidden_until = models.DateTimeField(null=True, blank=True)  # null = 영구 숨김
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_word_status'