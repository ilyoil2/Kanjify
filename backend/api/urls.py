from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VocabularyViewSet, analyze_kanji_view

router = DefaultRouter()
router.register(r'vocabulary', VocabularyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('analyze-kanji/', analyze_kanji_view, name='analyze-kanji'),
]
