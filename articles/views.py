from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.shortcuts import get_object_or_404

from .models import Article, Comment, PostUserLikes
from .serializers import (
    ArticleSerializer,
    CommentSerializer,
    CommentNestedResponseSerializer,
    CommentCreateNestedRequestSerializer,
    PostUserLikesSerializer,
)


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().select_related("author")
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @extend_schema(
        description="קבלת רשימת מאמרים (כולל חיפוש, מיון ופג'ינציה)",
        responses=ArticleSerializer(many=True)
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("article", "author").all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class PostUserLikesViewSet(viewsets.ModelViewSet):
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
        if mine in ("1", "true", "True") and user.is_authenticated:
            qs = qs.filter(user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ArticleCommentsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Comment.objects.none()
    serializer_class = CommentNestedResponseSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Comment.objects.none()
        article_id = self.kwargs["article_id"]
        return Comment.objects.filter(article_id=article_id).select_related("author", "article")

    @extend_schema(
        parameters=[
            OpenApiParameter(name="article_id", type=int,
                             location=OpenApiParameter.PATH),
        ],
        responses=CommentNestedResponseSerializer(many=True),
        description="קבלת תגובות לפי מזהה מאמר"
    )
    def get(self, request, article_id: int):
        qs = self.get_queryset()
        data = CommentNestedResponseSerializer(qs, many=True).data
        return Response(data)

    @extend_schema(
        request=CommentCreateNestedRequestSerializer,
        parameters=[
            OpenApiParameter(name="article_id", type=int,
                             location=OpenApiParameter.PATH),
        ],
        responses=CommentNestedResponseSerializer,
        description="הוספת תגובה למאמר לפי מזהה"
    )
    def post(self, request, article_id: int):
        get_object_or_404(Article, pk=article_id)

        ser_in = CommentCreateNestedRequestSerializer(data=request.data)
        ser_in.is_valid(raise_exception=True)
        obj = Comment.objects.create(
            content=ser_in.validated_data["content"],
            author=request.user if request.user.is_authenticated else None,
            article_id=article_id,
        )
        return Response(
            CommentNestedResponseSerializer(obj).data,
            status=status.HTTP_201_CREATED
        )
