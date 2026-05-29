from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VocabularyViewSet, WordButtonViewSet, WordStatusViewSet, analyze_kanji_view, signup_view, login_view, history_view

router = DefaultRouter()
router.register(r'vocabulary', VocabularyViewSet)
router.register(r'buttons', WordButtonViewSet)
router.register(r'word-status', WordStatusViewSet, basename='wordstatus')

urlpatterns = [
    path('', include(router.urls)),
    path('analyze-kanji/', analyze_kanji_view, name='analyze-kanji'),
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('history/', history_view, name='history'), # Re-added history path
]
