from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .profile_models import (
    PlaceProfessionalLink,
    LinkedAvailabilitySchedule,
    LinkedTimeSlot,
)
from .models import User, ProfessionalProfile, PlaceProfile
from .profile_serializers import (
    PlaceProfessionalLinkSerializer,
    LinkedAvailabilityScheduleSerializer,
    LinkedTimeSlotSerializer,
)


class PlaceProfessionalLinkViewSet(viewsets.ModelViewSet):
    """Manage links between places and professionals, including per-link schedules."""
    
    queryset = PlaceProfessionalLink.objects.select_related(
        'place__user', 'professional__user', 'invited_by'
    ).all()
    serializer_class = PlaceProfessionalLinkSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        place_id = self.request.query_params.get('place_id')
        
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
        if user.role != User.Role.PROFESSIONAL or not hasattr(user, 'professional_profile') or user.professional_profile_id != link.professional_id:
            return Response({'detail': 'Only the invited professional can accept'}, status=status.HTTP_403_FORBIDDEN)
        if link.status != PlaceProfessionalLink.Status.INVITED:
            return Response({'detail': f'Cannot accept link in status {link.status}'}, status=status.HTTP_400_BAD_REQUEST)
        link.status = PlaceProfessionalLink.Status.ACCEPTED
        link.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(link).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Professional rejects an invite."""
        link: PlaceProfessionalLink = self.get_object()
        user = request.user
        if user.role != User.Role.PROFESSIONAL or not hasattr(user, 'professional_profile') or user.professional_profile_id != link.professional_id:
            return Response({'detail': 'Only the invited professional can reject'}, status=status.HTTP_403_FORBIDDEN)
        if link.status != PlaceProfessionalLink.Status.INVITED:
            return Response({'detail': f'Cannot reject link in status {link.status}'}, status=status.HTTP_400_BAD_REQUEST)
        link.status = PlaceProfessionalLink.Status.REJECTED
        link.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(link).data)
    
    @action(detail=True, methods=['get', 'post'], url_path='schedule')
    def schedule(self, request, pk=None):
        """Get or set schedule for a specific link."""
        link: PlaceProfessionalLink = self.get_object()
        user = request.user
        
        # Permissions: place owner can write; place/pro (accepted) can read
        can_write = user.role == User.Role.PLACE and (link.place.user_id == user.id or (link.place.owner_id and link.place.owner_id == user.id))
        can_read = can_write or (user.role == User.Role.PROFESSIONAL and hasattr(user, 'professional_profile') and user.professional_profile_id == link.professional_id)
        
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


