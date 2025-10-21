from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile


class Favorite(models.Model):
    """Model for user favorites (professionals and places)"""
    
    user = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="favorites")
    
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
        return f"{self.user.user.username} favorited {self.content_object}"
    
    @property
    def favorite_name(self):
        """Get the name of the favorited item"""
        if hasattr(self.content_object, 'name'):
            return self.content_object.name
        elif hasattr(self.content_object, 'user'):
            if hasattr(self.content_object, 'professional_profile'):
                prof = self.content_object.professional_profile
                return f"{prof.name} {prof.last_name}"
            elif hasattr(self.content_object, 'place_profile'):
                return self.content_object.place_profile.name
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
        if hasattr(self.content_object, 'professional_profile'):
            # For professionals, get their main service or bio
            prof = self.content_object.professional_profile
            return prof.bio or "Profesional"
        elif hasattr(self.content_object, 'place_profile'):
            # For places, get their description
            place = self.content_object.place_profile
            return place.description or "Establecimiento"
        return "Servicio"
    
    @property
    def favorite_rating(self):
        """Get the rating of the favorited item"""
        if hasattr(self.content_object, 'professional_profile'):
            return float(self.content_object.professional_profile.rating)
        elif hasattr(self.content_object, 'place_profile'):
            return float(self.content_object.place_profile.rating)
        return 0.0

