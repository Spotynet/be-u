from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, auth_views, profile_views, google_maps_views
from .public_profile_views import PublicProfileViewSet
from .link_views import PlaceProfessionalLinkViewSet

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'professionals', views.ProfessionalProfileViewSet, basename='professional')
router.register(r'places', views.PlaceProfileViewSet, basename='place')
router.register(r'public-profiles', PublicProfileViewSet, basename='public-profile')
router.register(r'links', PlaceProfessionalLinkViewSet, basename='place-pro-link')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth_views.login_view, name='login'),
    path('auth/email/request-code/', auth_views.email_request_code_view, name='email-request-code'),
    path('auth/email/verify-code/', auth_views.email_verify_code_view, name='email-verify-code'),
    path('auth/register/', auth_views.register_view, name='register'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/refresh/', auth_views.refresh_token_view, name='refresh'),
    path('auth/google/auth-url/', auth_views.google_auth_url_view, name='google-auth-url'),
    path('auth/google/callback/', auth_views.google_callback_view, name='google-callback'),
    path('auth/google/link/', auth_views.google_link_account_view, name='google-link'),
    path('auth/profile/', views.profile_view, name='profile'),
    
    # Profile customization endpoints
    path('profile/images/', profile_views.profile_images_view, name='profile-images'),
    path('profile/images/<int:image_id>/', profile_views.profile_image_detail_view, name='profile-image-detail'),
    path('profile/services/', profile_views.custom_services_view, name='custom-services'),
    path('profile/services/<int:service_id>/', profile_views.custom_service_detail_view, name='custom-service-detail'),
    path('profile/availability/', profile_views.availability_schedule_view, name='availability-schedule'),
    path('profile/customization/', profile_views.profile_customization_view, name='profile-customization'),
    
    # Public availability endpoints
    path('availability/public/', profile_views.public_availability_view, name='public-availability'),
    path('availability/slots/', profile_views.available_slots_view, name='available-slots'),
    
    # Google Maps API proxy endpoints (to avoid CORS)
    path('google-maps/places/autocomplete/', google_maps_views.google_places_autocomplete, name='google-places-autocomplete'),
    path('google-maps/places/details/', google_maps_views.google_place_details, name='google-place-details'),
    path('google-maps/reverse-geocode/', google_maps_views.google_reverse_geocode, name='google-reverse-geocode'),
]
