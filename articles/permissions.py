from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrAdmin(BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if hasattr(obj, "author_id"):
            return obj.author_id == user.id or user.is_staff or user.is_superuser
        return user.is_staff or user.is_superuser
