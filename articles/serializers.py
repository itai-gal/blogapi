from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Article, Comment, PostUserLikes


# ==== Articles ====

class AuthorTinySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class ArticleSerializer(serializers.ModelSerializer):
    author = AuthorTinySerializer(read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "content",
                  "created_at", "updated_at", "author", "slug"]
        read_only_fields = ["id", "created_at", "updated_at", "author", "slug"]


# ==== Comments (flat CRUD) ====

class CommentSerializer(serializers.ModelSerializer):
    author = AuthorTinySerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "article", "author", "content", "created_at"]
        read_only_fields = ["id", "author", "created_at"]


# ==== Comments (nested for /api/articles/<id>/comments/) ====

class CommentCreateNestedRequestSerializer(serializers.Serializer):
    content = serializers.CharField()


class CommentNestedAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class CommentNestedResponseSerializer(serializers.ModelSerializer):
    author = CommentNestedAuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "content", "created_at", "author"]


# ==== Likes ====

class PostUserLikesSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PostUserLikes
        fields = ["id", "article", "user", "created_at"]
        read_only_fields = ["id", "user", "created_at"]
