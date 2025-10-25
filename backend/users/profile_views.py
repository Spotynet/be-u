from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from .models import ProfessionalProfile, PlaceProfile
from .profile_models import ProfileImage, CustomService, AvailabilitySchedule, TimeSlot
from .profile_serializers import (
    ProfileImageSerializer, CustomServiceSerializer, 
    AvailabilityScheduleSerializer, TimeSlotSerializer
)
import json


def get_profile_instance(user):
    """Get the profile instance based on user role"""
    if user.role == 'PROFESSIONAL':
        return get_object_or_404(ProfessionalProfile, user=user)
    elif user.role == 'PLACE':
        return get_object_or_404(PlaceProfile, user=user)
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
def profile_images_view(request):
    """Get or create profile images"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": "Profile customization only available for professionals and places"}, 
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
@permission_classes([IsAuthenticated])
def custom_services_view(request):
    """Get or create custom services"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": "Profile customization only available for professionals and places"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_type, object_id = get_content_type_and_id(profile)
    
    if request.method == 'GET':
        services = CustomService.objects.filter(
            content_type=content_type, 
            object_id=object_id
        ).order_by('name')
        serializer = CustomServiceSerializer(services, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
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
    """Get or update availability schedule"""
    profile = get_profile_instance(request.user)
    if not profile:
        return Response(
            {"error": "Profile customization only available for professionals and places"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_type, object_id = get_content_type_and_id(profile)
    
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
        
        # Clear existing schedule
        AvailabilitySchedule.objects.filter(
            content_type=content_type, 
            object_id=object_id
        ).delete()
        
        # Create new schedule
        created_schedules = []
        for day_data in data:
            day_data['content_type'] = content_type.id
            day_data['object_id'] = object_id
            
            # Create the schedule
            schedule_serializer = AvailabilityScheduleSerializer(data=day_data)
            if schedule_serializer.is_valid():
                schedule = schedule_serializer.save()
                created_schedules.append(schedule)
                
                # Create time slots if provided
                time_slots_data = day_data.get('time_slots', [])
                for slot_data in time_slots_data:
                    slot_data['schedule'] = schedule.id
                    slot_serializer = TimeSlotSerializer(data=slot_data)
                    if slot_serializer.is_valid():
                        slot_serializer.save()
            else:
                return Response(schedule_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Return the created schedules
        serializer = AvailabilityScheduleSerializer(created_schedules, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
            {"error": "Profile customization only available for professionals and places"}, 
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












