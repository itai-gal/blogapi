from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ArticleViewSet,
    CommentViewSet,
    ArticleCommentsView,
    TagViewSet,
    PostUserLikesViewSet,
)

router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='articles')
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'tags', TagViewSet, basename='tags')
router.register(r'post-user-likes', PostUserLikesViewSet,
                basename='post-user-likes')

urlpatterns = [
    path('', include(router.urls)),
    path('articles/<int:article_id>/comments/',
         ArticleCommentsView.as_view(), name='article-comments'),
]
