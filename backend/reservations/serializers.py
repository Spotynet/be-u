from rest_framework import serializers
from .models import Reservation, GroupSession, TrackingRequest
from services.models import ServicesType, ServiceInPlace, ProfessionalService, ServicesCategory
from users.models import ClientProfile, ProfessionalProfile, PlaceProfile
from users.profile_models import CustomService
from users.serializers import UserSerializer
from services.serializers import ServicesTypeSerializer
from django.contrib.contenttypes.models import ContentType
from datetime import datetime, timedelta, time as dt_time
from reservations.availability import check_slot_availability
import logging
from django.db import transaction
from django.utils import timezone

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
    group_session_details = serializers.SerializerMethodField()
    
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
            'group_session', 'group_session_details',
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

    def get_group_session_details(self, obj):
        if not obj.group_session:
            return None
        gs = obj.group_session
        return {
            "id": gs.id,
            "capacity": gs.capacity,
            "booked_slots": gs.booked_slots,
            "remaining_slots": gs.remaining_slots,
            "status": gs.status,
        }


class ReservationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reservations with validation"""
    service_instance_type = serializers.ChoiceField(
        choices=['place_service', 'professional_service', 'custom_service'], 
        write_only=True,
        required=False,
        help_text="Type of service instance (place_service, professional_service, or custom_service)"
    )
    service_instance_id = serializers.IntegerField(
        write_only=True,
        required=False,
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
    group_session_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Reservation
        fields = [
            'service_instance_type', 'service_instance_id',
            'provider_type', 'provider_id',
            'group_session_id',
            'date', 'time', 'notes'
        ]
    
    def validate(self, attrs):
        group_session_id = attrs.get("group_session_id")
        if group_session_id:
            try:
                group_session = GroupSession.objects.get(id=group_session_id)
            except GroupSession.DoesNotExist:
                raise serializers.ValidationError({"group_session_id": ["Group session not found"]})

            if group_session.status != GroupSession.Status.ACTIVE:
                raise serializers.ValidationError(
                    {"group_session_id": ["This group session is not active"]}
                )
            if group_session.remaining_slots <= 0:
                raise serializers.ValidationError(
                    {"group_session_id": ["No slots available in this group session"]}
                )
            if group_session.date < datetime.now().date():
                raise serializers.ValidationError({"group_session_id": ["Group session is in the past"]})

            attrs["date"] = group_session.date
            attrs["time"] = group_session.time
            attrs["_duration"] = group_session.duration
            attrs["_service"] = group_session.service
            attrs["provider_content_type"] = group_session.provider_content_type
            attrs["provider_object_id"] = group_session.provider_object_id
            attrs["group_session"] = group_session
            if group_session.service_instance_type and group_session.service_instance_id:
                attrs["_service_instance_content_type"] = group_session.service_instance_type
                attrs["_service_instance_object_id"] = group_session.service_instance_id
            return attrs

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
        validated_data.pop('group_session_id', None)
        
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
        with transaction.atomic():
            group_session = validated_data.get("group_session")
            if group_session:
                if not group_session.reserve_one_slot():
                    raise serializers.ValidationError(
                        {"group_session_id": ["No slots available in this group session"]}
                    )
            return super().create(validated_data)


class GroupSessionSerializer(serializers.ModelSerializer):
    provider_type = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    remaining_slots = serializers.SerializerMethodField()

    class Meta:
        model = GroupSession
        fields = [
            "id",
            "provider_type",
            "provider_name",
            "service",
            "service_instance_type",
            "service_instance_id",
            "date",
            "time",
            "duration",
            "capacity",
            "booked_slots",
            "remaining_slots",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "provider_type",
            "provider_name",
            "provider_content_type",
            "provider_object_id",
            "booked_slots",
            "created_at",
            "updated_at",
        ]

    def get_provider_type(self, obj):
        if obj.provider_content_type.model == "professionalprofile":
            return "professional"
        if obj.provider_content_type.model == "placeprofile":
            return "place"
        return None

    def get_provider_name(self, obj):
        provider = obj.provider
        if hasattr(provider, "name"):
            if hasattr(provider, "last_name"):
                return f"{provider.name} {provider.last_name}"
            return provider.name
        return None

    def get_remaining_slots(self, obj):
        return obj.remaining_slots

    def validate(self, attrs):
        service_instance_type = attrs.get("service_instance_type")
        service_instance_id = attrs.get("service_instance_id")
        service = attrs.get("service")
        capacity = attrs.get("capacity")
        duration = attrs.get("duration")
        date = attrs.get("date")
        time_value = attrs.get("time")

        if self.instance:
            service_instance_type = service_instance_type or self.instance.service_instance_type
            service_instance_id = service_instance_id or self.instance.service_instance_id
            service = service or self.instance.service
            capacity = capacity if capacity is not None else self.instance.capacity
            duration = duration or self.instance.duration
            date = date or self.instance.date
            time_value = time_value or self.instance.time

        errors = {}

        if not service_instance_type or not service_instance_id:
            errors["service_instance_id"] = [
                "service_instance_type and service_instance_id are required for group sessions."
            ]
        if capacity is not None and capacity <= 0:
            errors["capacity"] = ["Capacity must be greater than 0."]
        if duration is not None and duration <= timedelta(0):
            errors["duration"] = ["Duration must be greater than 0."]
        if date and time_value:
            starts_at = datetime.combine(date, time_value)
            if timezone.is_naive(starts_at):
                starts_at = timezone.make_aware(starts_at, timezone.get_current_timezone())
            if starts_at <= timezone.now():
                errors["date"] = ["Group session must be scheduled in the future."]

        service_instance_obj = None
        if service_instance_type and service_instance_id:
            model = service_instance_type.model_class()
            if model not in (ProfessionalService, ServiceInPlace):
                errors["service_instance_type"] = [
                    "service_instance_type must be ProfessionalService or ServiceInPlace."
                ]
            else:
                service_instance_obj = model.objects.filter(id=service_instance_id).first()
                if not service_instance_obj:
                    errors["service_instance_id"] = ["Service instance not found."]
                elif service and service_instance_obj.service_id != service.id:
                    errors["service"] = [
                        "Selected service does not match the service instance."
                    ]

        request = self.context.get("request")
        if request and service_instance_obj:
            user = request.user
            if user.role == "PROFESSIONAL":
                if not isinstance(service_instance_obj, ProfessionalService):
                    errors["service_instance_type"] = [
                        "Professionals can only create group sessions from professional services."
                    ]
                elif service_instance_obj.professional.user_id != user.id:
                    errors["service_instance_id"] = ["Service instance does not belong to this professional."]
            elif user.role == "PLACE":
                if not isinstance(service_instance_obj, ServiceInPlace):
                    errors["service_instance_type"] = [
                        "Places can only create group sessions from place services."
                    ]
                elif service_instance_obj.place.user_id != user.id:
                    errors["service_instance_id"] = ["Service instance does not belong to this place."]

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class TrackingRequestSerializer(serializers.ModelSerializer):
    reservation_code = serializers.CharField(source="reservation.code", read_only=True)
    requester_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = TrackingRequest
        fields = [
            "id",
            "reservation",
            "reservation_code",
            "requester",
            "requester_name",
            "recipient",
            "recipient_name",
            "status",
            "expires_at",
            "latest_latitude",
            "latest_longitude",
            "latest_accuracy_meters",
            "latest_reported_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "requester",
            "recipient",
            "status",
            "latest_latitude",
            "latest_longitude",
            "latest_accuracy_meters",
            "latest_reported_at",
            "created_at",
            "updated_at",
        ]

    def get_requester_name(self, obj):
        return (
            f"{obj.requester.first_name} {obj.requester.last_name}".strip()
            or obj.requester.username
            or obj.requester.email
        )

    def get_recipient_name(self, obj):
        return (
            f"{obj.recipient.first_name} {obj.recipient.last_name}".strip()
            or obj.recipient.username
            or obj.recipient.email
        )


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

        if self.instance.group_session and ('date' in attrs or 'time' in attrs):
            raise serializers.ValidationError(
                "Cannot manually reschedule a reservation that belongs to a group session"
            )

        next_date = attrs.get("date", self.instance.date)
        next_time = attrs.get("time", self.instance.time)
        date_changed = next_date != self.instance.date
        time_changed = next_time != self.instance.time

        if date_changed or time_changed:
            duration = self.instance.duration or timedelta(hours=1)
            is_available, reason = check_slot_availability(
                self.instance.provider_content_type,
                self.instance.provider_object_id,
                next_date,
                next_time,
                duration,
                exclude_reservation_id=self.instance.id,
            )
            if not is_available:
                raise serializers.ValidationError(
                    {"time": [reason or "Selected time is not available"]}
                )
        
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


