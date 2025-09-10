from rest_framework.test import APITestCase
from rest_framework import status


class AuthFlowTests(APITestCase):
    def test_register_returns_201(self):
        res = self.client.post("/api/auth/", {
            "username": "exampi",
            "email": "exampi@example.com",
            "password": "P@ssw0rd!"
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

    def test_token_returns_200_and_tokens(self):
        # register first
        self.client.post("/api/auth/", {
            "username": "exampi",
            "email": "exampi@example.com",
            "password": "P@ssw0rd!"
        }, format="json")

        # get token
        res = self.client.post("/api/token/", {
            "username": "exampi",
            "password": "P@ssw0rd!"
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
