from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
import json
from .profile_models import (
    PlaceProfessionalLink,
    LinkedAvailabilitySchedule,
    LinkedTimeSlot,
)
from .models import User, ProfessionalProfile, PlaceProfile, PublicProfile
from .profile_serializers import (
    PlaceProfessionalLinkSerializer,
    LinkedAvailabilityScheduleSerializer,
    LinkedTimeSlotSerializer,
)
from notifications.signals import create_system_notification


class PlaceProfessionalLinkViewSet(viewsets.ModelViewSet):
    """Manage links between places and professionals, including per-link schedules."""
    
    queryset = PlaceProfessionalLink.objects.select_related(
        'place__user', 'professional__user', 'invited_by'
    ).all()
    serializer_class = PlaceProfessionalLinkSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        place_id = self.request.query_params.get('place_id')
        professional_user_id = self.request.query_params.get('professional_id')
        
        # Public filtering by professional (by professional.user_id) or place
        # This is used for public profile pages (no auth required)
        if not user.is_authenticated:
            if place_id:
                filtered = qs.filter(place_id=place_id)
                filtered = filtered.filter(status=status_param or PlaceProfessionalLink.Status.ACCEPTED)
                return filtered
            if professional_user_id:
                filtered = qs.filter(professional__user_id=professional_user_id)
                filtered = filtered.filter(status=status_param or PlaceProfessionalLink.Status.ACCEPTED)
                return filtered
            return PlaceProfessionalLink.objects.none()

        # For authenticated users, allow explicit professional_user_id filtering as well.
        # This is primarily for read-only public profile views.
        if professional_user_id:
            qs = qs.filter(professional__user_id=professional_user_id)
            if status_param:
                qs = qs.filter(status=status_param)
            return qs

        if user.is_staff:
            pass  # full access
        elif user.role == User.Role.PLACE and hasattr(user, 'place_profile'):
            # Only links for this place (optionally filtered by place_id)
            qs = qs.filter(place=user.place_profile)
            if place_id:
                qs = qs.filter(place_id=place_id)
        elif user.role == User.Role.PROFESSIONAL and hasattr(user, 'professional_profile'):
            # Only links for this professional
            qs = qs.filter(professional=user.professional_profile)
        else:
            # No access for clients
            return PlaceProfessionalLink.objects.none()
        
        if status_param:
            qs = qs.filter(status=status_param)
        
        return qs
    
    def create(self, request, *args, **kwargs):
        """Invite a professional to a place. Only PLACE owner can invite."""
        user = request.user
        if user.role != User.Role.PLACE or not hasattr(user, 'place_profile'):
            return Response({'detail': 'Only place users can invite professionals'}, status=status.HTTP_403_FORBIDDEN)
        
        place_id = request.data.get('place_id') or request.data.get('place')
        professional_id = request.data.get('professional_id') or request.data.get('professional')
        notes = request.data.get('notes', '')
        if not place_id or not professional_id:
            return Response({'detail': 'place_id and professional_id are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        place = get_object_or_404(PlaceProfile, id=place_id)
        if place.user_id != user.id and (place.owner_id and place.owner_id != user.id):
            return Response({'detail': 'Not authorized to manage this place'}, status=status.HTTP_403_FORBIDDEN)
        
        professional = get_object_or_404(ProfessionalProfile, id=professional_id)
        
        # Get categories from PublicProfile (where they are actually edited and stored)
        try:
            place_public_profile = place.user.public_profile
            place_categories = place_public_profile.category if isinstance(place_public_profile.category, list) else ([place_public_profile.category] if place_public_profile.category else [])
        except PublicProfile.DoesNotExist:
            # Fallback to PlaceProfile category if PublicProfile doesn't exist
            place_categories = place.category if isinstance(place.category, list) else ([place.category] if place.category else [])
        
        try:
            professional_public_profile = professional.user.public_profile
            professional_categories = professional_public_profile.category if isinstance(professional_public_profile.category, list) else ([professional_public_profile.category] if professional_public_profile.category else [])
        except PublicProfile.DoesNotExist:
            # Fallback to ProfessionalProfile category if PublicProfile doesn't exist
            professional_categories = professional.category if isinstance(professional.category, list) else ([professional.category] if professional.category else [])
        
        # Handle case where category might be a stringified JSON array (from migration issues)
        def normalize_category_list(categories):
            """Normalize category list, handling stringified JSON arrays"""
            if not categories:
                return []
            result = []
            for cat in categories:
                if isinstance(cat, str):
                    # Check if it's a stringified JSON array
                    if cat.strip().startswith('[') and cat.strip().endswith(']'):
                        try:
                            parsed = json.loads(cat)
                            if isinstance(parsed, list):
                                result.extend(parsed)
                            else:
                                result.append(cat)
                        except (json.JSONDecodeError, ValueError):
                            result.append(cat)
                    else:
                        result.append(cat)
                else:
                    result.append(cat)
            return result
        
        place_categories = normalize_category_list(place_categories)
        professional_categories = normalize_category_list(professional_categories)
        
        # Normalize categories to strings for comparison
        place_categories = [str(cat).strip().lower() for cat in place_categories if cat]
        professional_categories = [str(cat).strip().lower() for cat in professional_categories if cat]
        
        # Check if there's any intersection
        common_categories = set(place_categories) & set(professional_categories)
        
        if not common_categories:
            return Response({
                'detail': 'No se puede enviar la invitación. El establecimiento y el profesional deben tener al menos una categoría principal en común.',
                'place_categories': place_categories,
                'professional_categories': professional_categories
            }, status=status.HTTP_400_BAD_REQUEST)
        
        link, created = PlaceProfessionalLink.objects.get_or_create(
            place=place, professional=professional,
            defaults={'status': PlaceProfessionalLink.Status.INVITED, 'invited_by': user, 'notes': notes}
        )
        if not created:
            # If previously removed or rejected, re-invite by setting status back to INVITED
            link.status = PlaceProfessionalLink.Status.INVITED
            link.invited_by = user
            link.notes = notes
            link.save(update_fields=['status', 'invited_by', 'notes', 'updated_at'])

        # Create notifications for both parties
        try:
            # To invited professional
            create_system_notification(
                professional.user,
                title="Invitación a establecimiento",
                message=f"{place.name} te invitó a vincularte como profesional.",
                metadata={
                    'link_id': link.id,
                    'status': link.status,
                    'place_id': place.id,
                    'place_name': getattr(place, 'name', ''),
                    'professional_id': professional.id,
                    'professional_name': getattr(professional, 'name', ''),
                    'invited_by_email': user.email,
                },
            )
            # Confirmation to place
            create_system_notification(
                place.user,
                title="Invitación enviada",
                message=f"Se envió una invitación a {getattr(professional, 'name', '')}.",
                metadata={
                    'link_id': link.id,
                    'status': link.status,
                    'place_id': place.id,
                    'place_name': getattr(place, 'name', ''),
                    'professional_id': professional.id,
                    'professional_name': getattr(professional, 'name', ''),
                    'invited_by_email': user.email,
                },
            )
        except Exception:
            # Notifications should not break the flow
            pass
        
        return Response(self.get_serializer(link).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        """Soft remove a link (status=REMOVED). Only place owner can do this."""
        instance: PlaceProfessionalLink = self.get_object()
        user = request.user
        if user.role != User.Role.PLACE or instance.place.user_id != user.id and (instance.place.owner_id and instance.place.owner_id != user.id):
            return Response({'detail': 'Not authorized to remove this link'}, status=status.HTTP_403_FORBIDDEN)
        instance.status = PlaceProfessionalLink.Status.REMOVED
        instance.save(update_fields=['status', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Professional accepts an invite."""
        link: PlaceProfessionalLink = self.get_object()
        user = request.user
        if user.role != User.Role.PROFESSIONAL:
            return Response({'detail': 'Only the invited professional can accept'}, status=status.HTTP_403_FORBIDDEN)

        # Ensure the professional profile exists for this user
        profile_id = getattr(user, 'professional_profile_id', None)
        if profile_id is None:
            defaults = {
                'name': user.first_name or user.username or user.email.split('@')[0],
                'last_name': user.last_name or '',
                'bio': '',
                'city': '',
                'category': '',
                'sub_categories': [],
            }
            professional_profile, _created = ProfessionalProfile.objects.get_or_create(user=user, defaults=defaults)
            profile_id = professional_profile.id

        if profile_id != link.professional_id:
            return Response({'detail': 'Only the invited professional can accept'}, status=status.HTTP_403_FORBIDDEN)
        if link.status != PlaceProfessionalLink.Status.INVITED:
            return Response({'detail': f'Cannot accept link in status {link.status}'}, status=status.HTTP_400_BAD_REQUEST)
        link.status = PlaceProfessionalLink.Status.ACCEPTED
        link.save(update_fields=['status', 'updated_at'])

        # Notify both parties
        try:
            create_system_notification(
                link.place.user,
                title="Invitación aceptada",
                message=f"{getattr(link.professional, 'name', '')} aceptó tu invitación.",
                metadata={
                    'link_id': link.id,
                    'status': link.status,
                    'place_id': link.place.id,
                    'place_name': getattr(link.place, 'name', ''),
                    'professional_id': link.professional.id,
                    'professional_name': getattr(link.professional, 'name', ''),
                },
            )
            create_system_notification(
                link.professional.user,
                title="Vinculación confirmada",
                message=f"Ahora estás vinculado con {getattr(link.place, 'name', '')}.",
                metadata={
                    'link_id': link.id,
                    'status': link.status,
                    'place_id': link.place.id,
                    'place_name': getattr(link.place, 'name', ''),
                    'professional_id': link.professional.id,
                    'professional_name': getattr(link.professional, 'name', ''),
                },
            )
        except Exception:
            pass
        return Response(self.get_serializer(link).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Professional rejects an invite."""
        link: PlaceProfessionalLink = self.get_object()
        user = request.user
        if user.role != User.Role.PROFESSIONAL:
            return Response({'detail': 'Only the invited professional can reject'}, status=status.HTTP_403_FORBIDDEN)

        profile_id = getattr(user, 'professional_profile_id', None)
        if profile_id is None:
            defaults = {
                'name': user.first_name or user.username or user.email.split('@')[0],
                'last_name': user.last_name or '',
                'bio': '',
                'city': '',
                'category': '',
                'sub_categories': [],
            }
            professional_profile, _created = ProfessionalProfile.objects.get_or_create(user=user, defaults=defaults)
            profile_id = professional_profile.id

        if profile_id != link.professional_id:
            return Response({'detail': 'Only the invited professional can reject'}, status=status.HTTP_403_FORBIDDEN)
        if link.status != PlaceProfessionalLink.Status.INVITED:
            return Response({'detail': f'Cannot reject link in status {link.status}'}, status=status.HTTP_400_BAD_REQUEST)
        link.status = PlaceProfessionalLink.Status.REJECTED
        link.save(update_fields=['status', 'updated_at'])

        # Notify both parties
        try:
            create_system_notification(
                link.place.user,
                title="Invitación rechazada",
                message=f"{getattr(link.professional, 'name', '')} rechazó tu invitación.",
                metadata={
                    'link_id': link.id,
                    'status': link.status,
                    'place_id': link.place.id,
                    'place_name': getattr(link.place, 'name', ''),
                    'professional_id': link.professional.id,
                    'professional_name': getattr(link.professional, 'name', ''),
                },
            )
            create_system_notification(
                link.professional.user,
                title="Invitación rechazada",
                message=f"Has rechazado la invitación de {getattr(link.place, 'name', '')}.",
                metadata={
                    'link_id': link.id,
                    'status': link.status,
                    'place_id': link.place.id,
                    'place_name': getattr(link.place, 'name', ''),
                    'professional_id': link.professional.id,
                    'professional_name': getattr(link.professional, 'name', ''),
                },
            )
        except Exception:
            pass
        return Response(self.get_serializer(link).data)
    
    @action(detail=True, methods=['get', 'post'], url_path='schedule')
    def schedule(self, request, pk=None):
        """Get or set schedule for a specific link. Professionals can now manage their own linked schedules."""
        link: PlaceProfessionalLink = self.get_object()
        user = request.user
        
        # Permissions: place owner can write; place/pro (accepted) can read and write
        profile_id = getattr(user, 'professional_profile_id', None)
        if profile_id is None and user.role == User.Role.PROFESSIONAL:
            defaults = {
                'name': user.first_name or user.username or user.email.split('@')[0],
                'last_name': user.last_name or '',
                'bio': '',
                'city': '',
                'category': '',
                'sub_categories': [],
            }
            professional_profile, _created = ProfessionalProfile.objects.get_or_create(user=user, defaults=defaults)
            profile_id = professional_profile.id

        # Place owner can always write
        place_can_write = user.role == User.Role.PLACE and (link.place.user_id == user.id or (link.place.owner_id and link.place.owner_id == user.id))
        # Professional can write their own linked schedule
        professional_can_write = user.role == User.Role.PROFESSIONAL and profile_id == link.professional_id
        can_write = place_can_write or professional_can_write
        can_read = can_write or (user.role == User.Role.PROFESSIONAL and profile_id == link.professional_id)
        
        if request.method == 'GET':
            if not can_read:
                return Response({'detail': 'Not authorized to view this schedule'}, status=status.HTTP_403_FORBIDDEN)
            schedules = LinkedAvailabilitySchedule.objects.filter(link=link).order_by('day_of_week')
            data = LinkedAvailabilityScheduleSerializer(schedules, many=True).data
            return Response(data)
        
        # POST - bulk replace
        if not can_write:
            return Response({'detail': 'Not authorized to modify this schedule'}, status=status.HTTP_403_FORBIDDEN)
        
        if link.status != PlaceProfessionalLink.Status.ACCEPTED:
            return Response({'detail': 'Schedule can only be set for accepted links'}, status=status.HTTP_400_BAD_REQUEST)
        
        items = request.data if isinstance(request.data, list) else []
        # Clear existing
        LinkedAvailabilitySchedule.objects.filter(link=link).delete()
        
        created_schedules = []
        for item in items:
            day = item.get('day_of_week')
            is_available = item.get('is_available', False)
            time_slots = item.get('time_slots', [])
            sched = LinkedAvailabilitySchedule.objects.create(link=link, day_of_week=day, is_available=is_available)
            created_schedules.append(sched)
            for slot in time_slots:
                LinkedTimeSlot.objects.create(
                    schedule=sched,
                    start_time=slot.get('start_time'),
                    end_time=slot.get('end_time'),
                    is_active=slot.get('is_active', True)
                )
        
        return Response(LinkedAvailabilityScheduleSerializer(created_schedules, many=True).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='place-schedules')
    def place_schedules(self, request):
        """Get all schedules for a place (including linked professionals)"""
        place_id = request.query_params.get('place_id')
        if not place_id:
            return Response({'detail': 'place_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            place = PlaceProfile.objects.get(id=place_id)
        except PlaceProfile.DoesNotExist:
            return Response({'detail': 'Place not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get place's own schedule
        from django.contrib.contenttypes.models import ContentType
        from .profile_models import AvailabilitySchedule, TimeSlot
        ct = ContentType.objects.get_for_model(PlaceProfile)
        place_schedules = AvailabilitySchedule.objects.filter(
            content_type=ct,
            object_id=place_id
        ).order_by('day_of_week')
        
        place_schedule_data = []
        for schedule in place_schedules:
            slots = TimeSlot.objects.filter(schedule=schedule, is_active=True).order_by('start_time')
            place_schedule_data.append({
                'day_of_week': schedule.day_of_week,
                'day_name': schedule.get_day_of_week_display(),
                'is_available': schedule.is_available,
                'time_slots': [
                    {
                        'start_time': slot.start_time.strftime('%H:%M'),
                        'end_time': slot.end_time.strftime('%H:%M')
                    }
                    for slot in slots
                ]
            })
        
        # Get linked professionals' schedules
        links = PlaceProfessionalLink.objects.filter(
            place=place,
            status=PlaceProfessionalLink.Status.ACCEPTED
        )
        
        linked_schedules = []
        for link in links:
            prof_schedules = LinkedAvailabilitySchedule.objects.filter(link=link).order_by('day_of_week')
            prof_schedule_data = []
            for schedule in prof_schedules:
                slots = LinkedTimeSlot.objects.filter(schedule=schedule, is_active=True).order_by('start_time')
                prof_schedule_data.append({
                    'day_of_week': schedule.day_of_week,
                    'day_name': schedule.get_day_of_week_display(),
                    'is_available': schedule.is_available,
                    'time_slots': [
                        {
                            'start_time': slot.start_time.strftime('%H:%M'),
                            'end_time': slot.end_time.strftime('%H:%M')
                        }
                        for slot in slots
                    ]
                })
            
            linked_schedules.append({
                'professional_id': link.professional_id,
                'professional_name': f"{link.professional.name} {link.professional.last_name}".strip(),
                'schedules': prof_schedule_data
            })
        
        return Response({
            'place_schedules': place_schedule_data,
            'linked_professionals': linked_schedules
        })


