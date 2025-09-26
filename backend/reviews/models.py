from django.db import models
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile
from services.models import ServicesType


# ======================
# REVIEWS
# ======================
class PlaceReview(models.Model):
    user = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="place_reviews")
    place = models.ForeignKey(PlaceProfile, on_delete=models.CASCADE, related_name="reviews")
    service = models.ForeignKey(ServicesType, on_delete=models.SET_NULL, null=True, blank=True, related_name="place_reviews")
    qualification = models.PositiveIntegerField()  # 1–5 stars
    opinion = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to="reviews/photos/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.user.username} for {self.place.name}"


class ProfessionalReview(models.Model):
    user = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="professional_reviews")
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name="reviews")
    service = models.ForeignKey(ServicesType, on_delete=models.SET_NULL, null=True, blank=True, related_name="professional_reviews")
    qualification = models.PositiveIntegerField()  # 1–5 stars
    opinion = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to="reviews/photos/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.user.username} for {self.professional.name}"