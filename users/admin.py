from django.contrib import admin
from django.contrib.auth.models import User
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "bio")
    search_fields = ("user__username", "user__email", "bio")
    autocomplete_fields = ("user",)
    ordering = ("id",)
