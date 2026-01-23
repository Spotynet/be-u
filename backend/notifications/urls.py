from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'templates', views.NotificationTemplateViewSet, basename='notification-template')
router.register(r'push-tokens', views.PushDeviceTokenViewSet, basename='push-token')
router.register(r'reminders', views.ReservationReminderViewSet, basename='reservation-reminder')

urlpatterns = [
    path('', include(router.urls)),
]

