from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import ClientProfile, PublicProfile, User
from reviews.models import Review


class ReviewAPITestCase(APITestCase):
    def setUp(self):
        # Client user capable of creating reviews
        self.client_user = User.objects.create_user(
            email="client@example.com",
            username="client",
            password="password123",
            role=User.Role.CLIENT,
        )
        self.client_profile = ClientProfile.objects.create(user=self.client_user)

        # Professional profile being reviewed
        self.pro_user = User.objects.create_user(
            email="pro@example.com",
            username="pro",
            password="password123",
            role=User.Role.PROFESSIONAL,
        )
        self.public_profile = PublicProfile.objects.create(
            user=self.pro_user,
            profile_type="PROFESSIONAL",
            name="Juan Dev2",
            category="mascotas",
        )

        self.list_url = reverse("unified-review-list")

    def test_client_can_create_review_and_updates_rating(self):
        self.client.force_authenticate(self.client_user)

        payload = {
            "to_public_profile": self.public_profile.id,
            "rating": 5,
            "message": "Excelente servicio",
        }

        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.public_profile.refresh_from_db()
        self.assertEqual(float(self.public_profile.rating), 5.0)

        review = Review.objects.get()
        self.assertEqual(review.from_user, self.client_user)
        self.assertEqual(review.rating, 5)

    def test_review_allows_photo_uploads(self):
        self.client.force_authenticate(self.client_user)

        image_content = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
            b"\x00\x00\x00\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00"
            b"\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b"
        )
        image_file = SimpleUploadedFile("test.gif", image_content, content_type="image/gif")

        payload = {
            "to_public_profile": str(self.public_profile.id),
            "rating": "4",
            "message": "Muy bien",
            "images": [image_file],
        }

        response = self.client.post(self.list_url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        review = Review.objects.get()
        self.assertEqual(review.images.count(), 1)

    def test_non_client_cannot_create_review(self):
        self.client.force_authenticate(self.pro_user)
        payload = {
            "to_public_profile": self.public_profile.id,
            "rating": 4,
        }

        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
