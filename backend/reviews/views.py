from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from .models import PlaceReview, ProfessionalReview
from .serializers import (
    ReviewCreateSerializer, ReviewListSerializer,
    PlaceReviewSerializer, ProfessionalReviewSerializer
)

class PlaceReviewViewSet(viewsets.ModelViewSet):
    queryset = PlaceReview.objects.select_related('user', 'place', 'service').all()
    serializer_class = PlaceReviewSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        place_id = self.request.query_params.get('place', None)
        if place_id:
            queryset = queryset.filter(place_id=place_id)
        return queryset

    def perform_create(self, serializer):
        try:
            client_profile = self.request.user.client_profile
        except Exception:
            raise PermissionDenied('User must be a client to create reviews')
        serializer.save(user=client_profile)

    def perform_update(self, serializer):
        if serializer.instance.user.user != self.request.user:
            raise PermissionDenied('Not authorized')
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user.user != request.user:
            raise PermissionDenied('Not authorized')
        return super().destroy(request, *args, **kwargs)


class ProfessionalReviewViewSet(viewsets.ModelViewSet):
    queryset = ProfessionalReview.objects.select_related('user', 'professional', 'service').all()
    serializer_class = ProfessionalReviewSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        professional_id = self.request.query_params.get('professional', None)
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)
        return queryset

    def perform_create(self, serializer):
        try:
            client_profile = self.request.user.client_profile
        except Exception:
            raise PermissionDenied('User must be a client to create reviews')
        serializer.save(user=client_profile)

    def perform_update(self, serializer):
        if serializer.instance.user.user != self.request.user:
            raise PermissionDenied('Not authorized')
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user.user != request.user:
            raise PermissionDenied('Not authorized')
        return super().destroy(request, *args, **kwargs)


class ReviewViewSet(viewsets.ViewSet):
    """Optional aggregated read-only endpoint to list all reviews together"""
    permission_classes = [AllowAny]

    def list(self, request):
        place_reviews = PlaceReview.objects.select_related('user', 'place', 'service').all()
        professional_reviews = ProfessionalReview.objects.select_related('user', 'professional', 'service').all()

        all_reviews = []
        for review in place_reviews:
            all_reviews.append({
                'id': review.id,
                'provider_type': 'place',
                'provider_id': review.place.id,
                'client_name': review.user.user.get_full_name() or review.user.user.username,
                'rating': review.qualification,
                'comment': review.opinion,
                'photos': [review.photo.url] if review.photo else [],
                'created_at': review.created_at,
            })

        for review in professional_reviews:
            all_reviews.append({
                'id': review.id,
                'provider_type': 'professional',
                'provider_id': review.professional.id,
                'client_name': review.user.user.get_full_name() or review.user.user.username,
                'rating': review.qualification,
                'comment': review.opinion,
                'photos': [review.photo.url] if review.photo else [],
                'created_at': review.created_at,
            })

        all_reviews.sort(key=lambda x: x['created_at'], reverse=True)
        return Response({'results': all_reviews, 'count': len(all_reviews)})
