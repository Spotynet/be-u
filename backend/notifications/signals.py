from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import Notification, NotificationTemplate
from reservations.models import Reservation
from reviews.models import PlaceReview, ProfessionalReview

# Store previous status to detect changes
_previous_status_cache = {}


@receiver(pre_save, sender=Reservation)
def store_previous_status(sender, instance, **kwargs):
    """Store previous status before save to detect changes"""
    if instance.pk:
        try:
            old_instance = Reservation.objects.get(pk=instance.pk)
            _previous_status_cache[instance.pk] = old_instance.status
        except Reservation.DoesNotExist:
            _previous_status_cache[instance.pk] = None
    else:
        _previous_status_cache[instance.pk] = None


@receiver(post_save, sender=Reservation)
def create_reservation_notification(sender, instance, created, **kwargs):
    """Create notification when reservation is created or updated"""
    if created:
        # New reservation created - notify the PROVIDER (not the client)
        # The provider needs to confirm or reject the reservation
        provider_user = instance.provider.user
        client_name = f"{instance.client.user.first_name} {instance.client.user.last_name}".strip()
        
        _create_notification(
            user=provider_user,
            type=Notification.NotificationType.RESERVATION,
            title="Nueva solicitud de reserva",
            message=f"{client_name} solicita una reserva para {instance.service.name} el {instance.date.strftime('%d/%m/%Y')} a las {instance.time.strftime('%H:%M')}",
            content_object=instance,
            metadata={
                'reservation_code': instance.code,
                'reservation_id': instance.id,
                'service_name': instance.service.name,
                'client_name': client_name,
                'client_email': instance.client.user.email,
                'date': str(instance.date),
                'time': str(instance.time),
                'status': instance.status,
                'notes': instance.notes or '',
                'action_required': True,  # Indicates provider needs to take action
            }
        )
        
        # Also notify the client that their request was sent
        _create_notification(
            user=instance.client.user,
            type=Notification.NotificationType.RESERVATION,
            title="Solicitud de reserva enviada",
            message=f"Tu solicitud de reserva para {instance.service.name} ha sido enviada. El proveedor te notificará cuando la confirme o rechace.",
            content_object=instance,
            metadata={
                'reservation_code': instance.code,
                'service_name': instance.service.name,
                'provider_name': getattr(instance.provider, 'name', 'N/A'),
                'date': str(instance.date),
                'time': str(instance.time),
                'status': instance.status,
            }
        )
    else:
        # Reservation updated - check status changes
        # Get previous status from cache
        previous_status = _previous_status_cache.get(instance.pk)
        
        # Only notify if status actually changed to CONFIRMED
        if instance.status == Reservation.Status.CONFIRMED and previous_status != Reservation.Status.CONFIRMED:
            # Notify client that reservation was confirmed
            _create_notification(
                user=instance.client.user,
                type=Notification.NotificationType.RESERVATION,
                title="Reserva confirmada",
                message=f"Tu reserva {instance.code} ha sido confirmada por el proveedor",
                content_object=instance,
                metadata={
                    'reservation_code': instance.code,
                    'service_name': instance.service.name,
                    'provider_name': getattr(instance.provider, 'name', 'N/A'),
                    'status': instance.status,
                }
            )
            
            # Create Google Calendar event if provider has calendar connected
            # This happens after the reservation is saved, so we use a post_save signal
            try:
                from calendar_integration.event_helpers import create_reservation_event
                calendar_event = create_reservation_event(instance)
                if calendar_event:
                    # Notify provider that calendar event was created
                    _create_notification(
                        user=instance.provider.user,
                        type=Notification.NotificationType.RESERVATION,
                        title="Evento creado en Google Calendar",
                        message=f"Se creó un evento en tu Google Calendar para la reserva {instance.code}",
                        content_object=instance,
                        metadata={
                            'reservation_code': instance.code,
                            'service_name': instance.service.name,
                            'client_name': f"{instance.client.user.first_name} {instance.client.user.last_name}",
                            'calendar_event_id': calendar_event.google_event_id,
                            'calendar_event_link': calendar_event.event_link,
                            'status': instance.status,
                        }
                    )
            except Exception as e:
                # Log but don't fail - calendar event creation is optional
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Could not create calendar event for reservation {instance.code}: {e}")
        elif instance.status == Reservation.Status.CANCELLED:
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
        elif instance.status == Reservation.Status.REJECTED:
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
        elif instance.status == Reservation.Status.COMPLETED:
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


@receiver(post_save, sender=PlaceReview)
def create_place_review_notification(sender, instance, created, **kwargs):
    """Create notification when place review is created"""
    if created:
        # Notify the place owner
        _create_notification(
            user=instance.place.user,
            type=Notification.NotificationType.REVIEW,
            title="Nueva reseña recibida",
            message=f"Has recibido una nueva reseña de {instance.user.user.first_name} {instance.user.user.last_name}",
            content_object=instance,
            metadata={
                'reviewer_name': f"{instance.user.user.first_name} {instance.user.user.last_name}",
                'rating': instance.qualification,
                'place_name': instance.place.name,
                'service_name': instance.service.name if instance.service else 'N/A'
            }
        )


@receiver(post_save, sender=ProfessionalReview)
def create_professional_review_notification(sender, instance, created, **kwargs):
    """Create notification when professional review is created"""
    if created:
        # Notify the professional
        _create_notification(
            user=instance.professional.user,
            type=Notification.NotificationType.REVIEW,
            title="Nueva reseña recibida",
            message=f"Has recibido una nueva reseña de {instance.user.user.first_name} {instance.user.user.last_name}",
            content_object=instance,
            metadata={
                'reviewer_name': f"{instance.user.user.first_name} {instance.user.user.last_name}",
                'rating': instance.qualification,
                'professional_name': f"{instance.professional.name} {instance.professional.last_name}",
                'service_name': instance.service.name if instance.service else 'N/A'
            }
        )


def _create_notification(user, type, title, message, content_object=None, metadata=None):
    """Helper function to create notifications"""
    try:
        notification = Notification.objects.create(
            user=user,
            type=type,
            title=title,
            message=message,
            content_object=content_object,
            metadata=metadata or {}
        )
        return notification
    except Exception as e:
        # Log error but don't break the main flow
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create notification: {e}")
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

