import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Reservation, GroupSession, TrackingRequest
from .serializers import (
    ReservationSerializer, ReservationCreateSerializer,
    ReservationUpdateSerializer, ReservationListSerializer, GroupSessionSerializer, TrackingRequestSerializer
)
from .permissions import IsReservationClient, IsReservationProvider, CanViewReservation
from django.http import Http404
from users.models import ProfessionalProfile, PlaceProfile
from services.models import TimeSlotBlock, ProfessionalService, ServiceInPlace
from reservations.availability import check_slot_availability
from users.profile_models import PlaceProfessionalLink

# Google Calendar integration
from calendar_integration.event_helpers import (
    create_reservation_event,
    delete_reservation_event,
)
from notifications.emails import send_reservation_change_email
from notifications.models import Notification
from django.utils import timezone
from django.db import transaction

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
    
    def get_object(self):
        """
        Override to check permissions even if reservation is not in filtered queryset.
        This allows users to access reservations they have permission to view,
        even if they're not in the initial queryset filter.
        """
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        try:
            # Try to get the reservation directly (bypass queryset filter)
            reservation = Reservation.objects.select_related(
                'client__user', 'service', 'professional', 'place'
            ).get(pk=lookup_value)
        except Reservation.DoesNotExist:
            raise Http404("No Reservation matches the given query.")
        
        # Check permissions using CanViewReservation
        permission = CanViewReservation()
        if not permission.has_object_permission(self.request, self, reservation):
            raise Http404("No Reservation matches the given query.")
        
        return reservation
    
    def perform_create(self, serializer):
        serializer.save()
        
        # Create time slot block for the booked time
        reservation = serializer.instance
        if reservation.group_session:
            return
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

        # Note: Calendar event is created when reservation is CONFIRMED, not when created (PENDING)
        # See confirm_reservation() action for calendar event creation

        response_serializer = ReservationSerializer(
            reservation, context=self.get_serializer_context()
        )
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        """Override to return full ReservationSerializer after partial update (date/time/notes)."""
        partial = True
        instance = self.get_object()
        previous_date = instance.date
        previous_time = instance.time
        previous_duration = instance.duration
        previous_notes = instance.notes
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            self.perform_update(serializer)
            reservation = serializer.instance

            date_changed = reservation.date != previous_date
            time_changed = reservation.time != previous_time
            if (
                not reservation.group_session
                and reservation.status in [Reservation.Status.PENDING, Reservation.Status.CONFIRMED]
                and (date_changed or time_changed)
            ):
                # Remove old booked block and create a new one for the rescheduled slot.
                TimeSlotBlock.objects.filter(
                    content_type=reservation.provider_content_type,
                    object_id=reservation.provider_object_id,
                    date=previous_date,
                    start_time=previous_time,
                    reason='BOOKED',
                    notes__contains=reservation.code
                ).delete()

                duration = reservation.duration or previous_duration
                if duration:
                    start_datetime = datetime.combine(reservation.date, reservation.time)
                    end_datetime = start_datetime + duration
                    TimeSlotBlock.objects.create(
                        content_type=reservation.provider_content_type,
                        object_id=reservation.provider_object_id,
                        date=reservation.date,
                        start_time=reservation.time,
                        end_time=end_datetime.time(),
                        reason='BOOKED',
                        notes=f"Reservation {reservation.code}"
                    )
        date_changed = reservation.date != previous_date
        time_changed = reservation.time != previous_time
        notes_changed = (reservation.notes or "") != (previous_notes or "")
        if date_changed or time_changed or notes_changed:
            actor_name = (
                f"{request.user.first_name} {request.user.last_name}".strip()
                or request.user.username
                or "Usuario"
            )
            provider_user = reservation.provider.user if reservation.provider else None
            client_user = reservation.client.user
            # Notify counterpart only
            if request.user == client_user and provider_user and provider_user.email:
                send_reservation_change_email(
                    reservation=reservation,
                    recipient_email=provider_user.email,
                    recipient_name=(
                        f"{provider_user.first_name} {provider_user.last_name}".strip()
                        or provider_user.username
                    ),
                    actor_name=actor_name,
                    change_type="updated",
                )
            elif request.user != client_user and client_user.email:
                send_reservation_change_email(
                    reservation=reservation,
                    recipient_email=client_user.email,
                    recipient_name=(
                        f"{client_user.first_name} {client_user.last_name}".strip()
                        or client_user.username
                    ),
                    actor_name=actor_name,
                    change_type="updated",
                )
        response_serializer = ReservationSerializer(reservation, context=self.get_serializer_context())
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        reservation = self.get_object()
        with transaction.atomic():
            was_slot_consuming = reservation.status in [Reservation.Status.PENDING, Reservation.Status.CONFIRMED]
            if reservation.group_session and was_slot_consuming:
                reservation.group_session.release_one_slot()

            # Remove provider booked block if it exists
            TimeSlotBlock.objects.filter(
                content_type=reservation.provider_content_type,
                object_id=reservation.provider_object_id,
                date=reservation.date,
                start_time=reservation.time,
                reason='BOOKED',
                notes__contains=reservation.code
            ).delete()

            # Best-effort cleanup for linked calendar event
            try:
                delete_reservation_event(reservation)
            except Exception as e:
                logger.error(f"Failed to delete calendar event on reservation destroy: {e}")

            reservation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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
        
        # Filter by status when provided; if not provided, return all statuses
        status_filter = request.query_params.get('status')
        if status_filter and status_filter.lower() != 'all':
            reservations = reservations.filter(status=status_filter.upper())
        
        serializer = ReservationSerializer(reservations, many=True)
        return Response({
            'results': serializer.data,
            'count': reservations.count()
        })

    @action(detail=False, methods=['get'], url_path='team')
    def team_reservations(self, request):
        """
        For PLACE users: get reservations for the place itself + all ACCEPTED linked professionals.

        Optional query params:
        - provider_type: 'professional' | 'place'
        - provider_id: integer (ProfessionalProfile.id or PlaceProfile.id)
        - status: reservation status or 'all'
        - start_date / end_date: YYYY-MM-DD
        """
        user = request.user
        if user.role != 'PLACE' or not hasattr(user, 'place_profile'):
            return Response(
                {"error": "Only place users can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )

        place_profile = user.place_profile
        place_ct = ContentType.objects.get_for_model(PlaceProfile)
        prof_ct = ContentType.objects.get_for_model(ProfessionalProfile)

        linked_professional_ids = list(
            PlaceProfessionalLink.objects.filter(
                place=place_profile,
                status=PlaceProfessionalLink.Status.ACCEPTED
            ).values_list('professional_id', flat=True)
        )

        reservations = Reservation.objects.select_related(
            'client__user', 'service', 'professional', 'place'
        ).filter(
            Q(provider_content_type=place_ct, provider_object_id=place_profile.id) |
            Q(provider_content_type=prof_ct, provider_object_id__in=linked_professional_ids)
        )

        # Filter by status when provided; if not provided, return all statuses
        status_filter = request.query_params.get('status')
        if status_filter and status_filter.lower() != 'all':
            reservations = reservations.filter(status=status_filter.upper())

        # Filter by date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            reservations = reservations.filter(date__gte=start_date)
        if end_date:
            reservations = reservations.filter(date__lte=end_date)

        # Optional filter by provider
        provider_type = (request.query_params.get('provider_type') or '').lower()
        provider_id = request.query_params.get('provider_id')
        if provider_type and provider_id:
            try:
                pid = int(provider_id)
            except (TypeError, ValueError):
                pid = None

            if pid is not None:
                if provider_type == 'professional':
                    if pid not in linked_professional_ids:
                        # Not part of this place's team
                        reservations = reservations.none()
                    else:
                        reservations = reservations.filter(provider_content_type=prof_ct, provider_object_id=pid)
                elif provider_type == 'place':
                    # Only allow filtering to this place
                    if pid != place_profile.id:
                        reservations = reservations.none()
                    else:
                        reservations = reservations.filter(provider_content_type=place_ct, provider_object_id=place_profile.id)

        reservations = reservations.order_by('-date', '-time')

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
        
        # Idempotent: if already confirmed, return success.
        if reservation.status == 'CONFIRMED':
            serializer = ReservationSerializer(reservation)
            return Response({
                'message': 'Reservation already confirmed',
                'reservation': serializer.data,
                'calendar_event_created': getattr(reservation, 'calendar_event', None) is not None
            })

        if reservation.status != 'PENDING':
            return Response(
                {"error": f"Cannot confirm reservation with status {reservation.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'CONFIRMED'
        # Save will trigger the signal which will create the calendar event and notifications
        reservation.save(update_fields=['status', 'updated_at'])
        
        # Refresh from database to get calendar event if it was created by signal
        reservation.refresh_from_db()
        
        serializer = ReservationSerializer(reservation)
        response_data = {
            'message': 'Reservation confirmed successfully',
            'reservation': serializer.data
        }
        
        # Check if calendar event was created (by signal)
        try:
            calendar_event = reservation.calendar_event
            response_data['calendar_event_created'] = True
            response_data['calendar_event_link'] = calendar_event.event_link
            response_data['calendar_event_id'] = calendar_event.google_event_id
        except:
            response_data['calendar_event_created'] = False
        
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

        if reservation.group_session:
            reservation.group_session.release_one_slot()
        
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
            logger.error(f"Failed to delete calendar event: {e}")
        
        serializer = ReservationSerializer(reservation)
        return Response({
            'message': 'Reservation rejected',
            'reservation': serializer.data
        })
    
    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel_reservation(self, request, pk=None):
        """Cancel a reservation (client or provider)"""
        reservation = self.get_object()
        
        is_client = reservation.client.user == request.user
        is_provider = bool(reservation.provider and reservation.provider.user == request.user)
        if not (is_client or is_provider):
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

        if reservation.group_session:
            reservation.group_session.release_one_slot()
        
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
            logger.error(f"Failed to delete calendar event: {e}")

        actor_name = (
            f"{request.user.first_name} {request.user.last_name}".strip()
            or request.user.username
            or "Usuario"
        )
        provider_user = reservation.provider.user if reservation.provider else None
        client_user = reservation.client.user
        # Notify counterpart only
        if is_client and provider_user and provider_user.email:
            send_reservation_change_email(
                reservation=reservation,
                recipient_email=provider_user.email,
                recipient_name=(
                    f"{provider_user.first_name} {provider_user.last_name}".strip()
                    or provider_user.username
                ),
                actor_name=actor_name,
                change_type="cancelled",
            )
        elif is_provider and client_user and client_user.email:
            send_reservation_change_email(
                reservation=reservation,
                recipient_email=client_user.email,
                recipient_name=(
                    f"{client_user.first_name} {client_user.last_name}".strip()
                    or client_user.username
                ),
                actor_name=actor_name,
                change_type="cancelled",
            )
        
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
    
    @action(detail=False, methods=['post'], url_path='check-availability')
    def check_availability(self, request):
        """Check if a time slot is available for booking"""
        provider_type = request.data.get('provider_type')
        provider_id = request.data.get('provider_id')
        date_str = request.data.get('date')
        time_str = request.data.get('time')
        duration_minutes = request.data.get('duration_minutes', 60)
        
        if not all([provider_type, provider_id, date_str, time_str]):
            return Response(
                {"error": "provider_type, provider_id, date, and time are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            time = datetime.strptime(time_str, '%H:%M').time()
            duration = timedelta(minutes=int(duration_minutes))
        except (ValueError, TypeError) as e:
            return Response(
                {"error": f"Invalid date/time format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get content type
        if provider_type == 'professional':
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
        elif provider_type == 'place':
            ct = ContentType.objects.get_for_model(PlaceProfile)
        else:
            return Response(
                {"error": "Invalid provider_type. Use 'professional' or 'place'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            is_available, reason = check_slot_availability(ct, int(provider_id), date, time, duration)
            return Response({
                'available': is_available,
                'reason': reason
            })
        except Exception as e:
            logger.error(f"Error checking availability: {e}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GroupSessionViewSet(viewsets.ModelViewSet):
    queryset = GroupSession.objects.select_related("service", "provider_content_type").all()
    serializer_class = GroupSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        provider_type = self.request.query_params.get("provider_type")
        provider_id = self.request.query_params.get("provider_id")

        if provider_type and provider_id:
            try:
                pid = int(provider_id)
            except (TypeError, ValueError):
                return queryset.none()
            if provider_type == "professional":
                ct = ContentType.objects.get_for_model(ProfessionalProfile)
            elif provider_type == "place":
                ct = ContentType.objects.get_for_model(PlaceProfile)
            else:
                return queryset.none()
            queryset = queryset.filter(
                provider_content_type=ct,
                provider_object_id=pid,
                status=GroupSession.Status.ACTIVE,
            )
            service_id = self.request.query_params.get("service")
            if service_id:
                queryset = queryset.filter(service_id=service_id)
            date_from = self.request.query_params.get("date_from")
            if date_from:
                queryset = queryset.filter(date__gte=date_from)
            return queryset.order_by("date", "time")

        if user.role == "PROFESSIONAL":
            try:
                ct = ContentType.objects.get_for_model(ProfessionalProfile)
                queryset = queryset.filter(provider_content_type=ct, provider_object_id=user.professional_profile.id)
            except Exception:
                queryset = queryset.none()
        elif user.role == "PLACE":
            try:
                ct = ContentType.objects.get_for_model(PlaceProfile)
                queryset = queryset.filter(provider_content_type=ct, provider_object_id=user.place_profile.id)
            except Exception:
                queryset = queryset.none()
        return queryset.order_by("date", "time")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "PROFESSIONAL":
            ct = ContentType.objects.get_for_model(ProfessionalProfile)
            provider_id = user.professional_profile.id
            service_instance_ct = ContentType.objects.get_for_model(ProfessionalService)
        elif user.role == "PLACE":
            ct = ContentType.objects.get_for_model(PlaceProfile)
            provider_id = user.place_profile.id
            service_instance_ct = ContentType.objects.get_for_model(ServiceInPlace)
        else:
            raise PermissionError("Only professionals and places can create group sessions")
        serializer.save(
            provider_content_type=ct,
            provider_object_id=provider_id,
            service_instance_type=service_instance_ct,
        )

    @action(detail=True, methods=["post"], url_path="reserve")
    def reserve(self, request, pk=None):
        session = self.get_object()
        if session.status != GroupSession.Status.ACTIVE:
            return Response({"error": "Group session is not active"}, status=status.HTTP_400_BAD_REQUEST)
        if session.remaining_slots <= 0:
            return Response({"error": "No slots available"}, status=status.HTTP_400_BAD_REQUEST)

        service_instance_type = "professional_service"
        if session.provider_content_type.model == "placeprofile":
            service_instance_type = "place_service"

        serializer = ReservationCreateSerializer(
            data={
                "group_session_id": session.id,
                "service_instance_type": service_instance_type,
                "service_instance_id": session.service_instance_id or session.service.id,
                "date": session.date,
                "time": session.time,
                "notes": request.data.get("notes", ""),
            },
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        return Response(
            {
                "message": "Group session reserved",
                "reservation": ReservationSerializer(reservation).data,
                "group_session": GroupSessionSerializer(session).data,
            },
            status=status.HTTP_201_CREATED,
        )


class TrackingRequestViewSet(viewsets.ModelViewSet):
    queryset = TrackingRequest.objects.select_related("reservation", "requester", "recipient").all()
    serializer_class = TrackingRequestSerializer
    permission_classes = [IsAuthenticated]

    def _expire_if_needed(self, tracking: TrackingRequest) -> TrackingRequest:
        if (
            tracking.status in [TrackingRequest.Status.PENDING, TrackingRequest.Status.ACCEPTED]
            and timezone.now() > tracking.expires_at
        ):
            tracking.status = TrackingRequest.Status.EXPIRED
            tracking.save(update_fields=["status", "updated_at"])
        return tracking

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset().filter(Q(requester=user) | Q(recipient=user))
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        return queryset

    def create(self, request, *args, **kwargs):
        reservation_id = request.data.get("reservation_id")
        if not reservation_id:
            return Response({"error": "reservation_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            reservation = Reservation.objects.get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)

        is_provider = bool(reservation.provider and reservation.provider.user == request.user)
        if not is_provider:
            return Response(
                {"error": "Only the provider can request tracking"}, status=status.HTTP_403_FORBIDDEN
            )

        if reservation.status not in [Reservation.Status.PENDING, Reservation.Status.CONFIRMED]:
            return Response(
                {"error": "Tracking is only available for active reservations"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expires_minutes = int(request.data.get("expires_minutes", 120))
        expires_at = timezone.now() + timedelta(minutes=max(expires_minutes, 5))
        tracking = TrackingRequest.objects.create(
            reservation=reservation,
            requester=request.user,
            recipient=reservation.client.user,
            expires_at=expires_at,
        )

        Notification.objects.create(
            user=reservation.client.user,
            type=Notification.NotificationType.SYSTEM,
            title="Solicitud de ubicación en tiempo real",
            message=(
                "Tu profesional solicitó compartir ubicación para esta reserva. "
                "Puedes aceptar o rechazar."
            ),
            metadata={
                "tracking_request_id": tracking.id,
                "reservation_id": reservation.id,
                "status": tracking.status,
                "action_required": True,
            },
        )

        return Response(TrackingRequestSerializer(tracking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        tracking = self._expire_if_needed(self.get_object())
        if tracking.recipient != request.user:
            return Response({"error": "Only recipient can accept"}, status=status.HTTP_403_FORBIDDEN)
        if tracking.status != TrackingRequest.Status.PENDING:
            return Response({"error": "Tracking request is not pending"}, status=status.HTTP_400_BAD_REQUEST)

        tracking.status = TrackingRequest.Status.ACCEPTED
        tracking.save(update_fields=["status", "updated_at"])
        return Response(TrackingRequestSerializer(tracking).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        tracking = self._expire_if_needed(self.get_object())
        if tracking.recipient != request.user:
            return Response({"error": "Only recipient can reject"}, status=status.HTTP_403_FORBIDDEN)
        if tracking.status != TrackingRequest.Status.PENDING:
            return Response({"error": "Tracking request is not pending"}, status=status.HTTP_400_BAD_REQUEST)
        tracking.status = TrackingRequest.Status.REJECTED
        tracking.save(update_fields=["status", "updated_at"])
        return Response(TrackingRequestSerializer(tracking).data)

    @action(detail=True, methods=["post"], url_path="stop")
    def stop(self, request, pk=None):
        tracking = self._expire_if_needed(self.get_object())
        if request.user not in [tracking.requester, tracking.recipient]:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        if tracking.status not in [TrackingRequest.Status.PENDING, TrackingRequest.Status.ACCEPTED]:
            return Response({"error": "Tracking already closed"}, status=status.HTTP_400_BAD_REQUEST)
        tracking.status = TrackingRequest.Status.STOPPED
        tracking.save(update_fields=["status", "updated_at"])
        return Response(TrackingRequestSerializer(tracking).data)

    @action(detail=True, methods=["post"], url_path="ping")
    def ping(self, request, pk=None):
        tracking = self._expire_if_needed(self.get_object())
        if tracking.recipient != request.user:
            return Response(
                {"error": "Only the tracking recipient can send location"}, status=status.HTTP_403_FORBIDDEN
            )
        if tracking.recipient != tracking.reservation.client.user:
            return Response(
                {"error": "Tracking recipient does not match reservation client"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if tracking.status != TrackingRequest.Status.ACCEPTED:
            return Response({"error": "Tracking is not active"}, status=status.HTTP_400_BAD_REQUEST)

        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        accuracy = request.data.get("accuracy_meters")
        if latitude is None or longitude is None:
            return Response({"error": "latitude and longitude are required"}, status=status.HTTP_400_BAD_REQUEST)

        tracking.latest_latitude = latitude
        tracking.latest_longitude = longitude
        tracking.latest_accuracy_meters = accuracy
        tracking.latest_reported_at = timezone.now()
        tracking.save(
            update_fields=[
                "latest_latitude",
                "latest_longitude",
                "latest_accuracy_meters",
                "latest_reported_at",
                "updated_at",
            ]
        )
        return Response(TrackingRequestSerializer(tracking).data)

    @action(detail=True, methods=["get"], url_path="status")
    def status(self, request, pk=None):
        tracking = self._expire_if_needed(self.get_object())
        return Response(TrackingRequestSerializer(tracking).data)
