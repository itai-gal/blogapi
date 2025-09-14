from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.contrib.auth.models import User
from users.models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer


class AuthViewSet(viewsets.ViewSet):

    def get_permissions(self):
        return [AllowAny()] if self.action in ["create"] else [IsAuthenticated()]

    def create(self, request):
        ser = UserSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        user = request.user
        if request.method.lower() == "get":
            profile, _ = UserProfile.objects.get_or_create(user=user)
            return Response({
                "user": UserSerializer(user).data,
                "profile": UserProfileSerializer(profile).data
            })
        ser = UserSerializer(user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_200_OK)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        mine = self.request.query_params.get("mine")
        if mine in ("1", "true", "True") and self.request.user.is_authenticated:
            return qs.filter(user=self.request.user)
        return qs
