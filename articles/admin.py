from django.contrib import admin
from .models import Article, Comment


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "is_published", "created_at")
    list_filter = ("is_published", "created_at")
    search_fields = ("title", "content", "author__username",
                     "author__first_name", "author__last_name")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "article", "author", "created_at")
    search_fields = ("content", "author__username", "article__title")
    autocomplete_fields = ("article", "author")
