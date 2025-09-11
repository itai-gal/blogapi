from django.shortcuts import get_object_or_404
from django.db import models

from rest_framework import viewsets, generics, status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
    IsAuthenticatedOrReadOnly,
)
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework.decorators import action

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiExample,
)

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


@extend_schema_view(
    list=extend_schema(
        tags=["Articles"],
        summary="List articles",
        parameters=[
            OpenApiParameter(
                name="search",
                description="Search in title/content/author",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="ordering",
                description="e.g. -created_at or title",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="tag",
                description="Filter by single tag (id or name)",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="tags",
                description="Filter by multiple tags: ids/names comma-separated",
                required=False,
                type=str,
            ),
        ],
    ),
    retrieve=extend_schema(tags=["Articles"], summary="Retrieve article"),
    create=extend_schema(
        tags=["Articles"],
        summary="Create article",
        examples=[
            OpenApiExample(
                "Create Article",
                value={"title": "My first", "content": "Body", "tags": [1]},
                request_only=True,
            )
        ],
    ),
    partial_update=extend_schema(
        tags=["Articles"], summary="Update article (owner/admin)"
    ),
    destroy=extend_schema(
        tags=["Articles"], summary="Delete article (owner/admin)"),
)
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().select_related(
        "author").prefetch_related("tags")
    serializer_class = ArticleSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        "title",
        "content",
        "author__username",
        "author__first_name",
        "author__last_name",
    ]
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
            if tag.isdigit():
                qs = qs.filter(tags__id=int(tag))
            else:
                qs = qs.filter(tags__name__iexact=tag)

        tags = self.request.query_params.get("tags")
        if tags:
            parts = [p.strip() for p in tags.split(",") if p.strip()]
            ids = [int(p) for p in parts if p.isdigit()]
            names = [p for p in parts if not p.isdigit()]
            if ids or names:
                qs = qs.filter(
                    models.Q(tags__id__in=ids) | models.Q(tags__name__in=names)
                ).distinct()

        return qs

    @extend_schema(
        tags=["Articles"],
        summary="Toggle like on an article",
        request=None,
        responses={
            200: OpenApiExample(
                "ToggleLikeResponse",
                description="liked flips on/off; count is total likes now",
                value={"liked": True, "count": 3},
                response_only=True,
            )
        },
    )
    @action(detail=True, methods=["post"], url_path="toggle-like")
    def toggle_like(self, request, pk=None):
        article = self.get_object()
        profile = request.user.userprofile

        like, created = PostUserLikes.objects.get_or_create(
            user=profile, article=article
        )
        liked = True if created else False
        if not created:
            like.delete()

        return Response(
            {"liked": liked, "count": article.likes.count()},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Articles"],
        summary="Get article by slug",
        parameters=[
            OpenApiParameter(
                name="slug", description="Article slug", required=True, type=str
            )
        ],
        responses=ArticleSerializer,
    )
    @action(detail=False, methods=["get"], url_path=r"by-slug/(?P<slug>[-a-z0-9]+)")
    def by_slug(self, request, slug=None):
        """
        GET /api/articles/by-slug/<slug>/
        """
        article = get_object_or_404(Article, slug=slug)
        ser = self.get_serializer(article)
        return Response(ser.data, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(
        tags=["Comments"],
        summary="List comments",
        parameters=[
            OpenApiParameter(
                name="article",
                description="Filter by article id",
                required=False,
                type=int,
            )
        ],
    ),
    retrieve=extend_schema(tags=["Comments"], summary="Retrieve comment"),
    create=extend_schema(
        tags=["Comments"],
        summary="Create comment (generic endpoint)",
        request=CommentSerializer,
        responses=CommentSerializer,
        examples=[
            OpenApiExample(
                "CreateCommentGeneric",
                value={"content": "Nice!", "article": 1},
                request_only=True,
            )
        ],
    ),
    partial_update=extend_schema(tags=["Comments"], summary="Update comment"),
    destroy=extend_schema(tags=["Comments"], summary="Delete comment"),
)
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


@extend_schema(
    tags=["Comments (Nested)"],
    summary="List & create comments for an article",
    parameters=[
        OpenApiParameter(
            name="article_id",
            description="Article ID (from path)",
            required=True,
            type=int,
            location=OpenApiParameter.PATH,
        ),
    ],
)
class ArticleCommentsView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get_queryset(self):
        return Comment.objects.filter(article_id=self.kwargs["article_id"]).select_related(
            "author", "article"
        )

    def get_serializer_class(self):
        return (
            CommentCreateNestedRequestSerializer
            if self.request.method == "POST"
            else CommentSerializer
        )

    @extend_schema(
        request=CommentCreateNestedRequestSerializer,
        responses=CommentNestedResponseSerializer,
        examples=[
            OpenApiExample(
                "NestedCreateRequest", value={"content": "Great post!"}, request_only=True
            ),
            OpenApiExample(
                "NestedCreateResponse",
                value={
                    "id": 5,
                    "article": 1,
                    "content": "Great post!",
                    "author_id": 2,
                    "created_at": "2025-01-01T11:00:00Z",
                },
                response_only=True,
            ),
        ],
    )
    def post(self, request, *args, **kwargs):
        article = get_object_or_404(Article, pk=self.kwargs["article_id"])
        req_serializer = CommentCreateNestedRequestSerializer(
            data=request.data, context={"request": request}
        )
        req_serializer.is_valid(raise_exception=True)

        created = Comment.objects.create(
            article=article,
            author=request.user,
            content=req_serializer.validated_data["content"],
        )
        resp = CommentNestedResponseSerializer(
            instance=created, context={"request": request}
        )
        return Response(resp.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    list=extend_schema(tags=["Tags"], summary="List tags"),
    retrieve=extend_schema(tags=["Tags"], summary="Retrieve tag"),
    create=extend_schema(tags=["Tags"], summary="Create tag"),
    partial_update=extend_schema(tags=["Tags"], summary="Update tag"),
    destroy=extend_schema(tags=["Tags"], summary="Delete tag"),
)
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


@extend_schema_view(
    list=extend_schema(
        tags=["Likes"],
        summary="List likes",
        parameters=[
            OpenApiParameter(
                name="article", description="Filter by article id", required=False, type=int
            ),
            OpenApiParameter(
                name="mine", description="Only my likes (1/true)", required=False, type=str
            ),
        ],
    ),
    retrieve=extend_schema(tags=["Likes"], summary="Retrieve like"),
    create=extend_schema(
        tags=["Likes"],
        summary="Create like",
        examples=[OpenApiExample("CreateLike", value={
                                 "article": 1}, request_only=True)],
    ),
    destroy=extend_schema(tags=["Likes"], summary="Delete like"),
)
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
            if self.request.user.is_authenticated:
                qs = qs.filter(user=self.request.user.userprofile)
            else:
                qs = qs.none()
        return qs
