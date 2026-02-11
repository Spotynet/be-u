from rest_framework import serializers
from .models import Reservation
from services.models import ServicesType, ServiceInPlace, ProfessionalService, ServicesCategory
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile
from users.profile_models import CustomService
from users.serializers import UserSerializer
from services.serializers import ServicesTypeSerializer
from django.contrib.contenttypes.models import ContentType
from datetime import datetime, timedelta, time as dt_time
from reservations.availability import check_slot_availability
import logging

logger = logging.getLogger(__name__)


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
            'service', 'service_details', 'service_instance_id',
            'provider_type', 'provider_name', 'provider_details',
            'date', 'time', 'duration', 'duration_minutes', 'end_time',
            'status', 'status_display',
            'notes', 'cancellation_reason', 'rejection_reason',
            'service_latitude', 'service_longitude', 'service_address',
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
        public_profile = None
        if provider and hasattr(provider, "user") and hasattr(provider.user, "public_profile"):
            public_profile = provider.user.public_profile

        provider_location = None
        if public_profile and public_profile.latitude is not None and public_profile.longitude is not None:
            address_parts = [public_profile.street, public_profile.number_ext, public_profile.city]
            address = " ".join([part for part in address_parts if part])
            provider_location = {
                "latitude": float(public_profile.latitude),
                "longitude": float(public_profile.longitude),
                "address": address or None,
            }
        
        if provider_type == 'professional':
            return {
                'id': provider.id,
                'name': f"{provider.name} {provider.last_name}",
                'bio': provider.bio,
                'city': provider.city,
                'rating': float(provider.rating) if provider.rating else 0.0,
                'location': provider_location,
            }
        elif provider_type == 'place':
            return {
                'id': provider.id,
                'name': provider.name,
                'address': f"{provider.street} {provider.number_ext or ''}",
                'city': provider.city,
                'country': provider.country,
                'location': provider_location,
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
    service_instance_type = serializers.ChoiceField(
        choices=['place_service', 'professional_service', 'custom_service'], 
        write_only=True,
        help_text="Type of service instance (place_service, professional_service, or custom_service)"
    )
    service_instance_id = serializers.IntegerField(
        write_only=True,
        help_text="ID of the ServiceInPlace, ProfessionalService, or CustomService"
    )
    # Optional: allow client to provide provider context (used for ID resolution consistency)
    provider_type = serializers.ChoiceField(
        choices=['professional', 'place'],
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Optional provider type for resolving provider/service instance (professional or place)"
    )
    provider_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Optional provider id (ProfessionalProfile/PlaceProfile or PublicProfile id) for resolving provider/service instance"
    )
    
    class Meta:
        model = Reservation
        fields = [
            'service_instance_type', 'service_instance_id',
            'provider_type', 'provider_id',
            'date', 'time', 'notes'
        ]
    
    def validate(self, attrs):
        # Validate date is in the future
        if attrs['date'] < datetime.now().date():
            raise serializers.ValidationError("Cannot book appointments in the past")
        
        # Validate and extract data from service instance
        service_instance_type = attrs['service_instance_type']
        service_instance_id = attrs['service_instance_id']
        req_provider_type = attrs.get('provider_type')
        req_provider_id = attrs.get('provider_id')
        
        # Log incoming request data
        logger.info(
            f"Reservation creation request: service_instance_type={service_instance_type}, "
            f"service_instance_id={service_instance_id}, provider_type={req_provider_type}, provider_id={req_provider_id}, "
            f"date={attrs.get('date')}, time={attrs.get('time')}"
        )
        
        service_instance = None
        provider = None
        service_type = None
        duration = None

        def resolve_provider_profile_id(provider_type: str | None, provider_id: int | None):
            """
            Accept either a real provider profile id or a PublicProfile id and resolve to provider profile id.
            Mirrors logic from /services/availability/schedule.
            """
            if not provider_type or not provider_id:
                return None
            try:
                pid = int(provider_id)
            except (TypeError, ValueError):
                return None

            if provider_type == 'professional':
                try:
                    prof = ProfessionalProfile.objects.get(id=pid)
                    return prof.id
                except ProfessionalProfile.DoesNotExist:
                    try:
                        from users.models import PublicProfile
                        public_profile = PublicProfile.objects.get(id=pid, profile_type='PROFESSIONAL')
                        if public_profile.user and hasattr(public_profile.user, 'professional_profile'):
                            return public_profile.user.professional_profile.id
                    except Exception:
                        return None
            elif provider_type == 'place':
                try:
                    place = PlaceProfile.objects.get(id=pid)
                    return place.id
                except PlaceProfile.DoesNotExist:
                    try:
                        from users.models import PublicProfile
                        public_profile = PublicProfile.objects.get(id=pid, profile_type='PLACE')
                        if public_profile.user and hasattr(public_profile.user, 'place_profile'):
                            return public_profile.user.place_profile.id
                    except Exception:
                        return None
            return None

        resolved_provider_profile_id = resolve_provider_profile_id(req_provider_type, req_provider_id)
        
        # Get service instance and extract all necessary data
        if service_instance_type == 'place_service':
            try:
                # Prefer resolving by (provider_id, service_id) when provider context is provided.
                # This matches the frontend flow which validates availability using provider_id.
                if resolved_provider_profile_id and (req_provider_type == 'place'):
                    service_instance = ServiceInPlace.objects.select_related('service', 'place').get(
                        place_id=resolved_provider_profile_id,
                        service_id=service_instance_id
                    )
                    provider = service_instance.place
                    service_type = service_instance.service
                    duration = service_instance.time
                    logger.info(
                        f"Resolved ServiceInPlace via (place_id, service_id): place_id={resolved_provider_profile_id}, "
                        f"service_id={service_instance_id}, instance_id={service_instance.id}"
                    )
                else:
                    # Backwards compatible: treat service_instance_id as ServiceInPlace.id
                    service_instance = ServiceInPlace.objects.select_related('service', 'place').get(id=service_instance_id)
                    provider = service_instance.place
                    service_type = service_instance.service
                    duration = service_instance.time

                # Set provider info
                attrs['provider_content_type'] = ContentType.objects.get_for_model(PlaceProfile)
                attrs['provider_object_id'] = provider.id
                
            except ServiceInPlace.DoesNotExist:
                # If we couldn't resolve either way, continue with CustomService fallback.
                # Fallback: Check if it's a CustomService (for backwards compatibility)
                try:
                    custom_service = CustomService.objects.select_related('content_type').get(id=service_instance_id)
                    provider = custom_service.provider
                    # Convert duration_minutes to timedelta
                    duration = timedelta(minutes=custom_service.duration_minutes)
                    
                    # Get or create a placeholder ServicesType for custom services
                    category, _ = ServicesCategory.objects.get_or_create(
                        name='Personalizado',
                        defaults={'description': 'Servicios personalizados'}
                    )
                    service_type, _ = ServicesType.objects.get_or_create(
                        category=category,
                        name=custom_service.name,
                        defaults={
                            'description': custom_service.description or f'Servicio personalizado: {custom_service.name}'
                        }
                    )
                    
                    # Set provider info based on content type
                    attrs['provider_content_type'] = custom_service.content_type
                    attrs['provider_object_id'] = custom_service.object_id
                    service_instance = custom_service
                    
                except CustomService.DoesNotExist:
                    raise serializers.ValidationError(f"Service instance with ID {service_instance_id} not found")
                
        elif service_instance_type == 'professional_service':
            try:
                # Prefer resolving by (provider_id, service_id) when provider context is provided.
                # This matches the frontend flow which validates availability using provider_id.
                if resolved_provider_profile_id and (req_provider_type == 'professional'):
                    service_instance = ProfessionalService.objects.select_related('service', 'professional').get(
                        professional_id=resolved_provider_profile_id,
                        service_id=service_instance_id
                    )
                    provider = service_instance.professional
                    service_type = service_instance.service
                    duration = service_instance.time
                    logger.info(
                        f"Resolved ProfessionalService via (professional_id, service_id): professional_id={resolved_provider_profile_id}, "
                        f"service_id={service_instance_id}, instance_id={service_instance.id}"
                    )
                else:
                    # Backwards compatible: treat service_instance_id as ProfessionalService.id
                    service_instance = ProfessionalService.objects.select_related('service', 'professional').get(id=service_instance_id)
                    provider = service_instance.professional
                    service_type = service_instance.service
                    duration = service_instance.time
                
                # Log for debugging - this should match what frontend uses
                logger.info(
                    f"Resolving provider from ProfessionalService: service_instance_id={service_instance_id}, "
                    f"professional_id={provider.id}, professional_name={provider.name}"
                )
                
                # Set provider info - use the same ID that frontend uses (from service_instance.professional)
                attrs['provider_content_type'] = ContentType.objects.get_for_model(ProfessionalProfile)
                attrs['provider_object_id'] = provider.id
                
            except ProfessionalService.DoesNotExist:
                # If we couldn't resolve either way, continue with CustomService fallback.
                # Fallback: Check if it's a CustomService (for backwards compatibility)
                try:
                    custom_service = CustomService.objects.select_related('content_type').get(id=service_instance_id)
                    provider = custom_service.provider
                    # Convert duration_minutes to timedelta
                    duration = timedelta(minutes=custom_service.duration_minutes)
                    
                    # Get or create a placeholder ServicesType for custom services
                    category, _ = ServicesCategory.objects.get_or_create(
                        name='Personalizado',
                        defaults={'description': 'Servicios personalizados'}
                    )
                    service_type, _ = ServicesType.objects.get_or_create(
                        category=category,
                        name=custom_service.name,
                        defaults={
                            'description': custom_service.description or f'Servicio personalizado: {custom_service.name}'
                        }
                    )
                    
                    # Set provider info based on content type
                    attrs['provider_content_type'] = custom_service.content_type
                    attrs['provider_object_id'] = custom_service.object_id
                    service_instance = custom_service
                    
                except CustomService.DoesNotExist:
                    raise serializers.ValidationError(f"Service instance with ID {service_instance_id} not found")
                
        elif service_instance_type == 'custom_service':
            try:
                service_instance = CustomService.objects.select_related('content_type').get(id=service_instance_id)
                provider = service_instance.provider
                # Convert duration_minutes to timedelta
                duration = timedelta(minutes=service_instance.duration_minutes)
                
                # Get or create a placeholder ServicesType for custom services
                # Since CustomService doesn't have a ServicesType, we create/get a generic one
                category, _ = ServicesCategory.objects.get_or_create(
                    name='Personalizado',
                    defaults={'description': 'Servicios personalizados'}
                )
                service_type, _ = ServicesType.objects.get_or_create(
                    category=category,
                    name=service_instance.name,
                    defaults={
                        'description': service_instance.description or f'Servicio personalizado: {service_instance.name}'
                    }
                )
                
                # Set provider info based on content type
                attrs['provider_content_type'] = service_instance.content_type
                attrs['provider_object_id'] = service_instance.object_id
                
            except CustomService.DoesNotExist:
                raise serializers.ValidationError(f"Service instance with ID {service_instance_id} not found")
        else:
            raise serializers.ValidationError("Invalid service_instance_type")
        
        # Set extracted data
        attrs['_service'] = service_type
        attrs['_duration'] = duration
        attrs['_service_instance_content_type'] = ContentType.objects.get_for_model(type(service_instance))
        attrs['_service_instance_object_id'] = service_instance.id
        
        # Check availability
        provider_ct = attrs['provider_content_type']
        provider_id = attrs['provider_object_id']
        date = attrs['date']
        time = attrs['time']
        
        logger.info(
            f"Reservation validation: service_instance_type={service_instance_type}, "
            f"service_instance_id={service_instance_id}, provider_ct={provider_ct}, "
            f"provider_id={provider_id}, date={date}, time={time}, duration={duration}"
        )

        # Block self-booking (provider booking their own profile)
        try:
            request_user = self.context.get('request').user if self.context.get('request') else None
            if request_user and provider and getattr(provider, 'user_id', None) == request_user.id:
                raise serializers.ValidationError(
                    {"non_field_errors": ["No puedes hacer una reserva en tu propio perfil."]}
                )
        except serializers.ValidationError:
            raise
        except Exception:
            # Never fail validation due to the safeguard itself
            pass
        
        is_available, reason = check_slot_availability(provider_ct, provider_id, date, time, duration)
        if not is_available:
            # Add more context to the error message
            error_msg = reason or "Time slot is not available"
            logger.error(
                f"Availability check failed: service_instance_type={service_instance_type}, "
                f"service_instance_id={service_instance_id}, provider_ct={provider_ct}, "
                f"provider_id={provider_id}, date={date} (day_of_week={date.weekday()}), "
                f"time={time}, duration={duration}, reason={reason}"
            )
            # Return error in non_field_errors format to match frontend expectations
            raise serializers.ValidationError({"non_field_errors": [error_msg]})
        
        return attrs
    
    def create(self, validated_data):
        # Extract custom fields from validation
        validated_data.pop('service_instance_type', None)
        validated_data.pop('service_instance_id', None)
        # Provider context is only for resolution/validation; it is not a Reservation model field.
        validated_data.pop('provider_type', None)
        validated_data.pop('provider_id', None)
        
        # Set service (ServicesType)
        service = validated_data.pop('_service')
        validated_data['service'] = service
        
        # Set duration
        duration = validated_data.pop('_duration', None)
        if duration:
            validated_data['duration'] = duration
        
        # Set service instance reference
        service_instance_ct = validated_data.pop('_service_instance_content_type', None)
        service_instance_id = validated_data.pop('_service_instance_object_id', None)
        if service_instance_ct and service_instance_id:
            validated_data['service_instance_type'] = service_instance_ct
            validated_data['service_instance_id'] = service_instance_id
        
        # Get or create client profile from request user
        user = self.context['request'].user
        try:
            client_profile = user.client_profile
        except:
            # If user doesn't have a client profile, create one
            from users.models import ClientProfile
            client_profile, created = ClientProfile.objects.get_or_create(
                user=user,
                defaults={
                    'phone': user.phone if hasattr(user, 'phone') else '',
                }
            )
        validated_data['client'] = client_profile

        # New requirement: reservations are confirmed immediately (no PENDING state)
        validated_data['status'] = Reservation.Status.CONFIRMED
        
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


