import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Reservation
from .serializers import (
    ReservationSerializer, ReservationCreateSerializer,
    ReservationUpdateSerializer, ReservationListSerializer
)
from .permissions import IsReservationClient, IsReservationProvider, CanViewReservation
from users.models import ProfessionalProfile, PlaceProfile
from services.models import TimeSlotBlock

# Google Calendar integration
from calendar_integration.event_helpers import (
    create_reservation_event,
    delete_reservation_event,
)

logger = logging.getLogger(__name__)


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reservations"""
    queryset = Reservation.objects.select_related(
        'client__user', 'service', 'professional', 'place'
    ).all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReservationUpdateSerializer
        elif self.action == 'list':
            return ReservationListSerializer
        return ReservationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Role-based filtering
        if user.role == 'CLIENT':
            # Clients see their own reservations
            try:
                queryset = queryset.filter(client=user.client_profile)
            except:
                queryset = queryset.none()
        
        elif user.role == 'PROFESSIONAL':
            # Professionals see reservations for their services
            try:
                ct = ContentType.objects.get_for_model(ProfessionalProfile)
                queryset = queryset.filter(
                    provider_content_type=ct,
                    provider_object_id=user.professional_profile.id
                )
            except:
                queryset = queryset.none()
        
        elif user.role == 'PLACE':
            # Places see all reservations for their location
            try:
                ct = ContentType.objects.get_for_model(PlaceProfile)
                queryset = queryset.filter(
                    provider_content_type=ct,
                    provider_object_id=user.place_profile.id
                )
            except:
                queryset = queryset.none()
        
        return queryset.order_by('-date', '-time')
    
    def perform_create(self, serializer):
        serializer.save()
        
        # Create time slot block for the booked time
        reservation = serializer.instance
        ct = reservation.provider_content_type
        provider_id = reservation.provider_object_id
        
        if reservation.duration:
            start_datetime = datetime.combine(reservation.date, reservation.time)
            end_datetime = start_datetime + reservation.duration
            
            TimeSlotBlock.objects.create(
                content_type=ct,
                object_id=provider_id,
                date=reservation.date,
                start_time=reservation.time,
                end_time=end_datetime.time(),
                reason='BOOKED',
                notes=f"Reservation {reservation.code}"
            )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        reservation = serializer.instance

        calendar_event = None
        try:
            calendar_event = create_reservation_event(reservation)
        except Exception as e:
            logger.error(f"Failed to create calendar event on reservation creation: {e}")

        response_serializer = ReservationSerializer(
            reservation, context=self.get_serializer_context()
        )
        data = response_serializer.data
        if calendar_event:
            data['calendar_event_created'] = True
            data['calendar_event_link'] = calendar_event.event_link
            data['calendar_event_id'] = calendar_event.google_event_id

        headers = self.get_success_headers(response_serializer.data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'], url_path='my-reservations')
    def my_reservations(self, request):
        """Get client's reservations"""
        if request.user.role != 'CLIENT':
            return Response(
                {"error": "Only clients can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            client = request.user.client_profile
            reservations = self.get_queryset().filter(client=client)
            
            # Filter by upcoming or past
            filter_type = request.query_params.get('filter', 'upcoming')
            today = datetime.now().date()
            
            if filter_type == 'upcoming':
                reservations = reservations.filter(
                    Q(date__gt=today) | Q(date=today, time__gte=datetime.now().time())
                ).filter(status__in=['PENDING', 'CONFIRMED'])
            elif filter_type == 'past':
                reservations = reservations.filter(
                    Q(date__lt=today) | Q(date=today, time__lt=datetime.now().time())
                ) | reservations.filter(status__in=['COMPLETED', 'CANCELLED', 'REJECTED'])
            
            serializer = ReservationSerializer(reservations, many=True)
            return Response({
                'results': serializer.data,
                'count': reservations.count()
            })
        except:
            return Response(
                {"error": "Client profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='incoming')
    def incoming_reservations(self, request):
        """Get incoming reservations for providers"""
        if request.user.role not in ['PROFESSIONAL', 'PLACE']:
            return Response(
                {"error": "Only providers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reservations = self.get_queryset()
        
        # Filter by status (default to pending)
        status_filter = request.query_params.get('status', 'PENDING')
        if status_filter:
            reservations = reservations.filter(status=status_filter.upper())
        
        serializer = ReservationSerializer(reservations, many=True)
        return Response({
            'results': serializer.data,
            'count': reservations.count()
        })
    
    @action(detail=False, methods=['get'], url_path='calendar')
    def calendar_view(self, request):
        """Get reservations in calendar format"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservations = self.get_queryset().filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Group by date
        calendar_data = {}
        for reservation in reservations:
            date_key = reservation.date.strftime('%Y-%m-%d')
            if date_key not in calendar_data:
                calendar_data[date_key] = []
            
            calendar_data[date_key].append({
                'id': reservation.id,
                'code': reservation.code,
                'service': reservation.service.name,
                'time': reservation.time.strftime('%H:%M'),
                'status': reservation.status,
                'client_name': f"{reservation.client.user.first_name} {reservation.client.user.last_name}",
            })
        
        return Response(calendar_data)
    
    @action(detail=True, methods=['patch'], url_path='confirm')
    def confirm_reservation(self, request, pk=None):
        """Confirm a pending reservation (provider only)"""
        reservation = self.get_object()
        
        # Check permission
        if reservation.provider.user != request.user:
            return Response(
                {"error": "You don't have permission to confirm this reservation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.status != 'PENDING':
            return Response(
                {"error": f"Cannot confirm reservation with status {reservation.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'CONFIRMED'
        reservation.save()
        
        # Create Google Calendar event if provider has calendar connected
        calendar_event = getattr(reservation, 'calendar_event', None)
        if not calendar_event:
        try:
            calendar_event = create_reservation_event(reservation)
        except Exception as e:
            # Log but don't fail the confirmation
                logger.error(f"Failed to create calendar event: {e}")
        
        serializer = ReservationSerializer(reservation)
        response_data = {
            'message': 'Reservation confirmed successfully',
            'reservation': serializer.data
        }
        if calendar_event:
            response_data['calendar_event_created'] = True
            response_data['calendar_event_link'] = calendar_event.event_link
            response_data['calendar_event_id'] = calendar_event.google_event_id
        
        return Response(response_data)
    
    @action(detail=True, methods=['patch'], url_path='reject')
    def reject_reservation(self, request, pk=None):
        """Reject a pending reservation (provider only)"""
        reservation = self.get_object()
        
        # Check permission
        if reservation.provider.user != request.user:
            return Response(
                {"error": "You don't have permission to reject this reservation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.status != 'PENDING':
            return Response(
                {"error": f"Cannot reject reservation with status {reservation.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        reservation.status = 'REJECTED'
        reservation.rejection_reason = reason
        reservation.save()
        
        # Remove the time slot block
        ct = reservation.provider_content_type
        TimeSlotBlock.objects.filter(
            content_type=ct,
            object_id=reservation.provider_object_id,
            date=reservation.date,
            start_time=reservation.time,
            reason='BOOKED',
            notes__contains=reservation.code
        ).delete()
        
        # Delete Google Calendar event if exists
        try:
            delete_reservation_event(reservation)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to delete calendar event: {e}")
        
        serializer = ReservationSerializer(reservation)
        return Response({
            'message': 'Reservation rejected',
            'reservation': serializer.data
        })
    
    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel_reservation(self, request, pk=None):
        """Cancel a reservation (client only)"""
        reservation = self.get_object()
        
        # Check permission - only client can cancel
        if reservation.client.user != request.user:
            return Response(
                {"error": "You don't have permission to cancel this reservation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.status not in ['PENDING', 'CONFIRMED']:
            return Response(
                {"error": f"Cannot cancel reservation with status {reservation.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        reservation.status = 'CANCELLED'
        reservation.cancellation_reason = reason
        reservation.save()
        
        # Remove the time slot block
        ct = reservation.provider_content_type
        TimeSlotBlock.objects.filter(
            content_type=ct,
            object_id=reservation.provider_object_id,
            date=reservation.date,
            start_time=reservation.time,
            reason='BOOKED',
            notes__contains=reservation.code
        ).delete()
        
        # Delete Google Calendar event if exists
        try:
            delete_reservation_event(reservation)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to delete calendar event: {e}")
        
        serializer = ReservationSerializer(reservation)
        return Response({
            'message': 'Reservation cancelled',
            'reservation': serializer.data
        })
    
    @action(detail=True, methods=['patch'], url_path='complete')
    def complete_reservation(self, request, pk=None):
        """Mark reservation as complete (provider only)"""
        reservation = self.get_object()
        
        # Check permission
        if reservation.provider.user != request.user:
            return Response(
                {"error": "You don't have permission to complete this reservation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.status != 'CONFIRMED':
            return Response(
                {"error": "Only confirmed reservations can be marked as complete"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'COMPLETED'
        reservation.save()
        
        serializer = ReservationSerializer(reservation)
        return Response({
            'message': 'Reservation marked as complete',
            'reservation': serializer.data
        })
