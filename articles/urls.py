from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ArticleViewSet, CommentViewSet, ArticleCommentsView

router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='articles')
router.register(r'comments', CommentViewSet, basename='comments')

urlpatterns = [
    path('', include(router.urls)),
    path('articles/<int:article_id>/comments/',
         ArticleCommentsView.as_view(), name='article-comments'),
]
