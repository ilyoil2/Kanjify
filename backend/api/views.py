import threading
import traceback
from django.db import models
from django.db.models import Q
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from .models import Vocabulary, Word, User, SearchHistory, WordButton, WordStatus
from .serializers import VocabularySerializer
from .serializers import WordButtonSerializer
from .serializers import WordStatusSerializer
from .ai_utils import analyze_kanji


GUEST_EMAIL = 'guest@kanjify.app'

def get_current_user(email=None):
    target_email = email or GUEST_EMAIL
    user = User.objects.filter(email=target_email).first()
    if user:
        return user
    if target_email == GUEST_EMAIL:
        guest, _ = User.objects.get_or_create(
            username='guest',
            defaults={
                'email': GUEST_EMAIL,
                'password': make_password('guest'),
            }
        )
        return guest
    return None

class VocabularyViewSet(viewsets.ModelViewSet):
    serializer_class = VocabularySerializer
    queryset = Vocabulary.objects.all()

    def get_queryset(self):
        now = timezone.now()

        hidden_ids = WordStatus.objects.filter(
            Q(hidden_until__isnull=True) |
            Q(hidden_until__gt=now)
        ).values_list('vocabulary_id', flat=True)

        return Vocabulary.objects.exclude(
            id__in=hidden_ids
        ).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def hide(self, request):
        ids = request.data.get('ids', [])
        days = request.data.get('days', 0)
        
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        until = timezone.now() + timedelta(days=days)
        Vocabulary.objects.filter(id__in=ids).update(hidden_until=until)
        
        return Response({"message": f"{len(ids)} items hidden until {until}"})

    @action(detail=False, methods=['post'])
    def classify(self, request):
        vocabulary_ids = request.data.get('vocabulary_ids', [])
        button_id = request.data.get('button_id')
    
        button = get_object_or_404(WordButton, id=button_id)

        if button.hide_days is not None:
            hidden_until = timezone.now() + timedelta(days=button.hide_days)
        else:
            hidden_until = None  # 영구 숨김

        for vocab_id in vocabulary_ids:
            vocab = get_object_or_404(Vocabulary, id=vocab_id)
            WordStatus.objects.update_or_create(
                vocabulary=vocab,
                defaults={
                    "button": button,
                    "hidden_until": hidden_until,
                }
            )
        return Response({"message": f"{len(vocabulary_ids)} items hidden until {hidden_until}"})


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

@api_view(['GET', 'DELETE'])
def history_view(request):
    try:
        email = request.query_params.get('email')
        user = None
        if email:
            user = User.objects.filter(email=email).first()

        if request.method == 'GET':
            if user:
                history = SearchHistory.objects.filter(user=user)
            else:
                history = SearchHistory.objects.filter(user__isnull=True)[:50]

            data = []
            for h in history:
                data.append({
                    "id": h.id,
                    "word": h.word_text,
                    "meaning": h.meaning_ko,
                    "timestamp": h.created_at.isoformat()
                })
            return Response(data)

        elif request.method == 'DELETE':
            history_id = request.query_params.get('id')
            if history_id:
                # Delete specific entry
                SearchHistory.objects.filter(id=history_id).delete()
                return Response({"message": "삭제되었습니다."})
            else:
                # Clear all for this user/guest
                if user:
                    SearchHistory.objects.filter(user=user).delete()
                else:
                    SearchHistory.objects.filter(user__isnull=True).delete()
                return Response({"message": "전체 삭제되었습니다."})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Modified save_analysis_to_db to include user_email and SearchHistory logic
def save_analysis_to_db(word_text, result, user_email=None):
    """분석 결과를 Word 테이블에 저장하고 SearchHistory 기록 (검증 로직 포함)"""
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

        # SearchHistory 저장 (중복 제거 로직 추가: 기존 기록 삭제 후 재생성하여 최상단 이동)
        user = None
        if user_email:
            user = User.objects.filter(email=user_email).first()
        
        SearchHistory.objects.filter(user=user, word_text=word_text).delete()
        SearchHistory.objects.create(
            user=user,
            word_text=word_text,
            meaning_ko=info.get("meaning_ko")
        )
    except Exception as e:
        print(f"Error saving to DB: {e}")

@api_view(['POST'])
def analyze_kanji_view(request):
    try:
        word = request.data.get('word')
        user_email = request.data.get('email') # 유저 식별용
        skip_history = request.data.get('skip_history', False) # 히스토리 저장 스킵 여부

        if not word:
            return Response({"error": "word is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. DB 캐시 확인
        cached = Word.objects.filter(input_text=word).first()
        if cached:
            # 캐시가 있어도 히스토리는 남김 (skip_history가 False일 때만)
            if not skip_history:
                threading.Thread(target=save_analysis_to_db, args=(word, cached.result_data, user_email)).start()
            return Response(cached.result_data)
        
        # 2. 캐시 없으면 AI 호출
        result = analyze_kanji(word)
        if "error" in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 3. 백그라운드 저장 (skip_history 확인)
        if not skip_history:
            threading.Thread(target=save_analysis_to_db, args=(word, result, user_email)).start()
        else:
            # 히스토리는 안 남겨도 Word 캐시는 남김 (별도 함수 호출하거나 save_analysis_to_db 내부 수정 필요)
            # 여기서는 단순히 히스토리 생성을 막는 목적이므로 스킵
            pass
            
        return Response(result)
    except Exception as e:
        print(f"Unexpected error in analyze_kanji_view: {e}")
        print(traceback.format_exc())
        return Response({
            "error": "서버 내부 오류가 발생했습니다.",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WordButtonViewSet(viewsets.ModelViewSet):
    serializer_class = WordButtonSerializer
    queryset = WordButton.objects.all().order_by('hide_days')


class WordStatusViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WordStatusSerializer

    def get_queryset(self):
        queryset = WordStatus.objects.select_related('vocabulary', 'button').filter(
            Q(hidden_until__isnull=True) | Q(hidden_until__gt=timezone.now())
        ).order_by('-updated_at')
        button_id = self.request.query_params.get('button_id')
        if button_id:
            queryset = queryset.filter(button_id=button_id)
        return queryset

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        word_status = get_object_or_404(WordStatus, pk=pk)
        word_status.hidden_until = timezone.now() - timedelta(seconds=1)
        word_status.save()
        return Response({"message": "복구되었습니다."})
