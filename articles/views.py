from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404

from .models import Article, Comment
from .serializers import ArticleSerializer, CommentSerializer
from .permissions import IsOwnerOrAdmin


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().select_related("author")
    serializer_class = ArticleSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "content", "author__username",
                     "author__first_name", "author__last_name"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrAdmin()]


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().select_related("author", "article")
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        article_id = self.request.query_params.get("article")
        if article_id:
            qs = qs.filter(article_id=article_id)
        return qs


class ArticleCommentsView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get_queryset(self):
        return Comment.objects.filter(article_id=self.kwargs["article_id"]).select_related("author", "article")

    def perform_create(self, serializer):
        article = get_object_or_404(Article, pk=self.kwargs["article_id"])
        serializer.save(article=article, author=self.request.user)
