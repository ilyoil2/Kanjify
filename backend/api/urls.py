from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VocabularyViewSet, analyze_kanji_view, signup_view, login_view, history_view # Re-added history_view import

router = DefaultRouter()
router.register(r'vocabulary', VocabularyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('analyze-kanji/', analyze_kanji_view, name='analyze-kanji'),
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('history/', history_view, name='history'), # Re-added history path
]
