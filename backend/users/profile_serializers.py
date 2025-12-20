from rest_framework import serializers
from .profile_models import (
    ProfileImage, CustomService, AvailabilitySchedule, TimeSlot, BreakTime,
    PlaceProfessionalLink, LinkedAvailabilitySchedule, LinkedTimeSlot
)
from .models import ProfessionalProfile, PlaceProfile, User
from django.contrib.contenttypes.models import ContentType


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'start_time', 'end_time', 'is_active']
        read_only_fields = ['id']


class BreakTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakTime
        fields = ['id', 'start_time', 'end_time', 'label', 'is_active']
        read_only_fields = ['id']


class AvailabilityScheduleSerializer(serializers.ModelSerializer):
    time_slots = TimeSlotSerializer(many=True, required=False)
    breaks = BreakTimeSerializer(many=True, required=False)
    
    class Meta:
        model = AvailabilitySchedule
        fields = ['id', 'day_of_week', 'is_available', 'time_slots', 'breaks']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        time_slots_data = validated_data.pop('time_slots', [])
        breaks_data = validated_data.pop('breaks', [])
        
        # Get content_type and object_id from context (passed when creating serializer)
        content_type = None
        object_id = None
        if hasattr(self, 'context') and self.context:
            content_type = self.context.get('content_type')
            object_id = self.context.get('object_id')
        
        # Debug logging
        print(f"Creating AvailabilitySchedule with content_type={content_type}, object_id={object_id}")
        print(f"Validated data: {validated_data}")
        
        if not content_type or object_id is None:
            raise serializers.ValidationError(
                f"content_type and object_id are required to create AvailabilitySchedule. Got content_type={content_type}, object_id={object_id}"
            )
        
        # Create schedule with content_type and object_id
        schedule_data = {
            'content_type': content_type,
            'object_id': object_id,
            'day_of_week': validated_data.get('day_of_week'),
            'is_available': validated_data.get('is_available', False),
        }
        
        print(f"Creating schedule with data: {schedule_data}")
        schedule = AvailabilitySchedule.objects.create(**schedule_data)
        print(f"Created schedule: {schedule.id}")
        
        # Create time slots if provided
        for slot_data in time_slots_data:
            TimeSlot.objects.create(schedule=schedule, **slot_data)
        
        # Create breaks if provided
        for break_data in breaks_data:
            BreakTime.objects.create(schedule=schedule, **break_data)
        
        return schedule


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
    availability_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomService
        fields = [
            'id', 'name', 'description', 'price', 'duration_minutes', 
            'category', 'is_active', 'availability_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'availability_summary']
    
    def get_availability_summary(self, obj):
        """Get availability summary for the service provider"""
        try:
            schedules = AvailabilitySchedule.objects.filter(
                content_type=ContentType.objects.get_for_model(obj.provider.__class__),
                object_id=obj.provider.id,
                is_available=True
            ).order_by('day_of_week')
            
            summary = []
            for schedule in schedules:
                slots = TimeSlot.objects.filter(schedule=schedule, is_active=True).order_by('start_time')
                if slots.exists():
                    summary.append({
                        'day_of_week': schedule.day_of_week,
                        'day_name': schedule.get_day_of_week_display(),
                        'time_slots': [
                            {
                                'start_time': slot.start_time.strftime('%H:%M'),
                                'end_time': slot.end_time.strftime('%H:%M')
                            }
                            for slot in slots
                        ]
                    })
            return summary
        except:
            return []


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
    place_public_profile_id = serializers.SerializerMethodField()
    professional_id = serializers.IntegerField(source='professional.id', read_only=True)
    professional_public_profile_id = serializers.SerializerMethodField()
    professional_name = serializers.SerializerMethodField()
    professional_email = serializers.EmailField(source='professional.user.email', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)
    
    class Meta:
        model = PlaceProfessionalLink
        fields = [
            'id', 'status', 'notes', 'created_at', 'updated_at',
            'place_id', 'place_name', 'place_public_profile_id', 
            'professional_id', 'professional_public_profile_id', 'professional_name', 'professional_email',
            'invited_by_email'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'place_id', 'place_name', 'place_public_profile_id', 'professional_id', 'professional_public_profile_id', 'professional_name', 'professional_email', 'invited_by_email']
    
    def get_professional_name(self, obj):
        return f"{obj.professional.name} {obj.professional.last_name}".strip()
    
    def get_professional_public_profile_id(self, obj):
        """Get the PublicProfile ID for the professional"""
        try:
            return obj.professional.user.public_profile.id
        except Exception:
            return None
    
    def get_place_public_profile_id(self, obj):
        """Get the PublicProfile ID for the place"""
        try:
            return obj.place.user.public_profile.id
        except Exception:
            return None













