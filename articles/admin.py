from django.contrib import admin
from .models import Article, Comment, Tag, PostUserLikes


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ("content", "author", "created_at")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("author",)


class PostUserLikesInline(admin.TabularInline):
    model = PostUserLikes
    extra = 0
    fields = ("user",)
    autocomplete_fields = ("user",)


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "slug", "author", "created_at")
    list_filter = ("created_at", "tags")
    search_fields = ("title", "content", "slug", "author__username")
    autocomplete_fields = ("author", "tags")
    readonly_fields = ("slug", "created_at", "updated_at")
    inlines = [CommentInline, PostUserLikesInline]
    ordering = ("-created_at",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "article", "author", "short_content", "created_at")
    list_filter = ("created_at",)
    search_fields = ("content", "article__title", "author__username")
    autocomplete_fields = ("article", "author")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)

    @admin.display(description="content")
    def short_content(self, obj):
        return (obj.content or "")[:60]


@admin.register(PostUserLikes)
class PostUserLikesAdmin(admin.ModelAdmin):
    list_display = ("id", "article", "user")
    search_fields = ("article__title", "user__user__username")
    autocomplete_fields = ("article", "user")
    ordering = ("-id",)
