from rest_framework import serializers
from .profile_models import ProfileImage, CustomService, AvailabilitySchedule, TimeSlot
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
    class Meta:
        model = ProfileImage
        fields = ['id', 'image', 'caption', 'is_primary', 'order', 'is_active']
        read_only_fields = ['id']


class CustomServiceSerializer(serializers.ModelSerializer):
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












