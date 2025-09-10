from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status


class BlogApiFlowTests(APITestCase):
    def setUp(self):
        # users
        self.user = User.objects.create_user(
            username="xampi", password="P@ssw0rd!")
        self.other = User.objects.create_user(
            username="other", password="OtherP@ss1!")
        self.admin = User.objects.create_user(
            username="admin", password="AdminP@ss1!", is_staff=True)

        self.token_url = "/api/token/"

    def auth_as(self, username, password):
        res = self.client.post(
            self.token_url, {"username": username, "password": password}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        access = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_create_article_and_nested_comment_flow(self):
        # login as xampi
        self.auth_as("xampi", "P@ssw0rd!")

        # create article
        res = self.client.post(
            "/api/articles/", {"title": "My A", "content": "Body"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        article_id = res.data["id"]

        # nested comment (NO article in body)
        res = self.client.post(
            f"/api/articles/{article_id}/comments/", {"content": "Nice!"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["content"], "Nice!")
        self.assertEqual(res.data["article"], article_id)

        # list comments for article
        res = self.client.get(f"/api/articles/{article_id}/comments/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) >= 1)

    def test_permissions_update_article_owner_vs_non_owner(self):
        # create as xampi
        self.auth_as("xampi", "P@ssw0rd!")
        res = self.client.post(
            "/api/articles/", {"title": "Owner", "content": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        article_id = res.data["id"]

        # try update as 'other' (not owner, not admin) -> 403
        self.auth_as("other", "OtherP@ss1!")
        res = self.client.patch(
            f"/api/articles/{article_id}/", {"title": "Hack"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, res.data)

        # update as admin -> 200
        self.auth_as("admin", "AdminP@ss1!")
        res = self.client.patch(
            f"/api/articles/{article_id}/", {"title": "Admin Edit"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data["title"], "Admin Edit")

    def test_comments_generic_endpoint_requires_article_on_post(self):
        self.auth_as("xampi", "P@ssw0rd!")
        # without article -> 400
        res = self.client.post(
            "/api/comments/", {"content": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # create article then comment via generic endpoint
        res_a = self.client.post(
            "/api/articles/", {"title": "A", "content": "B"}, format="json")
        self.assertEqual(res_a.status_code, status.HTTP_201_CREATED)
        article_id = res_a.data["id"]

        res_c = self.client.post(
            "/api/comments/", {"content": "OK", "article": article_id}, format="json")
        self.assertEqual(res_c.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_c.data["article"], article_id)
