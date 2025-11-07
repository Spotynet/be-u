from django.db import transaction
from rest_framework import serializers

from .models import Review, ReviewImage


class ReviewImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ReviewImage
        fields = ["id", "url"]

    def get_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer_name", read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "from_user",
            "to_public_profile",
            "service",
            "rating",
            "message",
            "images",
            "reviewer_name",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "from_user",
            "created_at",
            "reviewer_name",
            "images",
        ]


class ReviewCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        allow_empty=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Review
        fields = ["to_public_profile", "service", "rating", "message", "images"]

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("La calificación debe estar entre 1 y 5.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        to_public_profile = attrs.get("to_public_profile")

        if request and to_public_profile:
            if to_public_profile.user_id == request.user.id:
                raise serializers.ValidationError("No puedes reseñar tu propio perfil.")

        return attrs

    def create(self, validated_data):
        images = validated_data.pop("images", [])
        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError("Usuario no autenticado.")

        with transaction.atomic():
            review = Review.objects.create(from_user=request.user, **validated_data)

            for image in images:
                ReviewImage.objects.create(review=review, image=image)

        return review
