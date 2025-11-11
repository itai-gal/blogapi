from django.db.models import Count, Exists, OuterRef, Value, BooleanField, Q
from django.contrib.auth.models import User
from rest_framework import viewsets, mixins, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination

from .models import Article, Comment, PostUserLikes
from users.models import UserProfile
from .serializers import ArticleSerializer, CommentSerializer, PostUserLikeSerializer


class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


def _get_userprofile_for_request(request):
    user = request.user
    if not user or not user.is_authenticated:
        return None
    prof = getattr(user, "profile", None) or getattr(user, "userprofile", None)
    if prof:
        return prof
    return UserProfile.objects.filter(user=user).first()


class ArticleViewSet(viewsets.ModelViewSet):
    """
    CRUD for articles + annotated fields: likes_count, user_liked.
    Supports:
      ?search=…  (title/content)
      ?ordering=-created_at|created_at|-likes_count|likes_count|title|-title
    """
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = DefaultPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "title", "likes_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # likes_count
        qs = (
            Article.objects.all()
            .select_related("author")
            .prefetch_related("likes")
            .annotate(likes_count=Count("likes", distinct=True))
        )

        # user liked
        prof = _get_userprofile_for_request(self.request)
        if prof is not None:
            like_exists = PostUserLikes.objects.filter(
                user_id=prof.id,
                article_id=OuterRef("pk"),
            )
            qs = qs.annotate(user_liked=Exists(like_exists))
        else:
            qs = qs.annotate(user_liked=Value(
                False, output_field=BooleanField()))

        ordering = self.request.query_params.get("ordering")
        allowed = {"created_at", "-created_at",
                   "likes_count", "-likes_count", "title", "-title"}
        if ordering in allowed:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-created_at")

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise permissions.PermissionDenied("Authentication required")
        serializer.save(author=user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if not user.is_superuser and instance.author_id != user.id:
            raise permissions.PermissionDenied("Not allowed")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_superuser and instance.author_id != user.id:
            raise permissions.PermissionDenied("Not allowed")
        instance.delete()


class CommentViewSet(viewsets.ModelViewSet):
    """
    CRUD for comments; filter by article with ?article=<id>
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = DefaultPagination

    def get_queryset(self):
        qs = Comment.objects.select_related(
            "author", "article").order_by("-created_at")
        article_id = self.request.query_params.get("article")
        if article_id:
            qs = qs.filter(article_id=article_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if not user or not user.is_authenticated:
            raise permissions.PermissionDenied("Authentication required")
        serializer.save(author=user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if not user.is_superuser and instance.author_id != user.id:
            raise permissions.PermissionDenied("Not allowed")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_superuser and instance.author_id != user.id:
            raise permissions.PermissionDenied("Not allowed")
        instance.delete()


class PostUserLikesViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
):
    """
    Likes endpoints:
      - GET /post-user-likes/?mine=1           => current user's likes
      - GET /post-user-likes/?article=<id>     => likes for a specific article
      - POST { "article": <id> }               => like (unique per user+article)
      - DELETE /post-user-likes/{id}/          => unlike by like-row id
      - DELETE /post-user-likes/by-article/<article_id>/ => unlike by article id (current user)
    """
    serializer_class = PostUserLikeSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DefaultPagination

    def get_queryset(self):
        qs = PostUserLikes.objects.select_related(
            "user", "article").order_by("-created_at")
        mine = self.request.query_params.get("mine")
        article_id = self.request.query_params.get("article")

        if mine:
            prof = _get_userprofile_for_request(self.request)
            if prof is None:
                return PostUserLikes.objects.none()
            qs = qs.filter(user_id=prof.id)

        if article_id:
            qs = qs.filter(article_id=article_id)

        return qs

    def perform_create(self, serializer):
        prof = _get_userprofile_for_request(self.request)
        if prof is None:
            raise permissions.PermissionDenied("Authentication required")
        serializer.save(user=prof)

    @action(detail=False, methods=["delete"], url_path=r"by-article/(?P<article_id>\d+)")
    def by_article(self, request, article_id=None):
        """
        DELETE /api/post-user-likes/by-article/<article_id>/
        Removes the current user's like for that article (idempotent).
        """
        prof = _get_userprofile_for_request(request)
        if prof is None:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        PostUserLikes.objects.filter(
            user_id=prof.id, article_id=article_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
