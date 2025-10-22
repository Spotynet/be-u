from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from .models import ProfessionalProfile, PlaceProfile
import uuid


class ProfileImage(models.Model):
    """Profile images for professionals and places"""
    
    # Polymorphic relation to either ProfessionalProfile or PlaceProfile
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    profile = GenericForeignKey('content_type', 'object_id')
    
    image = models.ImageField(upload_to="profile_images/")
    caption = models.CharField(max_length=200, blank=True, null=True)
    is_primary = models.BooleanField(default=False, help_text="Primary image for the profile")
    order = models.PositiveIntegerField(default=0, help_text="Display order")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        unique_together = ['content_type', 'object_id', 'is_primary']
    
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



