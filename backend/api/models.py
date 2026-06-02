from django.db import models

class Vocabulary(models.Model):
    word = models.TextField(null=True, blank=True)
    korean_reading_detail = models.TextField(null=True, blank=True)
    korean_reading = models.TextField(null=True, blank=True)
    radical_desc_ko = models.TextField(null=True, blank=True)
    etymology = models.TextField(null=True, blank=True)
    stroke_count_ko = models.TextField(null=True, blank=True)
    radical_ja = models.TextField(null=True, blank=True)
    stroke_count_ja = models.TextField(null=True, blank=True)
    onyomi = models.TextField(null=True, blank=True)
    kunyomi = models.TextField(null=True, blank=True)
    meaning_ja = models.TextField(null=True, blank=True)
    level = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.word

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
    name = models.CharField(max_length=50, default='')
    hide_days = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=20, default='#3B82F6')

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

class Kanji(models.Model):
    kanji = models.TextField(null=True, blank=True)
    korean_reading_detail = models.TextField(null=True, blank=True)
    korean_reading = models.TextField(null=True, blank=True)
    radical_desc_ko = models.TextField(null=True, blank=True)
    etymology = models.TextField(null=True, blank=True)
    stroke_count_ko = models.TextField(null=True, blank=True)
    radical_ja = models.TextField(null=True, blank=True)
    stroke_count_ja = models.TextField(null=True, blank=True)
    onyomi = models.TextField(null=True, blank=True)
    kunyomi = models.TextField(null=True, blank=True)
    meaning_ja = models.TextField(null=True, blank=True)
    level = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.kanji

    class Meta:
        db_table = 'tbl_kanji'