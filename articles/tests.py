from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status


class BlogApiFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="Simba", password="P@ssw0rd!")
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
        self.auth_as("Simba", "P@ssw0rd!")
        res = self.client.post(
            "/api/articles/", {"title": "My A", "content": "Body"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        article_id = res.data["id"]

        res = self.client.post(
            f"/api/articles/{article_id}/comments/", {"content": "Nice!"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["article"], article_id)

        res = self.client.get(f"/api/articles/{article_id}/comments/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) >= 1)

    def test_permissions_update_article_owner_vs_non_owner(self):
        self.auth_as("Simba", "P@ssw0rd!")
        res = self.client.post(
            "/api/articles/", {"title": "Owner", "content": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        article_id = res.data["id"]

        self.auth_as("other", "OtherP@ss1!")
        res = self.client.patch(
            f"/api/articles/{article_id}/", {"title": "Hack"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, res.data)

        self.auth_as("admin", "AdminP@ss1!")
        res = self.client.patch(
            f"/api/articles/{article_id}/", {"title": "Admin Edit"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data["title"], "Admin Edit")

    def test_comments_generic_endpoint_requires_article_on_post(self):
        self.auth_as("Simba", "P@ssw0rd!")
        res = self.client.post(
            "/api/comments/", {"content": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res_a = self.client.post(
            "/api/articles/", {"title": "A", "content": "B"}, format="json")
        article_id = res_a.data["id"]

        res_c = self.client.post(
            "/api/comments/", {"content": "OK", "article": article_id}, format="json")
        self.assertEqual(res_c.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_c.data["article"], article_id)


class TagAndLikeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="itai", password="P@ssw0rd!")
        res = self.client.post(
            "/api/token/", {"username": "itai", "password": "P@ssw0rd!"}, format="json")
        self.access = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def test_create_tag_and_article_with_tag(self):
        res = self.client.post("/api/tags/", {"name": "django"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        tag_id = res.data["id"]

        res = self.client.post(
            "/api/articles/", {"title": "With tag", "content": "Body", "tags": [tag_id]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertIn("tag_names", res.data)
        self.assertIn("django", res.data["tag_names"])

    def test_like_and_unlike_article(self):
        res = self.client.post(
            "/api/articles/", {"title": "LikeMe", "content": "Body"}, format="json")
        article_id = res.data["id"]

        res = self.client.post("/api/post-user-likes/",
                               {"article": article_id}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

        res = self.client.get(f"/api/post-user-likes/?article={article_id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) == 1)

        res = self.client.post(f"/api/articles/{article_id}/toggle-like/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["liked"], False)


class ArticleSlugAndToggleLikeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="itai", password="P@ssw0rd!")
        res = self.client.post(
            "/api/token/", {"username": "itai", "password": "P@ssw0rd!"}, format="json")
        self.access = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def test_slug_generated_and_toggle_like(self):
        res = self.client.post(
            "/api/articles/", {"title": "שלום עולם", "content": "תוכן"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertIn("slug", res.data)
        slug = res.data["slug"]
        self.assertTrue(len(slug) > 0)

        article_id = res.data["id"]

        res2 = self.client.post(f"/api/articles/{article_id}/toggle-like/")
        self.assertEqual(res2.status_code, status.HTTP_200_OK, res2.data)
        self.assertEqual(res2.data["liked"], True)

        res3 = self.client.post(f"/api/articles/{article_id}/toggle-like/")
        self.assertEqual(res3.status_code, status.HTTP_200_OK, res3.data)
        self.assertEqual(res3.data["liked"], False)
