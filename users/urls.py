from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import AuthViewSet, UserProfileViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'user-profiles', UserProfileViewSet, basename='user-profiles')

urlpatterns = [
    path('', include(router.urls)),
]
