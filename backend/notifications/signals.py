from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import logging

from .models import Notification, NotificationTemplate, ReservationReminder
from reservations.models import Reservation
from reviews.models import Review

logger = logging.getLogger(__name__)

# Store previous reservation fields to detect changes
_previous_reservation_cache = {}


@receiver(pre_save, sender=Reservation)
def store_previous_status(sender, instance, **kwargs):
    """Store previous status/date/time before save to detect changes"""
    if instance.pk:
        try:
            old_instance = Reservation.objects.get(pk=instance.pk)
            _previous_reservation_cache[instance.pk] = {
                'status': old_instance.status,
                'date': old_instance.date,
                'time': old_instance.time,
            }
        except Reservation.DoesNotExist:
            _previous_reservation_cache[instance.pk] = None
    else:
        _previous_reservation_cache[instance.pk] = None


def _get_reservation_datetime(instance):
    """Return timezone-aware datetime for reservation date/time"""
    from datetime import datetime
    tz = timezone.get_default_timezone()
    naive = datetime.combine(instance.date, instance.time)
    return timezone.make_aware(naive, tz)


def _schedule_reminders_for_user(reservation, user):
    """Create/update reminders for a reservation and user"""
    if not user:
        return

    reminder_offsets = {
        ReservationReminder.ReminderType.H24: timezone.timedelta(hours=24),
        ReservationReminder.ReminderType.H12: timezone.timedelta(hours=12),
        ReservationReminder.ReminderType.H4: timezone.timedelta(hours=4),
        ReservationReminder.ReminderType.M30: timezone.timedelta(minutes=30),
    }

    reservation_dt = _get_reservation_datetime(reservation)
    for reminder_type, delta in reminder_offsets.items():
        send_at = reservation_dt - delta
        ReservationReminder.objects.update_or_create(
            reservation=reservation,
            user=user,
            reminder_type=reminder_type,
            defaults={
                'send_at': send_at,
                'status': ReservationReminder.Status.PENDING,
                'last_error': None,
            }
        )


def _cancel_reminders(reservation):
    ReservationReminder.objects.filter(
        reservation=reservation,
        status=ReservationReminder.Status.PENDING
    ).update(
        status=ReservationReminder.Status.CANCELLED,
        updated_at=timezone.now()
    )


# ======================
# HELPER FUNCTIONS
# ======================

def get_provider_user_from_reservation(instance):
    """
    Safely get the provider user from a reservation instance.
    Returns (provider_user, provider_name) tuple.
    """
    try:
        # Try accessing via GenericForeignKey first
        provider = instance.provider
        
        # If that fails, try accessing via content_type directly
        if not provider:
            logger.warning(f"Provider GenericForeignKey returned None for reservation {instance.code}, trying direct access")
            from users.models import ProfessionalProfile, PlaceProfile
            
            if instance.provider_content_type.model == 'professionalprofile':
                try:
                    provider = ProfessionalProfile.objects.get(id=instance.provider_object_id)
                    logger.info(f"Found ProfessionalProfile via direct access: {provider.id}")
                except ProfessionalProfile.DoesNotExist:
                    logger.error(f"ProfessionalProfile with ID {instance.provider_object_id} does not exist")
                    return None, "N/A"
            elif instance.provider_content_type.model == 'placeprofile':
                try:
                    provider = PlaceProfile.objects.get(id=instance.provider_object_id)
                    logger.info(f"Found PlaceProfile via direct access: {provider.id}")
                except PlaceProfile.DoesNotExist:
                    logger.error(f"PlaceProfile with ID {instance.provider_object_id} does not exist")
                    return None, "N/A"
            else:
                logger.error(f"Unknown provider content_type model: {instance.provider_content_type.model}")
                return None, "N/A"
        
        if provider:
            provider_user = provider.user
            # Get provider name
            if hasattr(provider, 'name'):
                if hasattr(provider, 'last_name'):
                    provider_name = f"{provider.name} {provider.last_name}"
                else:
                    provider_name = provider.name
            else:
                provider_name = "N/A"
            
            logger.info(f"Provider found: {provider_name} (User ID: {provider_user.id})")
            return provider_user, provider_name
        else:
            logger.error(f"Provider is None (content_type: {instance.provider_content_type}, object_id: {instance.provider_object_id})")
            return None, "N/A"
            
    except Exception as e:
        logger.error(f"Error getting provider user for reservation {instance.code}: {e}", exc_info=True)
        return None, "N/A"


