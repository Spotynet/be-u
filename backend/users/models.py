from django.db import models
from django.contrib.auth.models import AbstractUser


# ======================
# USUARIO BASE
# ======================
class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        PROFESSIONAL = "PROFESSIONAL", "Professional"
        PLACE = "PLACE", "Place"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT
    )

    # Use email as the unique identifier
    email = models.EmailField(unique=True)
    
    # Make username optional since we're using email
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    
    # Phone number for all users
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Country for all users
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # Profile image for all users
    image = models.ImageField(upload_to="users/images/", blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)


# ======================
# PERFILES DE USUARIO
# ======================
class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    phone = models.CharField(max_length=20, blank=True, null=True)
    photo = models.ImageField(upload_to="clients/photos/", blank=True, null=True)

    def __str__(self):
        return f"Client: {self.user.username}"


class ProfessionalProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="professional_profile")
    name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)  # promedio de reseñas

    def __str__(self):
        return f"Professional: {self.name} {self.last_name}"


class PlaceProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="place_profile")
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True, null=True, help_text="Biography/About section for the place")
    description = models.TextField(blank=True, null=True, help_text="Description of the place")
    street = models.CharField(max_length=200)
    number_ext = models.CharField(max_length=20, blank=True, null=True)
    number_int = models.CharField(max_length=20, blank=True, null=True)
    postal_code = models.CharField(max_length=10)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="owned_places")

    def __str__(self):
        return f"Place: {self.name}"


class PublicProfile(models.Model):
    """Unified profile model for both professionals and places"""
    PROFILE_TYPE_CHOICES = [
        ('PROFESSIONAL', 'Professional'),
        ('PLACE', 'Place'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="public_profile")
    profile_type = models.CharField(max_length=20, choices=PROFILE_TYPE_CHOICES)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    sub_categories = models.JSONField(default=list, blank=True, help_text="List of sub-categories")
    images = models.JSONField(default=list, blank=True, help_text="List of image URLs/paths")
    linked_pros_place = models.JSONField(default=list, blank=True, help_text="List of linked professional/place IDs")
    has_calendar = models.BooleanField(default=False, help_text="Whether this profile has calendar functionality")
    
    # Place-specific fields
    street = models.CharField(max_length=200, blank=True, null=True)
    number_ext = models.CharField(max_length=20, blank=True, null=True)
    number_int = models.CharField(max_length=20, blank=True, null=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # Professional-specific fields
    last_name = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.profile_type}: {self.name}"
    
    @property
    def display_name(self):
        """Get display name based on profile type"""
        if self.profile_type == 'PROFESSIONAL' and self.last_name:
            return f"{self.name} {self.last_name}"
        return self.name