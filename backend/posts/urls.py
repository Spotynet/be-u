from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'list', views.PostViewSet, basename='post')

urlpatterns = [
    # Specific endpoints MUST come BEFORE router.urls to avoid conflicts
    path('photo/', views.create_photo_post, name='create-photo-post'),
    path('video/', views.create_video_post, name='create-video-post'),
    path('carousel/', views.create_carousel_post, name='create-carousel-post'),
    path('mosaic/', views.create_mosaic_post, name='create-mosaic-post'),
    path('transformation/', views.create_transformation_post, name='create-transformation-post'),
    path('poll/', views.create_poll_post, name='create-poll-post'),
    path('review/', views.create_review_post, name='create-review-post'),
    path('pet_adoption/', views.create_pet_adoption_post, name='create-pet-adoption-post'),
    path('<int:post_id>/vote/', views.vote_in_poll, name='vote-in-poll'),
    # Router URLs come last
    path('', include(router.urls)),
]

