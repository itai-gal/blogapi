from django.shortcuts import get_object_or_404
from django.db.models import Exists, OuterRef, Value, BooleanField, Subquery, Count, IntegerField
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Article, Comment, PostUserLikes
from .serializers import (
    ArticleSerializer,
    CommentSerializer,
    CommentNestedResponseSerializer,
    CommentCreateNestedRequestSerializer,
    PostUserLikesSerializer,
)


class ArticleViewSet(viewsets.ModelViewSet):
    """
    CRUD למאמרים + list עם likes_count ו-user_liked.
    כולל חיפוש (?search=) ומיון (?ordering=created_at או -likes_count).
    """
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "updated_at", "title", "likes_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # avoid N+1 for author
        qs = Article.objects.all().select_related("author")

        # annotate likes_count
        likes_count_sq = PostUserLikes.objects.filter(
            article=OuterRef("pk")
        ).values("article").annotate(c=Count("*")).values("c")[:1]

        # who liked by current user
        userprof = None
        user = getattr(self.request, "user", None)
        if getattr(user, "is_authenticated", False):
            userprof = getattr(user, "userprofile", None)

        if userprof:
            user_liked_expr = Exists(
                PostUserLikes.objects.filter(
                    article=OuterRef("pk"), user=userprof)
            )
        else:
            user_liked_expr = Value(False, output_field=BooleanField())

        return qs.annotate(
            likes_count=Subquery(likes_count_sq, output_field=IntegerField()),
            user_liked=user_liked_expr,
        )

    def perform_create(self, serializer):
        # if user is authenticated, set author to userprofile
        author = None
        user = self.request.user
        if getattr(user, "is_authenticated", False):
            author = getattr(user, "userprofile", None)
        serializer.save(author=author)

    @extend_schema(
        description="קבלת רשימת מאמרים (כולל חיפוש, מיון, פג'ינציה ושדות likes_count/user_liked)",
        responses=ArticleSerializer(many=True),
        parameters=[
            OpenApiParameter(
                name="search", description="חיפוש בכותרת/תוכן", required=False, type=str),
            OpenApiParameter(
                name="ordering", description="שדות מיון: created_at, -created_at, likes_count, -likes_count וכו'", required=False, type=str),
            OpenApiParameter(
                name="page", description="מספר עמוד לפג'ינציה", required=False, type=int),
        ],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("article", "author").all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class PostUserLikesViewSet(viewsets.ModelViewSet):
    """
    יצירה/מחיקה/רשימה של לייקים. מחזיר רק שורות לפי פילטרים.
    POST יוצר לייק יחיד למשתמש/מאמר (יש unique constraint).
    """
    queryset = PostUserLikes.objects.select_related("article", "user").all()
    serializer_class = PostUserLikesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        article_id = self.request.query_params.get("article")
        mine = self.request.query_params.get("mine")

        if article_id:
            qs = qs.filter(article_id=article_id)
        if mine in ("1", "true", "True") and getattr(user, "is_authenticated", False):
            userprof = getattr(user, "userprofile", None)
            if userprof:
                qs = qs.filter(user=userprof)
            else:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        userprof = getattr(self.request.user, "userprofile", None)
        serializer.save(user=userprof)


class ArticleCommentsView(APIView):
    """
    רשימת תגובות + יצירת תגובה מקוננת לפי article_id.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = CommentNestedResponseSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Comment.objects.none()
        article_id = self.kwargs["article_id"]
        return Comment.objects.filter(article_id=article_id).select_related("author", "article")

    @extend_schema(
        parameters=[OpenApiParameter(
            name="article_id", type=int, location=OpenApiParameter.PATH)],
        responses=CommentNestedResponseSerializer(many=True),
        description="קבלת תגובות לפי מזהה מאמר",
    )
    def get(self, request, article_id: int):
        qs = self.get_queryset()
        data = CommentNestedResponseSerializer(qs, many=True).data
        return Response(data)

    @extend_schema(
        request=CommentCreateNestedRequestSerializer,
        parameters=[OpenApiParameter(
            name="article_id", type=int, location=OpenApiParameter.PATH)],
        responses=CommentNestedResponseSerializer,
        description="הוספת תגובה למאמר לפי מזהה",
    )
    def post(self, request, article_id: int):
        get_object_or_404(Article, pk=article_id)
        ser_in = CommentCreateNestedRequestSerializer(data=request.data)
        ser_in.is_valid(raise_exception=True)
        obj = Comment.objects.create(
            content=ser_in.validated_data["content"],
            author=request.user.userprofile if request.user.is_authenticated else None,
            article_id=article_id,
        )
        return Response(CommentNestedResponseSerializer(obj).data, status=status.HTTP_201_CREATED)
