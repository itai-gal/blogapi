from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Article(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True, null=True)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="articles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)

    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.author})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:50] or "article"
            candidate = base
            idx = 1
            while Article.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                idx += 1
                candidate = f"{base}-{idx}"
                if len(candidate) > 280:
                    candidate = candidate[:279]
            self.slug = candidate
        super().save(*args, **kwargs)


class Comment(models.Model):
    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on {self.article}"


class PostUserLikes(models.Model):
    user = models.ForeignKey(
        "users.UserProfile",
        on_delete=models.CASCADE,
        related_name="likes",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="likes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "article")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Like<{self.user_id} -> {self.article_id}>"
