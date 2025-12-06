from rest_framework import serializers
from .models import Reservation
from services.models import ServicesType, ServiceInPlace, ProfessionalService
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile
from users.serializers import UserSerializer
from services.serializers import ServicesTypeSerializer
from django.contrib.contenttypes.models import ContentType
from datetime import datetime, timedelta, time as dt_time


class ReservationSerializer(serializers.ModelSerializer):
    # Client details
    client_details = serializers.SerializerMethodField()
    
    # Service details
    service_details = ServicesTypeSerializer(source='service', read_only=True)
    
    # Provider details
    provider_type = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    provider_details = serializers.SerializerMethodField()
    
    # Computed fields
    duration_minutes = serializers.SerializerMethodField()
    end_time = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    calendar_event_link = serializers.SerializerMethodField()
    calendar_event_id = serializers.SerializerMethodField()
    calendar_event_created = serializers.SerializerMethodField()
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'code', 'client', 'client_details',
            'service', 'service_details',
            'provider_type', 'provider_name', 'provider_details',
            'date', 'time', 'duration', 'duration_minutes', 'end_time',
            'status', 'status_display',
            'notes', 'cancellation_reason', 'rejection_reason',
            'calendar_event_link', 'calendar_event_id', 'calendar_event_created',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['code', 'created_at', 'updated_at', 'duration']
    
    def get_client_details(self, obj):
        return {
            'id': obj.client.user.id,
            'name': f"{obj.client.user.first_name} {obj.client.user.last_name}",
            'email': obj.client.user.email,
            'phone': obj.client.phone if hasattr(obj.client, 'phone') else None
        }
    
    def get_provider_type(self, obj):
        if obj.provider_content_type.model == 'professionalprofile':
            return 'professional'
        elif obj.provider_content_type.model == 'placeprofile':
            return 'place'
        return None
    
    def get_provider_name(self, obj):
        provider = obj.provider
        if hasattr(provider, 'name'):
            if hasattr(provider, 'last_name'):
                # ProfessionalProfile
                return f"{provider.name} {provider.last_name}"
            # PlaceProfile
            return provider.name
        return None
    
    def get_provider_details(self, obj):
        provider = obj.provider
        provider_type = self.get_provider_type(obj)
        
        if provider_type == 'professional':
            return {
                'id': provider.id,
                'name': f"{provider.name} {provider.last_name}",
                'bio': provider.bio,
                'city': provider.city,
                'rating': float(provider.rating) if provider.rating else 0.0
            }
        elif provider_type == 'place':
            return {
                'id': provider.id,
                'name': provider.name,
                'address': f"{provider.street} {provider.number_ext or ''}",
                'city': provider.city,
                'country': provider.country
            }
        return None
    
    def get_duration_minutes(self, obj):
        if obj.duration:
            return int(obj.duration.total_seconds() / 60)
        return None
    
    def get_end_time(self, obj):
        if obj.duration and obj.time:
            start_datetime = datetime.combine(obj.date, obj.time)
            end_datetime = start_datetime + obj.duration
            return end_datetime.time().strftime('%H:%M')
        return None

    def _get_calendar_event(self, obj):
        try:
            return obj.calendar_event
        except Exception:
            return None

    def get_calendar_event_link(self, obj):
        event = self._get_calendar_event(obj)
        return getattr(event, 'event_link', None) if event else None

    def get_calendar_event_id(self, obj):
        event = self._get_calendar_event(obj)
        return getattr(event, 'google_event_id', None) if event else None

    def get_calendar_event_created(self, obj):
        return self._get_calendar_event(obj) is not None


class ReservationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reservations with validation"""
    provider_type = serializers.ChoiceField(choices=['professional', 'place'], write_only=True)
    provider_id = serializers.IntegerField(write_only=True)
    service_instance_type = serializers.ChoiceField(choices=['place_service', 'professional_service'], write_only=True, required=False)
    service_instance_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Reservation
        fields = [
            'service', 'provider_type', 'provider_id',
            'service_instance_type', 'service_instance_id',
            'date', 'time', 'notes'
        ]
    
    def validate(self, attrs):
        # Validate date is in the future
        if attrs['date'] < datetime.now().date():
            raise serializers.ValidationError("Cannot book appointments in the past")
        
        # Validate provider exists
        provider_type = attrs['provider_type']
        provider_id = attrs['provider_id']
        
        if provider_type == 'professional':
            try:
                provider = ProfessionalProfile.objects.get(id=provider_id)
                attrs['provider_content_type'] = ContentType.objects.get_for_model(ProfessionalProfile)
                attrs['provider_object_id'] = provider_id
            except ProfessionalProfile.DoesNotExist:
                raise serializers.ValidationError("Professional not found")
        elif provider_type == 'place':
            try:
                provider = PlaceProfile.objects.get(id=provider_id)
                attrs['provider_content_type'] = ContentType.objects.get_for_model(PlaceProfile)
                attrs['provider_object_id'] = provider_id
            except PlaceProfile.DoesNotExist:
                raise serializers.ValidationError("Place not found")
        
        # Get service duration
        service = attrs['service']
        duration = None
        
        # Try to get duration from service instance
        if 'service_instance_type' in attrs and 'service_instance_id' in attrs:
            if attrs['service_instance_type'] == 'place_service':
                try:
                    service_instance = ServiceInPlace.objects.get(id=attrs['service_instance_id'])
                    duration = service_instance.time
                    attrs['_service_instance_content_type'] = ContentType.objects.get_for_model(ServiceInPlace)
                    attrs['_service_instance_object_id'] = service_instance.id
                except ServiceInPlace.DoesNotExist:
                    pass
            elif attrs['service_instance_type'] == 'professional_service':
                try:
                    service_instance = ProfessionalService.objects.get(id=attrs['service_instance_id'])
                    duration = service_instance.time
                    attrs['_service_instance_content_type'] = ContentType.objects.get_for_model(ProfessionalService)
                    attrs['_service_instance_object_id'] = service_instance.id
                except ProfessionalService.DoesNotExist:
                    pass
        
        attrs['_duration'] = duration
        
        return attrs
    
    def create(self, validated_data):
        # Extract custom fields
        validated_data.pop('provider_type')
        validated_data.pop('provider_id')
        validated_data.pop('service_instance_type', None)
        validated_data.pop('service_instance_id', None)
        
        # Set duration
        duration = validated_data.pop('_duration', None)
        if duration:
            validated_data['duration'] = duration
        
        # Set service instance if available
        service_instance_ct = validated_data.pop('_service_instance_content_type', None)
        service_instance_id = validated_data.pop('_service_instance_object_id', None)
        if service_instance_ct and service_instance_id:
            validated_data['service_instance_type'] = service_instance_ct
            validated_data['service_instance_id'] = service_instance_id
        
        # Get client profile from request user
        user = self.context['request'].user
        try:
            client_profile = user.client_profile
            validated_data['client'] = client_profile
        except:
            raise serializers.ValidationError("User does not have a client profile")
        
        return super().create(validated_data)


class ReservationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating reservations"""
    
    class Meta:
        model = Reservation
        fields = ['date', 'time', 'notes', 'status']
    
    def validate(self, attrs):
        # Only allow updates if reservation is pending
        if self.instance.status not in ['PENDING', 'CONFIRMED']:
            raise serializers.ValidationError("Cannot update completed or cancelled reservations")
        
        # Validate date if being updated
        if 'date' in attrs and attrs['date'] < datetime.now().date():
            raise serializers.ValidationError("Cannot reschedule to a past date")
        
        return attrs


class ReservationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing reservations"""
    client_name = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='service.name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'code', 'client_name', 'service_name', 'provider_name',
            'date', 'time', 'status', 'status_display', 'created_at'
        ]
    
    def get_client_name(self, obj):
        return f"{obj.client.user.first_name} {obj.client.user.last_name}"
    
    def get_provider_name(self, obj):
        provider = obj.provider
        if hasattr(provider, 'name'):
            if hasattr(provider, 'last_name'):
                return f"{provider.name} {provider.last_name}"
            return provider.name
        return None


class AvailableSlotSerializer(serializers.Serializer):
    """Serializer for available time slots"""
    time = serializers.TimeField()
    available = serializers.BooleanField()
    end_time = serializers.TimeField()


