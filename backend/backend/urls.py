"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Create a router for API endpoints
router = DefaultRouter()

urlpatterns = [
    # Admin panel (both paths for convenience)
    path('admin/', admin.site.urls),
    path('api/admin/', admin.site.urls),
    # API endpoints
    path('api/', include(router.urls)),
    path('api/', include('users.urls')),
    path('api/services/', include('services.urls')),
    path('api/reservations/', include('reservations.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/favorites/', include('favorites.urls')),
    # Add a simple test endpoint
    path('api/test/', lambda request: HttpResponse('API is working!')),
    # Root endpoint
    path('', lambda request: HttpResponse('Django Backend is running on localhost:8000/api')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
