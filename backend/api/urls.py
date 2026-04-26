from django.urls import path, include
from rest_framework.routers import DefaultRouter
urlpatterns = [
    path('', include(router.urls)),
    path('analyze-kanji/', analyze_kanji_view, name='analyze-kanji'),
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
]

