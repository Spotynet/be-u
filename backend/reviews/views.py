from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """Unified review endpoints for professional/place public profiles."""

    queryset = Review.objects.select_related("from_user", "to_public_profile", "service").prefetch_related("images")
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "create":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        public_profile_id = self.request.query_params.get("public_profile")
        from_user_id = self.request.query_params.get("from_user")
        profile_type = self.request.query_params.get("profile_type")

        if public_profile_id:
            queryset = queryset.filter(to_public_profile_id=public_profile_id)

        if from_user_id:
            queryset = queryset.filter(from_user_id=from_user_id)

        if profile_type:
            queryset = queryset.filter(
                to_public_profile__profile_type=profile_type.upper()
            )

        return queryset

    def perform_create(self, serializer):
        request = self.request

        if not hasattr(request.user, "client_profile"):
            raise PermissionDenied("Solo los clientes pueden dejar reseñas.")

        serializer.context.setdefault("request", request)
        serializer.save()

    def perform_update(self, serializer):
        review = serializer.instance
        if review.from_user_id != self.request.user.id:
            raise PermissionDenied("No puedes editar esta reseña.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.from_user_id != request.user.id:
            raise PermissionDenied("No puedes eliminar esta reseña.")
        return super().destroy(request, *args, **kwargs)
