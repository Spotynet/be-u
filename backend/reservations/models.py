from django.db import models
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile
from services.models import ServicesType


# ======================
# RESERVAS
# ======================
class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    code = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="reservations")
    professional = models.ForeignKey(ProfessionalProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="reservations")
    place = models.ForeignKey(PlaceProfile, on_delete=models.CASCADE, related_name="reservations")
    service = models.ForeignKey(ServicesType, on_delete=models.CASCADE, related_name="reservations")
    date = models.DateField()
    time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reservation {self.code} - {self.client.user.username}"