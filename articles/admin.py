from django.contrib import admin
from .models import Article, Comment, Tag, PostUserLikes


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "slug", "author",
                    "is_published", "created_at")
    list_filter = ("is_published", "created_at", "tags")
    search_fields = ("title", "slug", "content", "author__username",
                     "author__first_name", "author__last_name")
    filter_horizontal = ("tags",)
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "article", "author", "created_at")
    search_fields = ("content", "author__username", "article__title")
    autocomplete_fields = ("article", "author")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(PostUserLikes)
class PostUserLikesAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "article", "created_at")
    search_fields = ("user__user__username", "article__title")
    autocomplete_fields = ("user", "article")
