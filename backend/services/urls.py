from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ServicesCategoryViewSet, basename='service-category')
router.register(r'types', views.ServicesTypeViewSet, basename='service-type')
router.register(r'place-services', views.ServiceInPlaceViewSet, basename='place-service')
router.register(r'professional-services', views.ProfessionalServiceViewSet, basename='professional-service')
router.register(r'availability', views.ProviderAvailabilityViewSet, basename='availability')
router.register(r'time-blocks', views.TimeSlotBlockViewSet, basename='time-block')
router.register(r'', views.CombinedServicesViewSet, basename='combined-services')

urlpatterns = [
    path('', include(router.urls)),
]


