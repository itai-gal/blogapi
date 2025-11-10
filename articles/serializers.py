from django.contrib.auth.models import User
from django.db import IntegrityError
from rest_framework import serializers
from .models import Article, Comment, PostUserLikes


class ArticleSerializer(serializers.ModelSerializer):
    likes_count = serializers.IntegerField(read_only=True)
    user_liked = serializers.BooleanField(read_only=True)
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Article
        fields = [
            "id",
            "author",
            "title",
            "slug",
            "content",
            "created_at",
            "updated_at",
            "likes_count",
            "user_liked",
        ]
        read_only_fields = ("id", "author", "slug", "created_at",
                            "updated_at", "likes_count", "user_liked")


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    article = serializers.PrimaryKeyRelatedField(
        queryset=Article.objects.all())

    class Meta:
        model = Comment
        fields = ["id", "article", "author", "content", "created_at"]
        read_only_fields = ("id", "author", "created_at")


class PostUserLikeSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    article = serializers.PrimaryKeyRelatedField(
        queryset=Article.objects.all())

    class Meta:
        model = PostUserLikes
        fields = ["id", "user", "article", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {"article": ["You already liked this article."]})
