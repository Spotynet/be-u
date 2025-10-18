from rest_framework import serializers
from .models import PlaceReview, ProfessionalReview

class ReviewCreateSerializer(serializers.Serializer):
    provider_type = serializers.ChoiceField(choices=['place', 'professional'])
    provider_id = serializers.IntegerField()
    service_id = serializers.IntegerField(required=False, allow_null=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)

class ReviewListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    provider_type = serializers.CharField()
    provider_id = serializers.IntegerField()
    client_name = serializers.CharField()
    rating = serializers.IntegerField()
    comment = serializers.CharField()
    photos = serializers.ListField(child=serializers.CharField())
    created_at = serializers.DateTimeField()


class PlaceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaceReview
        fields = [
            'id', 'user', 'place', 'service', 'qualification',
            'opinion', 'photo', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user']


class ProfessionalReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalReview
        fields = [
            'id', 'user', 'professional', 'service', 'qualification',
            'opinion', 'photo', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user']
