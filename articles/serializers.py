from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Article, Comment, Tag, PostUserLikes


class CurrentProfileDefault:
    """Default שמחזיר request.user.userprofile עבור HiddenField."""
    requires_context = True

    def __call__(self, serializer_field):
        req = serializer_field.context.get("request")
        if not req or not getattr(req, "user", None) or not req.user.is_authenticated:
            return None
        from users.models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=req.user)
        return profile


# --- Tags --- #
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


# --- Articles --- #
class ArticleSerializer(serializers.ModelSerializer):
    slug = serializers.CharField(read_only=True)
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id", "title", "content", "slug", "tags",
            "created_at", "updated_at", "author", "author_id"
        ]
        read_only_fields = ["slug", "created_at", "updated_at", "author_id"]

    def get_author_id(self, obj):
        return obj.author_id

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["author_id"] = instance.author_id
        return data


# --- Comments (generic) --- #
class CommentSerializer(serializers.ModelSerializer):
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "article", "content",
                  "created_at", "author", "author_id"]
        read_only_fields = ["created_at", "author_id"]

    def get_author_id(self, obj):
        return obj.author_id


# --- Comments (nested endpoint) --- #
class CommentCreateNestedRequestSerializer(serializers.Serializer):
    content = serializers.CharField()


class CommentNestedResponseSerializer(serializers.ModelSerializer):
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "content", "author_id", "created_at"]

    def get_author_id(self, obj):
        return obj.author_id


# --- Likes --- #
class PostUserLikesSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=CurrentProfileDefault())
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = PostUserLikes
        fields = ["id", "article", "user", "user_id"]

    def get_user_id(self, obj):
        return obj.user_id
