from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status


class AuthFlowTests(APITestCase):
    def setUp(self):
        self.username = "u1"
        self.password = "Aa123456!"
        self.email = "u1@example.com"
        User.objects.create_user(
            username=self.username, email=self.email, password=self.password)

    def test_obtain_and_refresh_jwt(self):
        res = self.client.post(
            "/api/token/", {"username": self.username, "password": self.password}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.content)
        access = res.data.get("access")
        refresh = res.data.get("refresh")
        self.assertTrue(access and refresh)

        res2 = self.client.post("/api/token/refresh/",
                                {"refresh": refresh}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK, res2.content)
        self.assertTrue(res2.data.get("access"))

    def test_register_new_user(self):
        res = self.client.post("/api/auth/", {
            "username": "newuser",
            "email": "new@x.com",
            "password": "Aa123456!"
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.content)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_me_get_and_patch(self):
        ob = self.client.post(
            "/api/token/", {"username": self.username, "password": self.password}, format="json")
        self.assertEqual(ob.status_code, 200, ob.content)
        access = ob.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data["user"]["username"], self.username)

        res2 = self.client.patch(
            "/api/auth/me/", {"first_name": "Itai"}, format="json")
        self.assertEqual(res2.status_code, 200, res2.content)
        self.assertEqual(res2.data["first_name"], "Itai")
