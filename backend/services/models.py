from django.db import models
from users.models import PlaceProfile


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


class ServiceInPlace(models.Model):
    place = models.ForeignKey(PlaceProfile, on_delete=models.CASCADE, related_name="services_offered")
    service = models.ForeignKey(ServicesType, on_delete=models.CASCADE, related_name="places_offering")
    description = models.TextField(blank=True, null=True)
    time = models.DurationField(help_text="Duración del servicio (hh:mm:ss)")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.service.name} at {self.place.name}"