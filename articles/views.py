from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
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
from users.models import UserProfile


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().select_related("author")
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @extend_schema(
        description="קבלת רשימת מאמרים (כולל חיפוש, מיון ופג'ינציה)",
        responses=ArticleSerializer(many=True),
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("article", "author").all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PostUserLikesViewSet(viewsets.ModelViewSet):
    """
    POST /api/post-user-likes/  עם ברירת מחדל toggle=True:
      - אם הלייק קיים -> מוחק (unlike) ומחזיר 200 {"status":"unliked"}
      - אם לא קיים   -> יוצר (like) ומחזיר 201 {"status":"liked", ...}

    אם שולחים toggle=false נקבל "create-only":
      - אם כבר קיים -> 409
      - אם לא       -> 201
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

        # call back to get only the likes of the current user
        if mine in ("1", "true", "True") and user.is_authenticated:
            try:
                profile = UserProfile.objects.get(user=user)
                qs = qs.filter(user=profile)
            except UserProfile.DoesNotExist:
                return qs.none()

        return qs

    def create(self, request, *args, **kwargs):
        # userprofile of the logged-in user
        try:
            userprof = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response(
                {"detail": "User profile not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        article_id = request.data.get("article")
        if not article_id:
            return Response(
                {"article": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        toggle = request.data.get("toggle", True)
        if str(toggle).lower() in ("1", "true", "yes"):
            # toggle-mode
            existing = PostUserLikes.objects.filter(
                user=userprof, article_id=article_id
            ).first()
            if existing:
                existing.delete()
                return Response({"status": "unliked"}, status=status.HTTP_200_OK)

            try:
                with transaction.atomic():
                    like = PostUserLikes.objects.create(
                        user=userprof, article_id=article_id
                    )
            except IntegrityError:
                # rare race condition: if created meanwhile
                return Response({"status": "liked"}, status=status.HTTP_200_OK)

            data = PostUserLikesSerializer(like).data
            return Response({**data, "status": "liked"}, status=status.HTTP_201_CREATED)

        # create-only
        try:
            with transaction.atomic():
                like = PostUserLikes.objects.create(
                    user=userprof, article_id=article_id)
        except IntegrityError:
            return Response(
                {"detail": "Already liked"},
                status=status.HTTP_409_CONFLICT,
            )

        data = PostUserLikesSerializer(like).data
        return Response(data, status=status.HTTP_201_CREATED)


class ArticleCommentsView(APIView):
    """
    GET  /api/articles/<article_id>/comments/
    POST /api/articles/<article_id>/comments/
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Comment.objects.none()
    serializer_class = CommentNestedResponseSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Comment.objects.none()
        article_id = self.kwargs["article_id"]
        return Comment.objects.filter(article_id=article_id).select_related(
            "author", "article"
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="article_id", type=int, location=OpenApiParameter.PATH
            ),
        ],
        responses=CommentNestedResponseSerializer(many=True),
        description="קבלת תגובות לפי מזהה מאמר",
    )
    def get(self, request, article_id: int):
        qs = self.get_queryset()
        data = CommentNestedResponseSerializer(qs, many=True).data
        return Response(data)

    @extend_schema(
        request=CommentCreateNestedRequestSerializer,
        parameters=[
            OpenApiParameter(
                name="article_id", type=int, location=OpenApiParameter.PATH
            ),
        ],
        responses=CommentNestedResponseSerializer,
        description="הוספת תגובה למאמר לפי מזהה",
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
            status=status.HTTP_201_CREATED,
        )