def get_client_name_from_reservation(instance):
    """Get formatted client name from reservation"""
    try:
        client_name = f"{instance.client.user.first_name} {instance.client.user.last_name}".strip()
        if not client_name:
            client_name = instance.client.user.username or instance.client.user.email
        return client_name
    except Exception as e:
        logger.error(f"Error getting client name: {e}")
        return "Cliente"


def create_provider_notification_for_new_reservation(instance, provider_user, provider_name):
    """Create notification for provider when new reservation is created"""
    if not provider_user:
        logger.error(f"Cannot create provider notification: provider_user is None for reservation {instance.code}")
        return False
    
    try:
        service_name = instance.service.name
        client_name = get_client_name_from_reservation(instance)
        
        logger.info(f"Creating provider notification for user {provider_user.id} ({provider_user.email}) - Reservation: {instance.code}")
        
        is_confirmed = instance.status == Reservation.Status.CONFIRMED
        notification = _create_notification(
            user=provider_user,
            type=Notification.NotificationType.RESERVATION,
            title="Nueva reserva confirmada" if is_confirmed else "Nueva solicitud de reserva",
            message=(
                f"{client_name} confirmó una reserva para {service_name} el {instance.date.strftime('%d/%m/%Y')} a las {instance.time.strftime('%H:%M')}"
                if is_confirmed
                else f"{client_name} solicita una reserva para {service_name} el {instance.date.strftime('%d/%m/%Y')} a las {instance.time.strftime('%H:%M')}"
            ),
            content_object=instance,
            metadata={
                'reservation_code': instance.code,
                'reservation_id': instance.id,
                'service_name': service_name,
                'service_type_id': instance.service.id,
                'client_name': client_name,
                'client_email': instance.client.user.email,
                'date': str(instance.date),
                'time': str(instance.time),
                'status': instance.status,
                'notes': instance.notes or '',
                'action_required': False if is_confirmed else True,
            }
        )
        
        if notification:
            logger.info(f"Provider notification created successfully: ID {notification.id}")
            return True
        else:
            logger.error(f"Failed to create provider notification - _create_notification returned None")
            return False
            
    except Exception as e:
        logger.error(f"Error creating provider notification for reservation {instance.code}: {e}", exc_info=True)
        return False


def create_client_notification_for_new_reservation(instance, provider_name):
    """Create notification for client when their reservation request is sent"""
    try:
        service_name = instance.service.name
        
        logger.info(f"Creating client notification for reservation {instance.code}")
        
        is_confirmed = instance.status == Reservation.Status.CONFIRMED
        notification = _create_notification(
            user=instance.client.user,
            type=Notification.NotificationType.RESERVATION,
            title="Reserva confirmada" if is_confirmed else "Solicitud de reserva enviada",
            message=(
                f"Tu reserva para {service_name} ha sido confirmada."
                if is_confirmed
                else f"Tu solicitud de reserva para {service_name} ha sido enviada. El proveedor te notificará cuando la confirme o rechace."
            ),
            content_object=instance,
            metadata={
                'reservation_code': instance.code,
                'service_name': service_name,
                'service_type_id': instance.service.id,
                'provider_name': provider_name,
                'date': str(instance.date),
                'time': str(instance.time),
                'status': instance.status,
            }
        )
        
        if notification:
            logger.info(f"Client notification created successfully: ID {notification.id}")
            return True
        else:
            logger.error(f"Failed to create client notification - _create_notification returned None")
            return False
            
    except Exception as e:
        logger.error(f"Error creating client notification for reservation {instance.code}: {e}", exc_info=True)
        return False


# ======================
# SIGNAL HANDLERS
# ======================

