from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import AllowAny
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from articles.views import ArticleViewSet, CommentViewSet, PostUserLikesViewSet, ArticleCommentsView
from users.views import AuthViewSet, UserProfileViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r"articles", ArticleViewSet, basename="article")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"post-user-likes", PostUserLikesViewSet,
                basename="postuserlikes")
router.register(r"auth", AuthViewSet, basename="auth")
router.register(r"user-profiles", UserProfileViewSet, basename="userprofile")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),

    # JWT
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Docs & OpenAPI
    path(
        "api/schema/",
        SpectacularAPIView.as_view(permission_classes=[AllowAny]),
        name="schema",
    ),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(
            url_name="schema", permission_classes=[AllowAny]),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(
            url_name="schema", permission_classes=[AllowAny]),
        name="redoc",
    ),

    # Nested comments
    path("api/articles/<int:article_id>/comments/",
         ArticleCommentsView.as_view(), name="article-comments"),
]
