from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'places', views.PlaceReviewViewSet, basename='place-review')
router.register(r'professionals', views.ProfessionalReviewViewSet, basename='professional-review')
router.register(r'', views.ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]

