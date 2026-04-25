from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Vocabulary
from .serializers import VocabularySerializer
from .ai_utils import analyze_kanji

class VocabularyViewSet(viewsets.ModelViewSet):
    queryset = Vocabulary.objects.all().order_by('-created_at')
    serializer_class = VocabularySerializer

@api_view(['POST'])
def analyze_kanji_view(request):
    try:
        word = request.data.get('word')
        if not word:
            return Response({"error": "word is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = analyze_kanji(word)
        if "error" in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(result)
    except Exception as e:
        import traceback
        print(f"Unexpected error in analyze_kanji_view: {e}")
        print(traceback.format_exc())
        return Response({
            "error": "서버 내부 오류가 발생했습니다.",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
