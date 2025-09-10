from django.shortcuts import get_object_or_404
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework import status

from .models import Article, Comment, Tag, PostUserLikes
from .serializers import (
    ArticleSerializer,
    CommentSerializer,
    CommentCreateNestedRequestSerializer,
    CommentNestedResponseSerializer,
    TagSerializer,
    PostUserLikesSerializer,
)
from .permissions import IsOwnerOrAdmin


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().select_related(
        "author").prefetch_related("tags")
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
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get_queryset(self):
        return Comment.objects.filter(article_id=self.kwargs["article_id"]).select_related("author", "article")

    def post(self, request, *args, **kwargs):
        article = get_object_or_404(Article, pk=self.kwargs["article_id"])
        req_serializer = CommentCreateNestedRequestSerializer(
            data=request.data, context={"request": request})
        req_serializer.is_valid(raise_exception=True)

        created = Comment.objects.create(
            article=article,
            author=request.user,
            content=req_serializer.validated_data["content"],
        )
        resp = CommentNestedResponseSerializer(
            instance=created, context={"request": request})
        return Response(resp.data, status=status.HTTP_201_CREATED)


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class PostUserLikesViewSet(viewsets.ModelViewSet):
    queryset = PostUserLikes.objects.select_related("user", "article").all()
    serializer_class = PostUserLikesSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        article_id = self.request.query_params.get("article")
        if article_id:
            qs = qs.filter(article_id=article_id)
        mine = self.request.query_params.get("mine")
        if mine in ("1", "true", "True"):
            if self.request.user.is_authenticated:
                qs = qs.filter(user=self.request.user.userprofile)
            else:
                qs = qs.none()
        return qs
