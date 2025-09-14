from django.contrib import admin
from .models import Article, Comment, Tag, PostUserLikes


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "slug", "author",
                    "created_at", "updated_at")
    list_filter = ("author", "tags", "created_at", "updated_at")
    search_fields = ("title", "slug", "content", "author__username",
                     "author__first_name", "author__last_name")
    filter_horizontal = ("tags",)
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "article", "author", "created_at")
    list_filter = ("author", "created_at")
    search_fields = ("content", "author__username", "article__title")
    autocomplete_fields = ("article", "author")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(PostUserLikes)
class PostUserLikesAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "article")
    list_filter = ("user", "article")
    search_fields = ("user__id", "article__title")
    autocomplete_fields = ("user", "article")
