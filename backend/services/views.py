import logging
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.contenttypes.models import ContentType
from datetime import datetime, timedelta, time as dt_time
from django.utils import timezone
from .models import (
    ServicesCategory, ServicesType, ServiceInPlace, 
    ProfessionalService, ProviderAvailability, TimeSlotBlock
)
from .serializers import (
    ServicesCategorySerializer, ServicesTypeSerializer,
    ServiceInPlaceSerializer, ProfessionalServiceSerializer,
    ProviderAvailabilitySerializer, ProviderAvailabilityCreateSerializer,
    TimeSlotBlockSerializer, AvailableSlotSerializer
)
from .permissions import IsPlaceOwner, IsProfessional, IsServiceOwner, CanManageAvailability
from reservations.models import Reservation
from reservations.availability import get_provider_schedule_for_date
from users.models import ProfessionalProfile, PlaceProfile
from .category_rules import is_service_category_allowed_for_profile

logger = logging.getLogger(__name__)


class ServicesCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for service categories - read only"""
    queryset = ServicesCategory.objects.all()
    serializer_class = ServicesCategorySerializer
    permission_classes = [AllowAny]


class ServicesTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for service types"""
    queryset = ServicesType.objects.all()
    serializer_class = ServicesTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Allow anyone to list/retrieve service types; require auth for modifications"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        
        if category:
            queryset = queryset.filter(category__name__icontains=category)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset


