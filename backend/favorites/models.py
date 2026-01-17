from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile, PublicProfile


class Favorite(models.Model):
    """Model for user favorites (professionals, places, and posts)"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    
    # Can be either Professional or Place
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'content_type', 'object_id']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'content_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} favorited {self.content_object}"
    
    @property
    def favorite_name(self):
        """Get the name of the favorited item"""
        if isinstance(self.content_object, ProfessionalProfile):
            return f"{self.content_object.name} {self.content_object.last_name}"
        if isinstance(self.content_object, PlaceProfile):
            return self.content_object.name
        if isinstance(self.content_object, PublicProfile):
            return self.content_object.display_name or self.content_object.name
        if hasattr(self.content_object, 'name'):
            return self.content_object.name
        return "Unknown"
    
    @property
    def favorite_type(self):
        """Get the type of the favorited item"""
        if self.content_type.model == 'professionalprofile':
            return 'PROFESSIONAL'
        elif self.content_type.model == 'placeprofile':
            return 'PLACE'
        return 'UNKNOWN'
    
    @property
    def favorite_specialty(self):
        """Get the specialty/description of the favorited item"""
        if isinstance(self.content_object, ProfessionalProfile):
            return self.content_object.bio or "Profesional"
        if isinstance(self.content_object, PlaceProfile):
            return self.content_object.description or self.content_object.bio or "Establecimiento"
        if isinstance(self.content_object, PublicProfile):
            if self.content_object.profile_type == 'PROFESSIONAL':
                return self.content_object.bio or self.content_object.description or "Profesional"
            return self.content_object.description or self.content_object.bio or "Establecimiento"
        return "Servicio"
    
    @property
    def favorite_rating(self):
        """Get the rating of the favorited item"""
        if isinstance(self.content_object, ProfessionalProfile):
            return float(self.content_object.rating)
        if isinstance(self.content_object, PlaceProfile):
            try:
                return float(self.content_object.user.public_profile.rating)
            except Exception:
                return 0.0
        if isinstance(self.content_object, PublicProfile):
            return float(self.content_object.rating)
        return 0.0

