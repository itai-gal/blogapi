from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


class Article(models.Model):
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="articles")
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _build_unique_slug(self) -> str:
        base = slugify(self.title) or "untitled"
        candidate = base
        i = 2
        while Article.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base}-{i}"
            i += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._build_unique_slug()
        else:
            if Article.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = self._build_unique_slug()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.title} (#{self.pk})"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["slug"]),
        ]


class Comment(models.Model):
    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self) -> str:
        return f"Comment<{self.pk}> on Article<{self.article_id}>"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["article", "created_at"]),
        ]


class PostUserLikes(models.Model):
    user = models.ForeignKey(
        "users.UserProfile",
        on_delete=models.CASCADE,
        related_name="post_likes",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="likes",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "article"],
                name="unique_like_per_user_article",
            )
        ]
        indexes = [
            models.Index(fields=["user", "article"]),
            models.Index(fields=["article", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Like<user={self.user_id}, article={self.article_id}>"
