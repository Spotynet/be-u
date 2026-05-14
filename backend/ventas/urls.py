from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SaleViewSet

router = DefaultRouter()
router.register(r"ventas", SaleViewSet, basename="ventas")

urlpatterns = [
    path("", include(router.urls)),
]
