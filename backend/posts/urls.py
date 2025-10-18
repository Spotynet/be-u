from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PostViewSet, basename='post')

urlpatterns = [
    path('', include(router.urls)),
    path('photo/', views.create_photo_post, name='create-photo-post'),
    path('video/', views.create_video_post, name='create-video-post'),
    path('carousel/', views.create_carousel_post, name='create-carousel-post'),
    path('poll/', views.create_poll_post, name='create-poll-post'),
    path('review/', views.create_review_post, name='create-review-post'),
    path('<int:post_id>/vote/', views.vote_in_poll, name='vote-in-poll'),
]

