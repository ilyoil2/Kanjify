from rest_framework import serializers
from .models import Vocabulary
from .models import WordButton
from .models import WordStatus

class VocabularySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vocabulary
        fields = '__all__'

class WordButtonSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordButton
        fields = '__all__'

class WordStatusSerializer(serializers.ModelSerializer):
    vocabulary = VocabularySerializer(read_only=True)

    class Meta:
        model = WordStatus
        fields = '__all__'