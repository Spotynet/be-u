from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'group-sessions', views.GroupSessionViewSet, basename='group-session')
router.register(r'tracking-requests', views.TrackingRequestViewSet, basename='tracking-request')
router.register(r'', views.ReservationViewSet, basename='reservation')

urlpatterns = [
    path('', include(router.urls)),
]


