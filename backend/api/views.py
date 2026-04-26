from django.contrib.auth.hashers import make_password, check_password
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Vocabulary, Word, User
from .serializers import VocabularySerializer
from .ai_utils import analyze_kanji

class VocabularyViewSet(viewsets.ModelViewSet):
    queryset = Vocabulary.objects.all().order_by('-created_at')
    serializer_class = VocabularySerializer

@api_view(['POST'])
def signup_view(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response({"error": "모든 필드를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "이미 존재하는 사용자 이름입니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({"error": "이미 사용 중인 이메일입니다."}, status=status.HTTP_400_BAD_REQUEST)

        # 비밀번호 암호화 및 유저 생성
        User.objects.create(
            username=username,
            email=email,
            password=make_password(password)
        )

        return Response({"message": "회원가입이 완료되었습니다!"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login_view(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([email, password]):
            return Response({"error": "이메일과 비밀번호를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user or not check_password(password, user.password):
            return Response({"error": "이메일 또는 비밀번호가 일치하지 않습니다."}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            "message": "로그인 성공!",
            "user": {
                "username": user.username,
                "email": user.email
            }
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Removed history_view

# Modified save_analysis_to_db to remove user_email argument and SearchHistory logic
def save_analysis_to_db(word_text, result):
    """분석 결과를 Word 테이블에 비동기적으로 저장 (검증 로직 포함)"""
    try:
        if "error" in result: return
        if "nodes" not in result or "word_info" not in result: return

        info = result["word_info"]
        Word.objects.get_or_create(
            input_text=word_text,
            defaults={
                "meaning_ko": info.get("meaning_ko"),
                "reading_hiragana": info.get("reading_hiragana"),
                "reading_katakana": info.get("reading_katakana"),
                "result_data": result,
            }
        )
    except Exception as e:
        print(f"Error saving to Word table: {e}")

@api_view(['POST'])
def analyze_kanji_view(request):
    try:
        word = request.data.get('word')
        # Removed user_email from request data and analyze_kanji call

        if not word:
            return Response({"error": "word is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. DB 캐시 확인
        cached = Word.objects.filter(input_text=word).first()
        if cached:
            # 캐시가 있어도 히스토리는 남김 (백그라운드) - Now this logic is removed as history is local
            # threading.Thread(target=save_analysis_to_db, args=(word, cached.result_data, user_email)).start()
            return Response(cached.result_data)
        
        # 2. 캐시 없으면 AI 호출
        result = analyze_kanji(word)
        if "error" in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 3. 백그라운드 저장 (user_email removed)
        threading.Thread(target=save_analysis_to_db, args=(word, result)).start()
            
        return Response(result)
    except Exception as e:
        import traceback
        print(f"Unexpected error in analyze_kanji_view: {e}")
        print(traceback.format_exc())
        return Response({
            "error": "서버 내부 오류가 발생했습니다.",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
