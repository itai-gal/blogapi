from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import Article, Comment, Tag, PostUserLikes


class ArticleSerializer(ModelSerializer):
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())
    author_id = serializers.SerializerMethodField()

    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, required=False
    )
    tag_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Article
        fields = "__all__"

    def get_author_id(self, obj):
        return obj.author.id

    def get_tag_names(self, obj):
        return [t.name for t in obj.tags.all()]


class CommentSerializer(ModelSerializer):
    """
    סריאלייזר כללי ל-/api/comments/:
    - דורש article בבקשה (POST)
    """
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = "__all__"
        extra_kwargs = {
            "article": {"required": True}
        }

    def get_author_id(self, obj):
        return obj.author.id


class CommentCreateNestedRequestSerializer(ModelSerializer):
    content = serializers.CharField()

    class Meta:
        model = Comment
        fields = ("content",)


class CommentNestedResponseSerializer(CommentSerializer):
    pass


# ---------- Tags ----------

class TagSerializer(ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


# ---------- Likes (PostUserLikes) ----------

class CurrentProfileDefault:
    requires_context = True

    def __call__(self, serializer_field):
        return serializer_field.context["request"].user.userprofile


class PostUserLikesSerializer(ModelSerializer):
    user = serializers.HiddenField(default=CurrentProfileDefault())
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = PostUserLikes
        fields = "__all__"  # id, user, user_id, article, created_at
        extra_kwargs = {
            "article": {"required": True}
        }

    def get_user_id(self, obj):
        return obj.user.id
