from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.contenttypes.models import ContentType
from datetime import datetime, timedelta, time as dt_time
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
from users.models import ProfessionalProfile, PlaceProfile


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
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on query parameters
        place_id = self.request.query_params.get('place', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if place_id:
            queryset = queryset.filter(place_id=place_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == 'true')
        
        # For PLACE users, only show their own services
        if user.role == 'PLACE':
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
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on query parameters
        professional_id = self.request.query_params.get('professional', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == 'true')
        
        # For PROFESSIONAL users, only show their own services
        if user.role == 'PROFESSIONAL':
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
    
    # Get provider's availability for this day
    availability = ProviderAvailability.objects.filter(
        content_type=ct,
        object_id=provider.id,
        day_of_week=day_of_week,
        is_active=True
    ).first()
    
    if not availability:
        return Response(
            {"error": "Provider is not available on this day", "slots": []},
            status=status.HTTP_200_OK
        )
    
    # Generate time slots
    slots = []
    current_time = availability.start_time
    end_time = availability.end_time
    slot_duration = timedelta(minutes=30)  # 30-minute slots
    
    while True:
        # Convert time to datetime for calculations
        current_dt = datetime.combine(target_date, current_time)
        slot_end_dt = current_dt + duration
        
        # Check if slot fits within availability
        if slot_end_dt.time() > end_time:
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
        
        slots.append({
            'time': current_time.strftime('%H:%M'),
            'end_time': slot_end_dt.time().strftime('%H:%M'),
            'available': not (is_blocked or is_booked)
        })
        
        # Move to next slot
        next_dt = current_dt + slot_duration
        current_time = next_dt.time()
        
        if current_time >= end_time:
            break
    
    serializer = AvailableSlotSerializer(slots, many=True)
    return Response({
        'date': date_str,
        'provider_type': service_type,
        'provider_id': provider.id,
        'slots': serializer.data
    })


class CombinedServicesViewSet(viewsets.ViewSet):
    """Combined view for all user's services regardless of type"""
    permission_classes = [IsAuthenticated]
    
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
