from rest_framework import viewsets
from .models import Vocabulary
from .serializers import VocabularySerializer

class VocabularyViewSet(viewsets.ModelViewSet):
    queryset = Vocabulary.objects.all().order_by('-created_at')
    serializer_class = VocabularySerializer