@receiver(post_save, sender=Reservation)
def create_reservation_notification(sender, instance, created, **kwargs):
    """Create notification when reservation is created or updated"""
    logger.info(f"Signal triggered for reservation {instance.code if hasattr(instance, 'code') else instance.id} - created: {created}")
    
    if created:
        # New reservation created - notify both PROVIDER and CLIENT
        logger.info(f"Processing new reservation {instance.code} (ID: {instance.id})")
        
        # Get provider user
        provider_user, provider_name = get_provider_user_from_reservation(instance)
        
        # Create provider notification
        provider_notif_created = create_provider_notification_for_new_reservation(instance, provider_user, provider_name)
        
        # Create client notification
        client_notif_created = create_client_notification_for_new_reservation(instance, provider_name)

        # Send confirmation email to provider
        # Note: Google Calendar doesn't send email to the organizer (professional), only to attendees
        # So we need to send a custom email to the professional
        try:
            from .emails import send_reservation_notification_to_provider
            email_sent_to_provider = send_reservation_notification_to_provider(instance)
            if email_sent_to_provider:
                logger.info(f"✅ Confirmation email sent to provider for reservation {instance.code}")
            else:
                logger.warning(f"⚠️ Failed to send confirmation email to provider for reservation {instance.code}")
        except Exception as e:
            logger.error(f"❌ Error sending confirmation email to provider for reservation {instance.code}: {e}", exc_info=True)

        # Note: Client email is sent automatically via Google Calendar when the event is created
        # The client is added as an attendee with responseStatus='accepted'
        # This ensures the client receives the calendar invite without requiring RSVP confirmation

        # If reservations are created already CONFIRMED, also create Google Calendar event immediately
        # This is done in a separate try/except to ensure it doesn't block reservation creation
        if instance.status == Reservation.Status.CONFIRMED:
            try:
                from calendar_integration.event_helpers import create_reservation_event
                calendar_event = create_reservation_event(instance)
                if calendar_event and provider_user:
                    try:
                        _create_notification(
                            user=provider_user,
                            type=Notification.NotificationType.RESERVATION,
                            title="Evento creado en Google Calendar",
                            message=f"Se creó un evento en tu Google Calendar para la reserva {instance.code}",
                            content_object=instance,
                            metadata={
                                'reservation_code': instance.code,
                                'service_name': instance.service.name,
                                'client_name': get_client_name_from_reservation(instance),
                                'calendar_event_id': calendar_event.google_event_id,
                                'calendar_event_link': calendar_event.event_link,
                                'status': instance.status,
                            }
                        )
                    except Exception as notif_error:
                        logger.error(f"Failed to create calendar notification for reservation {instance.code}: {notif_error}", exc_info=True)
            except Exception as e:
                # Log error but don't let it prevent reservation creation
                logger.error(f"Could not create calendar event for reservation {instance.code}: {e}", exc_info=True)
        
        # Schedule reminders for confirmed reservations
        if instance.status == Reservation.Status.CONFIRMED:
            _schedule_reminders_for_user(instance, instance.client.user)
            _schedule_reminders_for_user(instance, provider_user)

        # Log summary
        if provider_notif_created and client_notif_created:
            logger.info(f"✅ Both notifications created successfully for reservation {instance.code}")
        elif provider_notif_created:
            logger.warning(f"⚠️ Only provider notification created for reservation {instance.code}")
        elif client_notif_created:
            logger.warning(f"⚠️ Only client notification created for reservation {instance.code}")
        else:
            logger.error(f"❌ No notifications created for reservation {instance.code}")
    
    else:
        # Reservation updated - check status/date/time changes
        previous_data = _previous_reservation_cache.get(instance.pk) or {}
        previous_status = previous_data.get('status')
        previous_date = previous_data.get('date')
        previous_time = previous_data.get('time')
        
        if instance.status == Reservation.Status.CONFIRMED and previous_status != Reservation.Status.CONFIRMED:
            # Notify client that reservation was confirmed
            provider_user, provider_name = get_provider_user_from_reservation(instance)
            
            _create_notification(
                user=instance.client.user,
                type=Notification.NotificationType.RESERVATION,
                title="Reserva confirmada",
                message=f"Tu reserva {instance.code} ha sido confirmada por el proveedor",
                content_object=instance,
                metadata={
                    'reservation_code': instance.code,
                    'service_name': instance.service.name,
                    'provider_name': provider_name,
                    'status': instance.status,
                }
            )
            
            # Create Google Calendar event if provider has calendar connected
            try:
                from calendar_integration.event_helpers import create_reservation_event
                calendar_event = create_reservation_event(instance)
                if calendar_event and provider_user:
                    # Notify provider that calendar event was created
                    _create_notification(
                        user=provider_user,
                        type=Notification.NotificationType.RESERVATION,
                        title="Evento creado en Google Calendar",
                        message=f"Se creó un evento en tu Google Calendar para la reserva {instance.code}",
                        content_object=instance,
                        metadata={
                            'reservation_code': instance.code,
                            'service_name': instance.service.name,
                            'client_name': get_client_name_from_reservation(instance),
                            'calendar_event_id': calendar_event.google_event_id,
                            'calendar_event_link': calendar_event.event_link,
                            'status': instance.status,
                        }
                    )
            except Exception as e:
                logger.warning(f"Could not create calendar event for reservation {instance.code}: {e}")

            # Schedule reminders for client and provider
            _schedule_reminders_for_user(instance, instance.client.user)
            _schedule_reminders_for_user(instance, provider_user)
        
        elif instance.status == Reservation.Status.CANCELLED and previous_status != Reservation.Status.CANCELLED:
            # Notify client that reservation was cancelled
            _create_notification(
                user=instance.client.user,
                type=Notification.NotificationType.RESERVATION,
                title="Reserva cancelada",
                message=f"Tu reserva {instance.code} ha sido cancelada",
                content_object=instance,
                metadata={
                    'reservation_code': instance.code,
                    'service_name': instance.service.name,
                    'cancellation_reason': instance.cancellation_reason
                }
            )
            _cancel_reminders(instance)
        
        elif instance.status == Reservation.Status.REJECTED and previous_status != Reservation.Status.REJECTED:
            # Notify client that reservation was rejected
            _create_notification(
                user=instance.client.user,
                type=Notification.NotificationType.RESERVATION,
                title="Reserva rechazada",
                message=f"Tu reserva {instance.code} ha sido rechazada por el proveedor",
                content_object=instance,
                metadata={
                    'reservation_code': instance.code,
                    'service_name': instance.service.name,
                    'rejection_reason': instance.rejection_reason
                }
            )
            _cancel_reminders(instance)
        
        # If date/time changed for confirmed reservations, reschedule reminders
        if instance.status == Reservation.Status.CONFIRMED and (
            instance.date != previous_date or instance.time != previous_time
        ):
            provider_user, _ = get_provider_user_from_reservation(instance)
            _schedule_reminders_for_user(instance, instance.client.user)
            _schedule_reminders_for_user(instance, provider_user)
        
        elif instance.status == Reservation.Status.COMPLETED and previous_status != Reservation.Status.COMPLETED:
            # Notify client that reservation was completed
            _create_notification(
                user=instance.client.user,
                type=Notification.NotificationType.RESERVATION,
                title="Reserva completada",
                message=f"Tu reserva {instance.code} ha sido completada. ¡Gracias por elegirnos!",
                content_object=instance,
                metadata={
                    'reservation_code': instance.code,
                    'service_name': instance.service.name
                }
            )


