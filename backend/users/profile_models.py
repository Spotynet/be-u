from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
from .models import ProfessionalProfile, PlaceProfile
import uuid


# Custom S3 storage for profile images (same as posts)
class ProfileImageStorage(S3Boto3Storage):
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
    location = 'media'
    default_acl = None  # Use bucket policy instead of ACLs
    # Avoid HEAD requests (exists checks) that can fail with 403 on some bucket policies
    # We generate unique filenames for uploads, so overwrite risk is negligible
    file_overwrite = True
    querystring_auth = True  # Use signed URLs for access


class ProfileImage(models.Model):
    """Profile images for professionals and places"""
    
    # Polymorphic relation to either ProfessionalProfile or PlaceProfile
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    profile = GenericForeignKey('content_type', 'object_id')
    
    image = models.ImageField(upload_to="profile_images/", storage=ProfileImageStorage())
    caption = models.CharField(max_length=200, blank=True, null=True)
    is_primary = models.BooleanField(default=False, help_text="Primary image for the profile")
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        # Only enforce uniqueness for primary images (one per profile)
        # Allow multiple non-primary images
        constraints = [
            models.UniqueConstraint(
                fields=['content_type', 'object_id'],
                condition=models.Q(is_primary=True),
                name='unique_primary_image_per_profile'
            )
        ]
    
    def __str__(self):
        return f"Image for {self.profile}"


class CustomService(models.Model):
    """Custom services created by professionals and places"""
    
    # Polymorphic relation to either ProfessionalProfile or PlaceProfile
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    provider = GenericForeignKey('content_type', 'object_id')
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.PositiveIntegerField(help_text="Duration in minutes")
    category = models.CharField(max_length=100, default="Otros")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.provider}"


class AvailabilitySchedule(models.Model):
    """Weekly availability schedule for professionals and places"""
    
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"
    
    # Polymorphic relation to either ProfessionalProfile or PlaceProfile
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    provider = GenericForeignKey('content_type', 'object_id')
    
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    is_available = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['content_type', 'object_id', 'day_of_week']
        ordering = ['day_of_week']
    
    def __str__(self):
        return f"{self.get_day_of_week_display()} - {self.provider}"


class TimeSlot(models.Model):
    """Time slots for each day of availability"""
    
    schedule = models.ForeignKey(AvailabilitySchedule, on_delete=models.CASCADE, related_name="time_slots")
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.schedule.get_day_of_week_display()}: {self.start_time} - {self.end_time}"



class PlaceProfessionalLink(models.Model):
    """Association between a Place and a Professional with invite workflow"""
    
    class Status(models.TextChoices):
        INVITED = "INVITED", "Invited"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        REMOVED = "REMOVED", "Removed"
    
    place = models.ForeignKey(PlaceProfile, on_delete=models.CASCADE, related_name="links")
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name="place_links")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.INVITED)
    invited_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    notes = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ("place", "professional")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.place.name} ↔ {self.professional.name} ({self.status})"


class LinkedAvailabilitySchedule(models.Model):
    """Availability schedule per professional linked to a specific place"""
    
    link = models.ForeignKey(PlaceProfessionalLink, on_delete=models.CASCADE, related_name="schedules")
    day_of_week = models.IntegerField(choices=AvailabilitySchedule.DayOfWeek.choices)
    is_available = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['link', 'day_of_week']
        ordering = ['day_of_week']
    
    def __str__(self):
        return f"{self.link} - {self.get_day_of_week_display()}"


class LinkedTimeSlot(models.Model):
    """Time slot for a linked professional's schedule in a place"""
    
    schedule = models.ForeignKey(LinkedAvailabilitySchedule, on_delete=models.CASCADE, related_name="time_slots")
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.schedule.get_day_of_week_display()}: {self.start_time}-{self.end_time}"












