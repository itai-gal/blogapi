from rest_framework import serializers
from .models import Article, Comment, PostUserLikes


class ArticleSerializer(serializers.ModelSerializer):
    # read-only fields for annotated values
    likes_count = serializers.IntegerField(read_only=True, default=0)
    user_liked = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Article
        fields = (
            "id",
            "title",
            "content",
            "slug",
            "created_at",
            "updated_at",
            "author",
            "likes_count",
            "user_liked",
        )
        read_only_fields = ("id", "slug", "created_at",
                            "updated_at", "author", "likes_count", "user_liked")


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("id", "content", "article",
                  "author", "created_at", "updated_at")
        read_only_fields = ("id", "author", "created_at", "updated_at")


# article nested comments serializers
class CommentNestedResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("id", "content", "author", "created_at")


class CommentCreateNestedRequestSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=500)


class PostUserLikesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostUserLikes
        fields = ("id", "user", "article", "created_at")
        read_only_fields = ("id", "user", "created_at")
