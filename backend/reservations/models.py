from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile
from services.models import ServicesType
import uuid
from datetime import datetime, timedelta


# ======================
# RESERVAS
# ======================
class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"
        REJECTED = "REJECTED", "Rejected"

    code = models.CharField(max_length=50, unique=True, editable=False)
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="reservations")
    
    # Provider can be either Professional or Place
    provider_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    provider_object_id = models.PositiveIntegerField()
    provider = GenericForeignKey('provider_content_type', 'provider_object_id')
    
    # Legacy fields for backwards compatibility
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="legacy_reservations")
    place = models.ForeignKey(PlaceProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="legacy_reservations")
    
    service = models.ForeignKey(ServicesType, on_delete=models.CASCADE, related_name="reservations")
    
    # Service-specific reference (ServiceInPlace or ProfessionalService)
    service_instance_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name='reservation_services', null=True, blank=True)
    service_instance_id = models.PositiveIntegerField(null=True, blank=True)
    service_instance = GenericForeignKey('service_instance_type', 'service_instance_id')
    
    date = models.DateField()
    time = models.TimeField()
    duration = models.DurationField(help_text="Duration of the service", null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Additional fields
    notes = models.TextField(blank=True, null=True, help_text="Client notes for the provider")
    cancellation_reason = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-time']
        indexes = [
            models.Index(fields=['date', 'time']),
            models.Index(fields=['status', 'date']),
            models.Index(fields=['client', 'date']),
        ]

    def __str__(self):
        return f"Reservation {self.code} - {self.client.user.username}"
    
    def save(self, *args, **kwargs):
        # Auto-generate unique code if not set
        if not self.code:
            self.code = self.generate_unique_code()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_unique_code():
        """Generate unique reservation code"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_suffix = uuid.uuid4().hex[:6].upper()
        return f"RES-{timestamp}-{random_suffix}"
    
    @property
    def end_time(self):
        """Calculate end time based on start time and duration"""
        if self.duration:
            start_datetime = datetime.combine(self.date, self.time)
            end_datetime = start_datetime + self.duration
            return end_datetime.time()
        return self.time