from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .service_views import ServiceViewSet, ServiceCategoryViewSet, ServiceTypeViewSet

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='service-category')
router.register(r'types', ServiceTypeViewSet, basename='service-type')
router.register(r'unified-services', ServiceViewSet, basename='unified-service')
router.register(r'place-services', views.ServiceInPlaceViewSet, basename='place-service')
router.register(r'professional-services', views.ProfessionalServiceViewSet, basename='professional-service')
router.register(r'availability', views.ProviderAvailabilityViewSet, basename='availability')
router.register(r'time-blocks', views.TimeSlotBlockViewSet, basename='time-block')
router.register(r'', views.CombinedServicesViewSet, basename='combined-services')

urlpatterns = [
    path('', include(router.urls)),
]


