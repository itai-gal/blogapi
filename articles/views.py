from django.db.models import Count, Exists, OuterRef, Value, BooleanField
from django.contrib.auth.models import User
from rest_framework import viewsets, mixins, permissions, filters
from rest_framework.pagination import PageNumberPagination

from .models import Article, Comment, PostUserLikes
from users.models import UserProfile
from .serializers import ArticleSerializer, CommentSerializer, PostUserLikeSerializer


class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


def _get_userprofile_for_request(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None
    prof = getattr(user, "profile", None) or getattr(user, "userprofile", None)
    if prof:
        return prof
    return UserProfile.objects.filter(user=user).first()


class ArticleViewSet(viewsets.ModelViewSet):
    """
    CRUD for articles + annotated returns of likes_count and user_liked.
    Supports filtering/searching/sorting:
      ?search=… => searches in title and content
      ?ordering=-created_at / created_at / -likes_count / title
    """
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = DefaultPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "title", "likes_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Article.objects.all().annotate(
            likes_count=Count("likes", distinct=True)
        )

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
    CRUD for comments, with filtering by article ID.
    - GET /comments/?article=ID  => comments for a specific article
    - POST /comments/              => create a new comment
    - PUT /comments/{id}/          => update an existing comment
    - DELETE /comments/{id}/       => delete a comment
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
    crud likes of users to articles.
    - GET /post-user-likes/?mine=1    => returns only the current user's likes
    - GET /post-user-likes/?article=ID => likes for a specific article (e.g. to find mine)
    - POST { "article": <id> }        => create a like (unique per user+article)
    - DELETE /post-user-likes/{id}/   => remove a like
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
