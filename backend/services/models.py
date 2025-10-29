from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from users.models import PlaceProfile, ProfessionalProfile, PublicProfile, User
import uuid


# ======================
# SERVICIOS
# ======================
class ServicesCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class ServicesType(models.Model):
    category = models.ForeignKey(ServicesCategory, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=100)
    photo = models.ImageField(upload_to="services/photos/", blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


# ======================
# UNIFIED SERVICE MODEL (as per diagram)
# ======================
class Service(models.Model):
    """Unified service model that matches the diagram requirements"""
    
    # Core service info
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.DurationField(help_text="Duration of the service")
    
    # Category and sub-category
    category = models.CharField(max_length=100, blank=True, null=True)
    sub_category = models.CharField(max_length=100, blank=True, null=True)
    
    # Direct relationship to User (Pro ID as per diagram)
    pro_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="services", 
                                help_text="Professional/Place user who offers this service")
    
    # Images array (stored as JSON list of image URLs/paths)
    images = models.JSONField(default=list, blank=True, help_text="List of image URLs/paths")
    
    # Additional metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} by {self.pro_user.email}"
    
    @property
    def pro_name(self):
        """Get the professional/place name"""
        if hasattr(self.pro_user, 'public_profile'):
            return self.pro_user.public_profile.display_name
        return self.pro_user.email


class ServiceInPlace(models.Model):
    """Service offered by a Place (establishment)"""
    place = models.ForeignKey(PlaceProfile, on_delete=models.CASCADE, related_name="services_offered")
    service = models.ForeignKey(ServicesType, on_delete=models.CASCADE, related_name="places_offering")
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.SET_NULL, null=True, blank=True, 
                                      related_name="assigned_services", 
                                      help_text="Professional assigned to this service at the place")
    description = models.TextField(blank=True, null=True)
    time = models.DurationField(help_text="Duración del servicio (hh:mm:ss)")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['place', 'service']

    def __str__(self):
        return f"{self.service.name} at {self.place.name}"


class ProfessionalService(models.Model):
    """Service offered by an independent Professional"""
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.CASCADE, related_name="independent_services")
    service = models.ForeignKey(ServicesType, on_delete=models.CASCADE, related_name="professionals_offering")
    description = models.TextField(blank=True, null=True)
    time = models.DurationField(help_text="Duración del servicio (hh:mm:ss)")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['professional', 'service']

    def __str__(self):
        return f"{self.service.name} by {self.professional.name}"


# ======================
# AVAILABILITY MANAGEMENT
# ======================
class ProviderAvailability(models.Model):
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
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['content_type', 'object_id', 'day_of_week']
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.get_day_of_week_display()}: {self.start_time} - {self.end_time}"


class TimeSlotBlock(models.Model):
    """Blocked time slots for specific dates (vacations, breaks, already booked)"""
    
    class BlockReason(models.TextChoices):
        VACATION = "VACATION", "Vacation"
        BREAK = "BREAK", "Break"
        BOOKED = "BOOKED", "Booked"
        PERSONAL = "PERSONAL", "Personal"
        OTHER = "OTHER", "Other"

    # Polymorphic relation to either ProfessionalProfile or PlaceProfile
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    provider = GenericForeignKey('content_type', 'object_id')

    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.CharField(max_length=20, choices=BlockReason.choices, default=BlockReason.BOOKED)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"Blocked: {self.date} {self.start_time}-{self.end_time}"