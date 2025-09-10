from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Article, Comment


class BlogApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="itai", password="P@ssw0rd!")
        self.admin = User.objects.create_user(
            username="admin", password="AdminP@ss1!", is_staff=True)

    def auth(self, username, password):
        url = reverse("token_obtain_pair")
        res = self.client.post(
            url, {"username": username, "password": password}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        token = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_create_article_and_comment_flow(self):
        # יצירת כתבה
        self.auth("itai", "P@ssw0rd!")
        res = self.client.post(
            "/api/articles/", {"title": "Test", "content": "Body"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        article_id = res.data["id"]

        # הוספת תגובה בנתיב מקונן
        res = self.client.post(
            f"/api/articles/{article_id}/comments/", {"content": "Nice!"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

        # מחיקת תגובה ע"י המשתמש שיצר — מאושר
        comment_id = res.data["id"]
        res = self.client.delete(f"/api/comments/{comment_id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_permissions_update_article(self):
        # יוצר כתבה כ-itai
        self.auth("itai", "P@ssw0rd!")
        res = self.client.post(
            "/api/articles/", {"title": "Mine", "content": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        article_id = res.data["id"]

        # מנסה לעדכן כ-admin (מותר כי אדמין)
        self.auth("admin", "AdminP@ss1!")
        res = self.client.patch(
            f"/api/articles/{article_id}/", {"title": "Admin Edit"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Admin Edit")
