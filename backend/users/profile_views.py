from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta, time as dt_time
from .models import ProfessionalProfile, PlaceProfile
from .profile_models import ProfileImage, CustomService, AvailabilitySchedule, TimeSlot, BreakTime
from .profile_serializers import (
    ProfileImageSerializer, CustomServiceSerializer, 
    AvailabilityScheduleSerializer, TimeSlotSerializer
)
import json


def get_profile_instance(user):
    """Get the profile instance based on user role, create if doesn't exist"""
    if user.role == 'PROFESSIONAL':
        profile, created = ProfessionalProfile.objects.get_or_create(
            user=user,
            defaults={
                'name': user.first_name or 'Professional',
                'last_name': user.last_name or 'User'
            }
        )
        # Ensure profile is saved and has an ID
        if not profile.id:
            profile.save()
        return profile
    elif user.role == 'PLACE':
        profile, created = PlaceProfile.objects.get_or_create(
            user=user,
            defaults={
                'name': user.first_name or 'Place',
                'street': 'TBD',
                'postal_code': '00000',
                'owner': user
            }
        )
        # Ensure profile is saved and has an ID
        if not profile.id:
            profile.save()
        return profile
    else:
        return None


def get_content_type_and_id(profile):
    """Get content type and object id for generic foreign key"""
    content_type = ContentType.objects.get_for_model(profile)
    return content_type, profile.id


