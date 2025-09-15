from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework.decorators import action

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
from users.models import UserProfile


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
        if self.action in ["list", "retrieve", "by_slug"]:
            return [AllowAny()]
        if self.action in ["create", "toggle_like"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()

        tag = self.request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__id=int(tag)) if tag.isdigit(
            ) else qs.filter(tags__name__iexact=tag)

        tags = self.request.query_params.get("tags")
        if tags:
            parts = [p.strip() for p in tags.split(",") if p.strip()]
            ids = [int(p) for p in parts if p.isdigit()]
            names = [p for p in parts if not p.isdigit()]
            if ids or names:
                qs = qs.filter(Q(tags__id__in=ids) | Q(
                    tags__name__in=names)).distinct()

        author = self.request.query_params.get("author")
        if author:
            qs = qs.filter(author_id=int(author)) if author.isdigit(
            ) else qs.filter(author__username__iexact=author)

        mine = self.request.query_params.get("mine")
        if mine in ("1", "true", "True"):
            qs = qs.filter(
                author=self.request.user) if self.request.user.is_authenticated else qs.none()

        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], url_path="toggle-like")
    def toggle_like(self, request, pk=None):
        article = self.get_object()
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        like, created = PostUserLikes.objects.get_or_create(
            user=profile, article=article)
        if not created:
            like.delete()
        return Response({"liked": created, "count": article.likes.count()}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path=r"by-slug/(?P<slug>[-\w]+)")
    def by_slug(self, request, slug=None):
        article = get_object_or_404(Article, slug=slug)
        return Response(self.get_serializer(article).data, status=status.HTTP_200_OK)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("author", "article").all()
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
        return qs.filter(article_id=article_id) if article_id else qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ArticleCommentsView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get_queryset(self):
        return Comment.objects.filter(article_id=self.kwargs["article_id"]).select_related("author", "article")

    def get_serializer_class(self):
        return CommentCreateNestedRequestSerializer if self.request.method == "POST" else CommentSerializer

    def post(self, request, *args, **kwargs):
        article = get_object_or_404(Article, pk=self.kwargs["article_id"])
        req = CommentCreateNestedRequestSerializer(
            data=request.data, context={"request": request})
        req.is_valid(raise_exception=True)
        created = Comment.objects.create(
            article=article, author=request.user, content=req.validated_data["content"])
        return Response(
            CommentNestedResponseSerializer(
                created, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class PostUserLikesViewSet(viewsets.ModelViewSet):
    queryset = PostUserLikes.objects.select_related("user", "article").all()
    serializer_class = PostUserLikesSerializer
    pagination_class = None

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
            qs = qs.filter(
                user=self.request.user.userprofile) if self.request.user.is_authenticated else qs.none()
        return qs

    def perform_create(self, serializer):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        serializer.save(user=profile)