@receiver(post_save, sender=Review)
def create_review_notification(sender, instance, created, **kwargs):
    """Create notification when review is created (unified Review model)"""
    if created:
        # Notify the profile owner
        profile_user = instance.to_public_profile.user
        reviewer_name = instance.reviewer_name
        
        _create_notification(
            user=profile_user,
            type=Notification.NotificationType.REVIEW,
            title="Nueva reseña recibida",
            message=f"Has recibido una nueva reseña de {reviewer_name}",
            content_object=instance,
            metadata={
                'reviewer_name': reviewer_name,
                'rating': instance.rating,
                'profile_name': instance.reviewed_name,
                'profile_type': instance.to_public_profile.profile_type,
                'service_name': instance.service.name if instance.service else 'N/A'
            }
        )


# ======================
# NOTIFICATION CREATION
# ======================

def _create_notification(user, type, title, message, content_object=None, metadata=None):
    """Helper function to create notifications"""
    try:
        if not user:
            logger.error(f"Cannot create notification: user is None (title: {title})")
            return None
        
        if not hasattr(user, 'id') or not user.id:
            logger.error(f"Cannot create notification: user is invalid (title: {title}, user: {user})")
            return None
        
        logger.debug(f"Creating notification for user {user.id} ({user.email}): {title}")
        
        notification = Notification.objects.create(
            user=user,
            type=type,
            title=title,
            message=message,
            content_object=content_object,
            metadata=metadata or {}
        )
        
        logger.info(f"Notification created successfully: ID {notification.id} for user {user.id} - {title}")
        return notification
    except Exception as e:
        logger.error(f"Failed to create notification for user {user.id if user else 'None'} (title: {title}): {e}", exc_info=True)
        return None


def create_system_notification(user, title, message, metadata=None):
    """Create a system notification for a user"""
    return _create_notification(
        user=user,
        type=Notification.NotificationType.SYSTEM,
        title=title,
        message=message,
        metadata=metadata
    )


def create_bulk_notification(users, type, title, message, metadata=None):
    """Create notifications for multiple users"""
    notifications = []
    for user in users:
        notification = _create_notification(
            user=user,
            type=type,
            title=title,
            message=message,
            metadata=metadata
        )
        if notification:
            notifications.append(notification)
    return notifications
