from rest_framework import serializers
from .models import Article, Comment, Tag, PostUserLikes


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class ArticleSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, required=False
    )
    tag_names = serializers.SerializerMethodField(read_only=True)
    likes_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "content",
            "slug",
            "tags",
            "tag_names",
            "likes_count",
            "created_at",
            "updated_at",
            "author_id",
        ]
        read_only_fields = [
            "id", "slug", "created_at", "updated_at", "author_id",
            "tag_names", "likes_count",
        ]

    def get_tag_names(self, obj):
        return [t.name for t in obj.tags.all()]

    def get_likes_count(self, obj):
        return obj.likes.count()


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    article = serializers.PrimaryKeyRelatedField(
        queryset=Article.objects.all())

    class Meta:
        model = Comment
        fields = [
            "id",
            "content",
            "created_at",
            "article",
            "author_id",
        ]
        read_only_fields = ["id", "created_at", "author_id"]

    def validate_content(self, value: str):
        cleaned = (value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Content cannot be empty.")
        return cleaned


class CommentCreateNestedRequestSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=10_000)

    def validate_content(self, value: str):
        cleaned = (value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Content cannot be empty.")
        return cleaned


class CommentNestedResponseSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    article = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "content",
            "created_at",
            "article",
            "author_id",
        ]
        read_only_fields = ["id", "created_at", "article", "author_id"]


class PostUserLikesSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    article = serializers.PrimaryKeyRelatedField(
        queryset=Article.objects.all())

    class Meta:
        model = PostUserLikes
        fields = ["id", "user", "article"]
        read_only_fields = ["id", "user"]
