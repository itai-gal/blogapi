from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import Article, Comment


class ArticleSerializer(ModelSerializer):
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = "__all__"

    def get_author_id(self, obj):
        return obj.author.id


class CommentSerializer(ModelSerializer):
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = "__all__"

    def get_author_id(self, obj):
        return obj.author.id


class CommentCreateForArticleSerializer(CommentSerializer):
    class Meta(CommentSerializer.Meta):
        extra_kwargs = {
            "article": {"read_only": True, "required": False}
        }