class ServiceInPlaceViewSet(viewsets.ModelViewSet):
    """ViewSet for services offered by places"""
    queryset = ServiceInPlace.objects.select_related('place', 'service', 'professional').all()
    serializer_class = ServiceInPlaceSerializer
    permission_classes = [IsAuthenticated, IsServiceOwner]

    def get_permissions(self):
        """Allow anyone to list/retrieve place services; require auth for modifications"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsServiceOwner()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on query parameters
        place_id = self.request.query_params.get('place', None)
        user_id = self.request.query_params.get('user', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if place_id:
            queryset = queryset.filter(place_id=place_id)
        elif user_id:
            # Allow filtering by user_id for public profile lookups
            from users.models import User
            try:
                target_user = User.objects.get(id=user_id)
                if hasattr(target_user, 'place_profile'):
                    queryset = queryset.filter(place=target_user.place_profile)
                else:
                    queryset = queryset.none()
            except User.DoesNotExist:
                queryset = queryset.none()
                
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == 'true')
        
        # For PLACE users, only show their own services (only if authenticated)
        if user.is_authenticated and user.role == 'PLACE' and not place_id and not user_id:
            try:
                place = user.place_profile
                queryset = queryset.filter(place=place)
            except AttributeError:
                queryset = queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        # Ensure the place belongs to the current user
        user = self.request.user
        if user.role != 'PLACE':
            raise PermissionError("Only places can create place services")
        
        try:
            place = user.place_profile
            service_type = serializer.validated_data.get("service")
            service_category_name = (
                service_type.category.name if service_type and service_type.category else None
            )
            if not is_service_category_allowed_for_profile(service_category_name, place):
                raise serializers.ValidationError(
                    {
                        "service": (
                            "Este servicio no pertenece a las categorias activas de tu perfil."
                        )
                    }
                )
            serializer.save(place=place)
        except AttributeError:
            # Auto-create place profile if missing
            from users.models import PlaceProfile
            place = PlaceProfile.objects.create(
                user=user,
                name=user.first_name or 'Place',
                street='TBD',
                postal_code='00000',
                owner=user
            )
            serializer.save(place=place)


class ProfessionalServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for services offered by independent professionals"""
    queryset = ProfessionalService.objects.select_related('professional', 'service').all()
    serializer_class = ProfessionalServiceSerializer
    permission_classes = [IsAuthenticated, IsServiceOwner]

    def get_permissions(self):
        """Allow anyone to list/retrieve professional services; require auth for modifications"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsServiceOwner()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on query parameters
        professional_id = self.request.query_params.get('professional', None)
        user_id = self.request.query_params.get('user', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)
        elif user_id:
            # Allow filtering by user_id for public profile lookups
            from users.models import User
            try:
                target_user = User.objects.get(id=user_id)
                if hasattr(target_user, 'professional_profile'):
                    queryset = queryset.filter(professional=target_user.professional_profile)
                else:
                    queryset = queryset.none()
            except User.DoesNotExist:
                queryset = queryset.none()
                
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == 'true')
        
        # For PROFESSIONAL users, only show their own services (only if authenticated)
        if user.is_authenticated and user.role == 'PROFESSIONAL' and not professional_id and not user_id:
            try:
                professional = user.professional_profile
                queryset = queryset.filter(professional=professional)
            except AttributeError:
                queryset = queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        # Ensure the professional belongs to the current user
        user = self.request.user
        if user.role != 'PROFESSIONAL':
            raise PermissionError("Only professionals can create professional services")
        
        try:
            professional = user.professional_profile
            service_type = serializer.validated_data.get("service")
            service_category_name = (
                service_type.category.name if service_type and service_type.category else None
            )
            if not is_service_category_allowed_for_profile(service_category_name, professional):
                raise serializers.ValidationError(
                    {
                        "service": (
                            "Este servicio no pertenece a las categorias activas de tu perfil."
                        )
                    }
                )
            serializer.save(professional=professional)
        except AttributeError:
            # Auto-create professional profile if missing
            from users.models import ProfessionalProfile
            professional = ProfessionalProfile.objects.create(
                user=user,
                name=user.first_name or 'Professional',
                last_name=user.last_name or 'User'
            )
            serializer.save(professional=professional)


class ProviderAvailabilityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing provider availability schedules"""
    queryset = ProviderAvailability.objects.all()
    serializer_class = ProviderAvailabilitySerializer
    permission_classes = [IsAuthenticated, CanManageAvailability]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by provider
        provider_type = self.request.query_params.get('provider_type', None)
        provider_id = self.request.query_params.get('provider_id', None)
        
        if provider_type and provider_id:
            if provider_type == 'professional':
                ct = ContentType.objects.get_for_model(ProfessionalProfile)
            elif provider_type == 'place':
                ct = ContentType.objects.get_for_model(PlaceProfile)
            else:
                return queryset.none()
            
            queryset = queryset.filter(content_type=ct, object_id=provider_id)
        else:
            # Show only user's availability
            if user.role == 'PROFESSIONAL':
                try:
                    ct = ContentType.objects.get_for_model(ProfessionalProfile)
                    queryset = queryset.filter(content_type=ct, object_id=user.professional_profile.id)
                except:
                    queryset = queryset.none()
            elif user.role == 'PLACE':
                try:
                    ct = ContentType.objects.get_for_model(PlaceProfile)
                    queryset = queryset.filter(content_type=ct, object_id=user.place_profile.id)
                except:
                    queryset = queryset.none()
        
        return queryset
    
    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """Bulk create/update availability for a provider"""
        serializer = ProviderAvailabilityCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        provider_type = serializer.validated_data['provider_type']
        provider_id = serializer.validated_data['provider_id']
        schedules = serializer.validated_data['schedules']
        
        # Get content type
        if provider_type == 'professional':
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
            provider = ProfessionalProfile.objects.get(id=provider_id)
        else:
            ct = ContentType.objects.get_for_model(PlaceProfile)
            provider = PlaceProfile.objects.get(id=provider_id)
        
        # Verify ownership
        if provider.user != request.user:
            return Response(
                {"error": "You don't have permission to manage this provider's availability"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete existing schedules
        ProviderAvailability.objects.filter(content_type=ct, object_id=provider_id).delete()
        
        # Create new schedules
        created_schedules = []
        for schedule in schedules:
            availability = ProviderAvailability.objects.create(
                content_type=ct,
                object_id=provider_id,
                day_of_week=schedule['day_of_week'],
                start_time=schedule['start_time'],
                end_time=schedule['end_time'],
                is_active=schedule.get('is_active', True)
            )
            created_schedules.append(availability)
        
        serializer = ProviderAvailabilitySerializer(created_schedules, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='schedule', permission_classes=[AllowAny])
    def get_schedule(self, request):
        """Get provider's schedule for a specific date (public endpoint)"""
        # Ensure logger is available (it's defined at module level)
        global logger
        
        provider_type = request.query_params.get('provider_type')
        provider_id = request.query_params.get('provider_id')
        date_str = request.query_params.get('date')
        
        if not all([provider_type, provider_id, date_str]):
            return Response(
                {"error": "provider_type, provider_id, and date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get content type and resolve provider ID
        # The provider_id might be a PublicProfile ID, so we need to resolve it
        # Use print for immediate visibility in development
        print(f"[SCHEDULE] Getting schedule for provider_type={provider_type}, provider_id={provider_id}, date={date}, day_of_week={date.weekday()}")
        logger.info(f"Getting schedule for provider_type={provider_type}, provider_id={provider_id}, date={date}, day_of_week={date.weekday()}")
        
        resolved_provider_id = None
        provider = None
        
        if provider_type == 'professional':
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
            
            # First try to get ProfessionalProfile directly
            try:
                provider = ProfessionalProfile.objects.get(id=int(provider_id))
                resolved_provider_id = provider.id
                logger.info(f"Found ProfessionalProfile directly: {provider.id}, user_id={provider.user.id if provider.user else None}")
            except ProfessionalProfile.DoesNotExist:
                # Try to find via PublicProfile
                try:
                    from users.models import PublicProfile
                    public_profile = PublicProfile.objects.get(id=int(provider_id), profile_type='PROFESSIONAL')
                    if public_profile.user and hasattr(public_profile.user, 'professional_profile'):
                        provider = public_profile.user.professional_profile
                        resolved_provider_id = provider.id
                        logger.info(f"Found ProfessionalProfile via PublicProfile: PublicProfile.id={provider_id}, ProfessionalProfile.id={provider.id}")
                    else:
                        return Response(
                            {"error": f"Professional profile not found for PublicProfile ID {provider_id}"},
                            status=status.HTTP_404_NOT_FOUND
                        )
                except PublicProfile.DoesNotExist:
                    return Response(
                        {"error": f"Professional with ID {provider_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
        elif provider_type == 'place':
            ct = ContentType.objects.get_for_model(PlaceProfile)
            
            # First try to get PlaceProfile directly
            try:
                provider = PlaceProfile.objects.get(id=int(provider_id))
                resolved_provider_id = provider.id
                logger.info(f"Found PlaceProfile directly: {provider.id}, user_id={provider.user.id if provider.user else None}")
            except PlaceProfile.DoesNotExist:
                # Try to find via PublicProfile
                try:
                    from users.models import PublicProfile
                    public_profile = PublicProfile.objects.get(id=int(provider_id), profile_type='PLACE')
                    if public_profile.user and hasattr(public_profile.user, 'place_profile'):
                        provider = public_profile.user.place_profile
                        resolved_provider_id = provider.id
                        logger.info(f"Found PlaceProfile via PublicProfile: PublicProfile.id={provider_id}, PlaceProfile.id={provider.id}")
                    else:
                        return Response(
                            {"error": f"Place profile not found for PublicProfile ID {provider_id}"},
                            status=status.HTTP_404_NOT_FOUND
                        )
                except PublicProfile.DoesNotExist:
                    return Response(
                        {"error": f"Place with ID {provider_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
        else:
            return Response(
                {"error": "Invalid provider_type. Use 'professional' or 'place'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            print(f"[SCHEDULE] Using ContentType: {ct}, model={ct.model}, app_label={ct.app_label}, resolved_provider_id={resolved_provider_id}")
            logger.info(f"Using ContentType: {ct}, model={ct.model}, app_label={ct.app_label}, resolved_provider_id={resolved_provider_id}")
            
            # Debug: Check all ProviderAvailability records for this provider (any day)
            all_availability = ProviderAvailability.objects.filter(
                content_type=ct,
                object_id=resolved_provider_id
            )
            availability_count = all_availability.count()
            print(f"[SCHEDULE] Total ProviderAvailability records for provider {resolved_provider_id} (all days): {availability_count}")
            logger.info(f"Total ProviderAvailability records for this provider (all days): {availability_count}")
            if availability_count > 0:
                for av in all_availability:
                    print(f"[SCHEDULE]   - Day {av.day_of_week}: {av.start_time} - {av.end_time}, is_active={av.is_active}")
                    logger.info(f"  - Day {av.day_of_week}: {av.start_time} - {av.end_time}, is_active={av.is_active}")
            
            # Also check AvailabilitySchedule
            from users.profile_models import AvailabilitySchedule
            all_schedules = AvailabilitySchedule.objects.filter(
                content_type=ct,
                object_id=resolved_provider_id
            )
            schedule_count = all_schedules.count()
            print(f"[SCHEDULE] Total AvailabilitySchedule records for provider {resolved_provider_id} (all days): {schedule_count}")
            logger.info(f"Total AvailabilitySchedule records for this provider (all days): {schedule_count}")
            if schedule_count > 0:
                for sched in all_schedules:
                    print(f"[SCHEDULE]   - Day {sched.day_of_week}: is_available={sched.is_available}")
                    logger.info(f"  - Day {sched.day_of_week}: is_available={sched.is_available}")
            
            # Check specific day
            day_of_week = date.weekday()
            day_availability = ProviderAvailability.objects.filter(
                content_type=ct,
                object_id=resolved_provider_id,
                day_of_week=day_of_week,
                is_active=True
            )
            day_avail_count = day_availability.count()
            print(f"[SCHEDULE] ProviderAvailability for day_of_week={day_of_week} (date={date}): {day_avail_count} records")
            logger.info(f"ProviderAvailability for day_of_week={day_of_week}: {day_avail_count} records")
            if day_availability.exists():
                for av in day_availability:
                    print(f"[SCHEDULE]   Found: {av.start_time} - {av.end_time}")
                    logger.info(f"  Found: {av.start_time} - {av.end_time}")
            
            day_schedule = AvailabilitySchedule.objects.filter(
                content_type=ct,
                object_id=resolved_provider_id,
                day_of_week=day_of_week,
                is_available=True
            )
            day_sched_count = day_schedule.count()
            print(f"[SCHEDULE] AvailabilitySchedule for day_of_week={day_of_week} (date={date}): {day_sched_count} records")
            logger.info(f"AvailabilitySchedule for day_of_week={day_of_week}: {day_sched_count} records")
            if day_schedule.exists():
                for sched in day_schedule:
                    from users.profile_models import TimeSlot
                    time_slots = TimeSlot.objects.filter(schedule=sched, is_active=True)
                    ts_count = time_slots.count()
                    print(f"[SCHEDULE]   Found schedule id={sched.id}, time_slots={ts_count}")
                    logger.info(f"  Found schedule id={sched.id}, time_slots={ts_count}")
                    for ts in time_slots:
                        print(f"[SCHEDULE]     TimeSlot: {ts.start_time} - {ts.end_time}")
                        logger.info(f"    TimeSlot: {ts.start_time} - {ts.end_time}")
            
            schedule_data = get_provider_schedule_for_date(ct, resolved_provider_id, date)
            print(f"[SCHEDULE] Final schedule data: working_hours={schedule_data.get('working_hours')}, booked_slots={len(schedule_data.get('booked_slots', []))}, break_times={len(schedule_data.get('break_times', []))}")
            logger.info(f"Final schedule data: {schedule_data}")
            return Response(schedule_data)
        except Exception as e:
            logger.error(f"Error getting schedule: {e}", exc_info=True)
            print(f"[SCHEDULE] ERROR: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TimeSlotBlockViewSet(viewsets.ModelViewSet):
    """ViewSet for managing time slot blocks"""
    queryset = TimeSlotBlock.objects.all()
    serializer_class = TimeSlotBlockSerializer
    permission_classes = [IsAuthenticated, CanManageAvailability]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Show only user's blocks
        if user.role == 'PROFESSIONAL':
            try:
                ct = ContentType.objects.get_for_model(ProfessionalProfile)
                queryset = queryset.filter(content_type=ct, object_id=user.professional_profile.id)
            except:
                queryset = queryset.none()
        elif user.role == 'PLACE':
            try:
                ct = ContentType.objects.get_for_model(PlaceProfile)
                queryset = queryset.filter(content_type=ct, object_id=user.place_profile.id)
            except:
                queryset = queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Determine provider
        if user.role == 'PROFESSIONAL':
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
            provider_id = user.professional_profile.id
        elif user.role == 'PLACE':
            ct = ContentType.objects.get_for_model(PlaceProfile)
            provider_id = user.place_profile.id
        else:
            raise PermissionError("Only professionals and places can block time slots")
        
        serializer.save(content_type=ct, object_id=provider_id)


@action(detail=False, methods=['get'], url_path='available-slots')
def get_available_slots(self, request):
    """Get available time slots for a specific service and date"""
    from users.profile_models import AvailabilitySchedule, TimeSlot as ProfileTimeSlot
    
    service_id = request.query_params.get('service_id')
    date_str = request.query_params.get('date')
    service_type = request.query_params.get('service_type', 'place')  # 'place' or 'professional'
    
    if not service_id or not date_str:
        return Response(
            {"error": "service_id and date are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {"error": "Invalid date format. Use YYYY-MM-DD"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get service and provider
    if service_type == 'place':
        try:
            service_instance = ServiceInPlace.objects.get(id=service_id)
            provider = service_instance.place
            ct = ContentType.objects.get_for_model(PlaceProfile)
            duration = service_instance.time
        except ServiceInPlace.DoesNotExist:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)
    else:
        try:
            service_instance = ProfessionalService.objects.get(id=service_id)
            provider = service_instance.professional
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
            duration = service_instance.time
        except ProfessionalService.DoesNotExist:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Get day of week (0=Monday, 6=Sunday)
    day_of_week = target_date.weekday()
    
    # Get provider's availability schedule for this day (using the correct model from users.profile_models)
    availability_schedule = AvailabilitySchedule.objects.filter(
        content_type=ct,
        object_id=provider.id,
        day_of_week=day_of_week,
        is_available=True
    ).first()
    
    if not availability_schedule:
        return Response(
            {"error": "Provider is not available on this day", "slots": []},
            status=status.HTTP_200_OK
        )
    
    # Get the time slots for this day
    time_slots = ProfileTimeSlot.objects.filter(
        schedule=availability_schedule,
        is_active=True
    ).order_by('start_time')
    
    if not time_slots.exists():
        return Response(
            {"error": "No time slots configured for this day", "slots": []},
            status=status.HTTP_200_OK
        )
    
    # Get Google Calendar busy times if provider has calendar connected
    google_busy_times = []
    has_google_calendar = False
    try:
        from calendar_integration.services import google_calendar_service
        provider_user = provider.user
        if google_calendar_service.has_calendar_connected(provider_user):
            has_google_calendar = True
            # Get busy times for the entire day (timezone-aware)
            tz = timezone.get_default_timezone()
            day_start = timezone.make_aware(datetime.combine(target_date, dt_time(0, 0)), tz)
            day_end = timezone.make_aware(datetime.combine(target_date, dt_time(23, 59, 59)), tz)
            calendar_id = 'primary'
            try:
                calendar_id = provider_user.google_calendar_credentials.calendar_id or 'primary'
            except Exception:
                calendar_id = 'primary'
            google_busy_times = google_calendar_service.get_busy_times(
                provider_user, day_start, day_end, calendar_id=calendar_id
            )
    except Exception as e:
        # Log but don't fail if Google Calendar is unavailable
        import logging
        logging.getLogger(__name__).warning(f"Could not fetch Google Calendar busy times: {e}")
    
    # Generate available slots from each configured time slot
    slots = []
    slot_interval = timedelta(minutes=30)  # 30-minute intervals
    
    for time_slot in time_slots:
        current_time = time_slot.start_time
        slot_end_limit = time_slot.end_time
        
        while True:
            # Convert time to datetime for calculations
            current_dt = datetime.combine(target_date, current_time)
            slot_end_dt = current_dt + duration
            # Compare using timezone-aware datetimes
            if timezone.is_naive(current_dt):
                current_dt = timezone.make_aware(current_dt, timezone.get_default_timezone())
            if timezone.is_naive(slot_end_dt):
                slot_end_dt = timezone.make_aware(slot_end_dt, timezone.get_default_timezone())
            
            # Check if slot fits within this time slot's bounds
            if slot_end_dt.time() > slot_end_limit:
                break
            
            # Check if slot is blocked
            is_blocked = TimeSlotBlock.objects.filter(
                content_type=ct,
                object_id=provider.id,
                date=target_date,
                start_time__lt=slot_end_dt.time(),
                end_time__gt=current_time
            ).exists()
            
            # Check if slot is already booked
            is_booked = Reservation.objects.filter(
                provider_content_type=ct,
                provider_object_id=provider.id,
                date=target_date,
                time__lt=slot_end_dt.time(),
                time__gte=current_time,
                status__in=['PENDING', 'CONFIRMED']
            ).exists()
            
            # Check if slot conflicts with Google Calendar busy times
            is_google_busy = False
            if google_busy_times:
                for busy in google_busy_times:
                    busy_start = busy.start
                    busy_end = busy.end
                    # Check for overlap (timezone-aware)
                    if current_dt < busy_end and slot_end_dt > busy_start:
                        is_google_busy = True
                        break
            
            slots.append({
                'time': current_time.strftime('%H:%M'),
                'end_time': slot_end_dt.time().strftime('%H:%M'),
                'available': not (is_blocked or is_booked or is_google_busy),
                'google_calendar_busy': is_google_busy if has_google_calendar else None
            })
            
            # Move to next slot interval
            next_dt = current_dt + slot_interval
            current_time = next_dt.time()
            
            if current_time >= slot_end_limit:
                break
    
    serializer = AvailableSlotSerializer(slots, many=True)
    return Response({
        'date': date_str,
        'provider_type': service_type,
        'provider_id': provider.id,
        'has_google_calendar': has_google_calendar,
        'slots': serializer.data
    })


class CombinedServicesViewSet(viewsets.ViewSet):
    """Combined view for all user's services regardless of type"""
    permission_classes = [AllowAny]  # Allow public access for list
    
    def get_permissions(self):
        """Allow anyone to list services; require auth for my-services"""
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def list(self, request):
        """Get services for a specific provider (public endpoint)"""
        from users.models import User
        
        provider_id = request.query_params.get('provider', None)
        if not provider_id:
            return Response({'results': [], 'count': 0})
        
        try:
            user = User.objects.get(id=provider_id)
        except User.DoesNotExist:
            return Response({'results': [], 'count': 0})
        
        services = []
        
        if user.role == 'PLACE':
            try:
                place_services = ServiceInPlace.objects.filter(
                    place=user.place_profile,
                    is_active=True
                ).select_related('service', 'professional')
                
                for svc in place_services:
                    services.append({
                        'id': svc.id,
                        'type': 'place_service',
                        'name': svc.service.name,
                        'description': svc.description or '',
                        'category': svc.service.category.name if svc.service.category else '',
                        'price': float(svc.price),
                        'duration_minutes': int(svc.time.total_seconds() / 60) if svc.time else 0,
                        'is_active': svc.is_active,
                        'professional_assigned': f"{svc.professional.name} {svc.professional.last_name}" if svc.professional else None,
                    })
            except Exception as e:
                print(f"Error fetching place services: {e}")
        
        elif user.role == 'PROFESSIONAL':
            try:
                prof_services = ProfessionalService.objects.filter(
                    professional=user.professional_profile,
                    is_active=True
                ).select_related('service')
                
                for svc in prof_services:
                    services.append({
                        'id': svc.id,
                        'type': 'professional_service',
                        'name': svc.service.name,
                        'description': svc.description or '',
                        'category': svc.service.category.name if svc.service.category else '',
                        'price': float(svc.price),
                        'duration_minutes': int(svc.time.total_seconds() / 60) if svc.time else 0,
                        'is_active': svc.is_active,
                    })
            except Exception as e:
                print(f"Error fetching professional services: {e}")
        
        return Response({'results': services, 'count': len(services)})
    
    @action(detail=False, methods=['get'], url_path='my-services')
    def my_services(self, request):
        """Get all services for the current user"""
        user = request.user
        services = []
        
        if user.role == 'PLACE':
            try:
                place_services = ServiceInPlace.objects.filter(
                    place=user.place_profile
                ).select_related('service', 'professional')
                
                for svc in place_services:
                    services.append({
                        'id': svc.id,
                        'type': 'place_service',
                        'name': svc.service.name,
                        'description': svc.description,
                        'category': svc.service.category.name,
                        'price': float(svc.price),
                        'duration': int(svc.time.total_seconds() / 60) if svc.time else 0,
                        'is_active': svc.is_active,
                        'professional_assigned': f"{svc.professional.name} {svc.professional.last_name}" if svc.professional else None,
                        'created_at': svc.created_at
                    })
            except:
                pass
        
        elif user.role == 'PROFESSIONAL':
            try:
                prof_services = ProfessionalService.objects.filter(
                    professional=user.professional_profile
                ).select_related('service')
                
                for svc in prof_services:
                    services.append({
                        'id': svc.id,
                        'type': 'professional_service',
                        'name': svc.service.name,
                        'description': svc.description,
                        'category': svc.service.category.name,
                        'price': float(svc.price),
                        'duration': int(svc.time.total_seconds() / 60) if svc.time else 0,
                        'is_active': svc.is_active,
                        'created_at': svc.created_at
                    })
            except:
                pass
        
        return Response({'results': services, 'count': len(services)})


# Add the get_available_slots action to CombinedServicesViewSet
CombinedServicesViewSet.get_available_slots = get_available_slots
