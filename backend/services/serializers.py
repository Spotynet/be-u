from rest_framework import serializers
from .models import ServicesCategory, ServicesType, ServiceInPlace, ProfessionalService, ProviderAvailability, TimeSlotBlock
from users.models import PlaceProfile, ProfessionalProfile
from users.serializers import UserSerializer
from django.contrib.contenttypes.models import ContentType


class ServicesCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicesCategory
        fields = ['id', 'name', 'description']


class ServicesTypeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ServicesType
        fields = ['id', 'category', 'category_name', 'name', 'photo', 'description']


class ServiceInPlaceSerializer(serializers.ModelSerializer):
    service_details = ServicesTypeSerializer(source='service', read_only=True)
    place_name = serializers.CharField(source='place.name', read_only=True)
    professional_name = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceInPlace
        fields = [
            'id', 'place', 'place_name', 'service', 'service_details',
            'professional', 'professional_name', 'description', 
            'time', 'duration_minutes', 'price', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_professional_name(self, obj):
        if obj.professional:
            return f"{obj.professional.name} {obj.professional.last_name}"
        return None
    
    def get_duration_minutes(self, obj):
        if obj.time:
            return int(obj.time.total_seconds() / 60)
        return None


class ProfessionalServiceSerializer(serializers.ModelSerializer):
    service_details = ServicesTypeSerializer(source='service', read_only=True)
    professional_name = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = ProfessionalService
        fields = [
            'id', 'professional', 'professional_name', 'service', 'service_details',
            'description', 'time', 'duration_minutes', 'price', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['professional', 'created_at', 'updated_at']
    
    def get_professional_name(self, obj):
        return f"{obj.professional.name} {obj.professional.last_name}"
    
    def get_duration_minutes(self, obj):
        if obj.time:
            return int(obj.time.total_seconds() / 60)
        return None


class ProviderAvailabilitySerializer(serializers.ModelSerializer):
    provider_type = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProviderAvailability
        fields = [
            'id', 'provider_type', 'provider_name', 'day_of_week',
            'start_time', 'end_time', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_provider_type(self, obj):
        if obj.content_type.model == 'professionalprofile':
            return 'professional'
        elif obj.content_type.model == 'placeprofile':
            return 'place'
        return None
    
    def get_provider_name(self, obj):
        if hasattr(obj.provider, 'name'):
            if hasattr(obj.provider, 'last_name'):
                # ProfessionalProfile
                return f"{obj.provider.name} {obj.provider.last_name}"
            # PlaceProfile
            return obj.provider.name
        return None


class ProviderAvailabilityScheduleSerializer(serializers.Serializer):
    """Schedule item serializer used inside bulk availability payload"""
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    start_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    is_active = serializers.BooleanField(required=False, default=True)


class ProviderAvailabilityCreateSerializer(serializers.Serializer):
    """Serializer for creating/updating availability for a provider"""
    provider_type = serializers.ChoiceField(choices=['professional', 'place'])
    provider_id = serializers.IntegerField()
    schedules = serializers.ListField(
        child=ProviderAvailabilityScheduleSerializer()
    )
    
    def validate(self, attrs):
        provider_type = attrs['provider_type']
        provider_id = attrs['provider_id']
        
        # Validate provider exists
        if provider_type == 'professional':
            if not ProfessionalProfile.objects.filter(id=provider_id).exists():
                raise serializers.ValidationError("Professional not found")
        elif provider_type == 'place':
            if not PlaceProfile.objects.filter(id=provider_id).exists():
                raise serializers.ValidationError("Place not found")
        
        return attrs


class TimeSlotBlockSerializer(serializers.ModelSerializer):
    provider_type = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TimeSlotBlock
        fields = [
            'id', 'provider_type', 'provider_name', 'date',
            'start_time', 'end_time', 'reason', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_provider_type(self, obj):
        if obj.content_type.model == 'professionalprofile':
            return 'professional'
        elif obj.content_type.model == 'placeprofile':
            return 'place'
        return None
    
    def get_provider_name(self, obj):
        if hasattr(obj.provider, 'name'):
            if hasattr(obj.provider, 'last_name'):
                return f"{obj.provider.name} {obj.provider.last_name}"
            return obj.provider.name
        return None


class AvailableSlotSerializer(serializers.Serializer):
    """Serializer for available time slots"""
    time = serializers.TimeField()
    available = serializers.BooleanField()
    end_time = serializers.TimeField()
    google_calendar_busy = serializers.BooleanField(allow_null=True, required=False)

