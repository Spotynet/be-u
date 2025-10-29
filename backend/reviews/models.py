from django.db import models
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile, User, PublicProfile
from services.models import ServicesType, Service


# ======================
# REVIEWS
# ======================

# Legacy models (keeping for backward compatibility)
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


# ======================
# UNIFIED REVIEW MODEL (as per diagram)
# ======================
class Review(models.Model):
    """Unified review model that matches the diagram requirements"""
    
    # Direct relationship to User (From: User.ID as per diagram)
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews_given",
                                 help_text="User who wrote the review")
    
    # Direct relationship to PublicProfile (to: Public_profile.ID as per diagram)
    to_public_profile = models.ForeignKey(PublicProfile, on_delete=models.CASCADE, related_name="reviews_received",
                                         help_text="Public profile being reviewed")
    
    # Review content
    rating = models.PositiveIntegerField(help_text="Rating from 1-5 stars")
    message = models.TextField(blank=True, null=True, help_text="Review message/comment")
    
    # Images array (stored as JSON list of image URLs/paths)
    images = models.JSONField(default=list, blank=True, help_text="List of image URLs/paths")
    
    # Optional service reference
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name="reviews", help_text="Specific service being reviewed")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        # Prevent duplicate reviews from same user to same profile
        unique_together = ['from_user', 'to_public_profile']
    
    def __str__(self):
        return f"Review by {self.from_user.email} for {self.to_public_profile.display_name}"
    
    @property
    def reviewer_name(self):
        """Get reviewer's display name"""
        return f"{self.from_user.first_name} {self.from_user.last_name}".strip() or self.from_user.email
    
    @property
    def reviewed_name(self):
        """Get reviewed profile's display name"""
        return self.to_public_profile.display_name