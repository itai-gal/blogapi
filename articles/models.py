from uuid import uuid4
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


class Tag(models.Model):
    name = models.CharField(max_length=64, unique=True)

    def __str__(self) -> str:
        return self.name


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    slug = models.SlugField(max_length=280, unique=True, blank=True, null=True)
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="articles")
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.slug})"

    def _generate_unique_slug(self, base: str) -> str:
        base = base or f"post-{uuid4().hex[:8]}"
        candidate = base
        i = 2
        while Article.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base}-{i}"
            i += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title, allow_unicode=True)
            self.slug = self._generate_unique_slug(base)
        super().save(*args, **kwargs)


class Comment(models.Model):
    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return f"Comment #{self.pk} on {self.article_id}"


class PostUserLikes(models.Model):
    user = models.ForeignKey(
        "users.UserProfile", on_delete=models.CASCADE, related_name="likes")
    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="likes")

    class Meta:
        unique_together = ("user", "article")

    def __str__(self) -> str:
        return f"Like u={self.user_id} a={self.article_id}"
