from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, auth_views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'professionals', views.ProfessionalProfileViewSet, basename='professional')
router.register(r'places', views.PlaceProfileViewSet, basename='place')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth_views.login_view, name='login'),
    path('auth/register/', auth_views.register_view, name='register'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/refresh/', auth_views.refresh_token_view, name='refresh'),
    path('auth/profile/', views.profile_view, name='profile'),
]
