from django.contrib import admin
from .models import Article, Comment, PostUserLikes


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author",
                    "created_at", "updated_at", "slug")
    list_select_related = ("author",)
    search_fields = ("title", "content", "author__username", "slug")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "slug")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "article", "author", "created_at")
    list_select_related = ("article", "author")
    search_fields = ("content", "author__username", "article__title")
    list_filter = ("created_at",)


@admin.register(PostUserLikes)
class PostUserLikesAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "article", "created_at")
    list_select_related = ("user", "user__user", "article")
    search_fields = ("user__user__username", "article__title")
    list_filter = ("created_at",)
