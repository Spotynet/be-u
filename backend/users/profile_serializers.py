from rest_framework import serializers
from .profile_models import (
    ProfileImage, CustomService, AvailabilitySchedule, TimeSlot,
    PlaceProfessionalLink, LinkedAvailabilitySchedule, LinkedTimeSlot
)
from .models import ProfessionalProfile, PlaceProfile, User
from django.contrib.contenttypes.models import ContentType


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'start_time', 'end_time', 'is_active']
        read_only_fields = ['id']


class AvailabilityScheduleSerializer(serializers.ModelSerializer):
    time_slots = TimeSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = AvailabilitySchedule
        fields = ['id', 'day_of_week', 'is_available', 'time_slots']
        read_only_fields = ['id']


class ProfileImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProfileImage
        fields = ['id', 'image', 'image_url', 'caption', 'is_primary', 'order', 'is_active']
        read_only_fields = ['id']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class CustomServiceSerializer(serializers.ModelSerializer):
    category = serializers.CharField(default='Otros', required=False)
    is_active = serializers.BooleanField(default=True, required=False)
    
    class Meta:
        model = CustomService
        fields = [
            'id', 'name', 'description', 'price', 'duration_minutes', 
            'category', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProfileCustomizationSerializer(serializers.Serializer):
    """Combined serializer for all profile customization data"""
    images = ProfileImageSerializer(many=True, required=False)
    services = CustomServiceSerializer(many=True, required=False)
    availability = AvailabilityScheduleSerializer(many=True, required=False)
    
    def create(self, validated_data):
        # This will be handled in the view
        pass
    
    def update(self, instance, validated_data):
        # This will be handled in the view
        pass


class LinkedTimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkedTimeSlot
        fields = ['id', 'start_time', 'end_time', 'is_active']
        read_only_fields = ['id']


class LinkedAvailabilityScheduleSerializer(serializers.ModelSerializer):
    time_slots = LinkedTimeSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = LinkedAvailabilitySchedule
        fields = ['id', 'day_of_week', 'is_available', 'time_slots']
        read_only_fields = ['id']


class PlaceProfessionalLinkSerializer(serializers.ModelSerializer):
    place_id = serializers.IntegerField(source='place.id', read_only=True)
    place_name = serializers.CharField(source='place.name', read_only=True)
    professional_id = serializers.IntegerField(source='professional.id', read_only=True)
    professional_name = serializers.SerializerMethodField()
    professional_email = serializers.EmailField(source='professional.user.email', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)
    
    class Meta:
        model = PlaceProfessionalLink
        fields = [
            'id', 'status', 'notes', 'created_at', 'updated_at',
            'place_id', 'place_name', 'professional_id', 'professional_name', 'professional_email',
            'invited_by_email'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'place_id', 'place_name', 'professional_id', 'professional_name', 'professional_email', 'invited_by_email']
    
    def get_professional_name(self, obj):
        return f"{obj.professional.name} {obj.professional.last_name}".strip()