# ======================
# PROFILE IMAGES
# ======================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def profile_images_view(request):
    """Get or create profile images"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": f"Profile customization only available for professionals and places. Current role: {request.user.role}"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_type, object_id = get_content_type_and_id(profile)
    
    if request.method == 'GET':
        images = ProfileImage.objects.filter(
            content_type=content_type, 
            object_id=object_id,
            is_active=True
        ).order_by('order', 'created_at')
        serializer = ProfileImageSerializer(images, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Handle image upload
        serializer = ProfileImageSerializer(data=request.data)
        if serializer.is_valid():
            # If this is being set as primary, unset any existing primary image
            if serializer.validated_data.get('is_primary', False):
                ProfileImage.objects.filter(
                    content_type=content_type, 
                    object_id=object_id,
                    is_primary=True
                ).update(is_primary=False)
            
            # Set the generic foreign key
            serializer.save(content_type=content_type, object_id=object_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def profile_image_detail_view(request, image_id):
    """Update or delete a specific profile image"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": "Profile customization only available for professionals and places"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_type, object_id = get_content_type_and_id(profile)
    image = get_object_or_404(
        ProfileImage, 
        id=image_id, 
        content_type=content_type, 
        object_id=object_id
    )
    
    if request.method == 'PUT':
        serializer = ProfileImageSerializer(image, data=request.data, partial=True)
        if serializer.is_valid():
            # If this is being set as primary, unset any existing primary image
            if serializer.validated_data.get('is_primary', False):
                ProfileImage.objects.filter(
                    content_type=content_type, 
                    object_id=object_id,
                    is_primary=True
                ).exclude(id=image_id).update(is_primary=False)
            
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ======================
# CUSTOM SERVICES
# ======================

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def custom_services_view(request):
    """Get or create custom services"""
    # For GET requests, allow public access with user filter
    if request.method == 'GET':
        # Check if user_id is provided (for public profile access)
        user_id = request.query_params.get('user')
        
        if user_id:
            # Public access - fetch services for specified user
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                target_user = User.objects.get(id=user_id)
                profile = get_profile_instance(target_user)
                if not profile:
                    return Response([], status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response([], status=status.HTTP_200_OK)
        else:
            # Authenticated access - fetch services for current user
            if not request.user.is_authenticated:
                return Response(
                    {"error": "Authentication required when user parameter is not provided"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            profile = get_profile_instance(request.user)
            if not profile:
                return Response(
                    {"error": f"Profile customization only available for professionals and places. Current role: {request.user.role}"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        content_type, object_id = get_content_type_and_id(profile)
        services = CustomService.objects.filter(
            content_type=content_type, 
            object_id=object_id
        ).order_by('name')
        serializer = CustomServiceSerializer(services, many=True)
        return Response(serializer.data)
    
    # POST requires authentication
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = get_profile_instance(request.user)
        if not profile:
            return Response(
                {"error": f"Profile customization only available for professionals and places. Current role: {request.user.role}"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        content_type, object_id = get_content_type_and_id(profile)
        serializer = CustomServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(content_type=content_type, object_id=object_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def custom_service_detail_view(request, service_id):
    """Update or delete a specific custom service"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": "Profile customization only available for professionals and places"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_type, object_id = get_content_type_and_id(profile)
    service = get_object_or_404(
        CustomService, 
        id=service_id, 
        content_type=content_type, 
        object_id=object_id
    )
    
    if request.method == 'PUT':
        serializer = CustomServiceSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ======================
# AVAILABILITY SCHEDULE
# ======================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def availability_schedule_view(request):
    """Get or update availability schedule - now allows places to manage their own schedules"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": f"Profile customization only available for professionals and places. Current role: {request.user.role}"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Ensure profile has an ID (save if needed)
    if not profile.id:
        profile.save()
    
    content_type, object_id = get_content_type_and_id(profile)
    
    # Validate that we have valid content_type and object_id
    if not content_type or object_id is None:
        return Response(
            {"error": "Could not determine profile type or ID"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if request.method == 'GET':
        schedules = AvailabilitySchedule.objects.filter(
            content_type=content_type, 
            object_id=object_id
        ).order_by('day_of_week')
        serializer = AvailabilityScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Handle bulk update of availability schedule
        data = request.data
        
        # Ensure data is a list
        if not isinstance(data, list):
            return Response(
                {"error": "Expected a list of schedule objects"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Clear existing schedule (this will cascade delete time_slots and breaks)
        AvailabilitySchedule.objects.filter(
            content_type=content_type, 
            object_id=object_id
        ).delete()
        
        # Create new schedule
        created_schedules = []
        for day_data in data:
            # Create the schedule (time_slots will be created automatically by serializer)
            # Pass content_type and object_id via context
            schedule_serializer = AvailabilityScheduleSerializer(
                data=day_data,
                context={'content_type': content_type, 'object_id': object_id}
            )
            if schedule_serializer.is_valid():
                try:
                    schedule = schedule_serializer.save()
                    created_schedules.append(schedule)
                except Exception as e:
                    import traceback
                    print(f"Error creating schedule: {e}")
                    print(traceback.format_exc())
                    return Response(
                        {"error": f"Error creating schedule: {str(e)}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                print(f"Serializer errors: {schedule_serializer.errors}")
                return Response(schedule_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Return the created schedules
        serializer = AvailabilityScheduleSerializer(created_schedules, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_availability_view(request):
    """Get availability for a specific provider (public access for viewing)"""
    provider_type = request.query_params.get('provider_type')
    provider_id = request.query_params.get('provider_id')
    
    if not provider_type or not provider_id:
        return Response(
            {"error": "provider_type and provider_id are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        if provider_type == 'professional':
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
            provider = get_object_or_404(ProfessionalProfile, id=provider_id)
        elif provider_type == 'place':
            ct = ContentType.objects.get_for_model(PlaceProfile)
            provider = get_object_or_404(PlaceProfile, id=provider_id)
        else:
            return Response(
                {"error": "provider_type must be 'professional' or 'place'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        schedules = AvailabilitySchedule.objects.filter(
            content_type=ct,
            object_id=provider_id
        ).order_by('day_of_week')
        
        serializer = AvailabilityScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def available_slots_view(request):
    """Get available time slots for a specific date and service, considering existing reservations"""
    provider_type = request.query_params.get('provider_type')
    provider_id = request.query_params.get('provider_id')
    date_str = request.query_params.get('date')
    service_id = request.query_params.get('service_id')  # Optional: for service duration validation
    
    if not provider_type or not provider_id or not date_str:
        return Response(
            {"error": "provider_type, provider_id, and date are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Parse date
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        day_of_week = target_date.weekday()  # 0 = Monday, 6 = Sunday
        
        # Get content type
        if provider_type == 'professional':
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
            provider = get_object_or_404(ProfessionalProfile, id=provider_id)
        elif provider_type == 'place':
            ct = ContentType.objects.get_for_model(PlaceProfile)
            provider = get_object_or_404(PlaceProfile, id=provider_id)
        else:
            return Response(
                {"error": "provider_type must be 'professional' or 'place'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get availability schedule for this day
        schedule = AvailabilitySchedule.objects.filter(
            content_type=ct,
            object_id=provider_id,
            day_of_week=day_of_week,
            is_available=True
        ).first()
        
        if not schedule:
            return Response({"available_slots": []})
        
        # Get time slots for this schedule
        time_slots = TimeSlot.objects.filter(
            schedule=schedule,
            is_active=True
        ).order_by('start_time')
        
        # Get service duration if service_id provided
        service_duration = None
        if service_id:
            try:
                from .profile_models import CustomService
                # CustomService uses GenericForeignKey, so we need to filter by content_type and object_id
                service = CustomService.objects.get(
                    id=service_id,
                    content_type=ct,
                    object_id=provider_id
                )
                service_duration = service.duration_minutes
            except:
                pass
        
        # Get existing reservations for this date and provider
        from reservations.models import Reservation
        existing_reservations = Reservation.objects.filter(
            provider_content_type=ct,
            provider_object_id=provider_id,
            date=target_date,
            status__in=['PENDING', 'CONFIRMED']
        )
        
        # Format available slots, excluding blocked times
        available_slots = []
        for slot in time_slots:
            slot_start = datetime.combine(target_date, slot.start_time)
            slot_end = datetime.combine(target_date, slot.end_time)
            slot_duration = (slot_end - slot_start).total_seconds() / 60  # minutes
            
            # If service duration is provided, check if it fits
            if service_duration and service_duration > slot_duration:
                continue
            
            # Check if slot conflicts with existing reservations
            slot_available = True
            for reservation in existing_reservations:
                res_start = datetime.combine(target_date, reservation.time)
                res_end = res_start + (reservation.duration or timedelta(minutes=30))
                
                # Check for overlap
                if not (slot_end <= res_start or slot_start >= res_end):
                    slot_available = False
                    break
            
            if slot_available:
                available_slots.append({
                    'start_time': slot.start_time.strftime('%H:%M'),
                    'end_time': slot.end_time.strftime('%H:%M'),
                    'duration_minutes': int(slot_duration)
                })
        
        return Response({
            'date': date_str,
            'day_of_week': day_of_week,
            'available_slots': available_slots
        })
    except ValueError:
        return Response(
            {"error": "Invalid date format. Use YYYY-MM-DD"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ======================
# COMBINED PROFILE CUSTOMIZATION
# ======================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_customization_view(request):
    """Get all profile customization data"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": f"Profile customization only available for professionals and places. Current role: {request.user.role}"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_type, object_id = get_content_type_and_id(profile)
    
    # Get all data
    images = ProfileImage.objects.filter(
        content_type=content_type, 
        object_id=object_id,
        is_active=True
    ).order_by('order', 'created_at')
    
    services = CustomService.objects.filter(
        content_type=content_type, 
        object_id=object_id
    ).order_by('name')
    
    schedules = AvailabilitySchedule.objects.filter(
        content_type=content_type, 
        object_id=object_id
    ).order_by('day_of_week')
    
    # Serialize data
    images_data = ProfileImageSerializer(images, many=True).data
    services_data = CustomServiceSerializer(services, many=True).data
    schedules_data = AvailabilityScheduleSerializer(schedules, many=True).data
    
    return Response({
        'images': images_data,
        'services': services_data,
        'availability': schedules_data
    })














