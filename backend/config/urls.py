from django.urls import path, include

urlpatterns = [
    # API endpoints
    path('api/', include('api.urls')),
]
