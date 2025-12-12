from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import Notification, NotificationTemplate
from reservations.models import Reservation
from reviews.models import PlaceReview, ProfessionalReview


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
        if instance.status == Reservation.Status.CONFIRMED:
            _create_notification(
                user=instance.client.user,
                type=Notification.NotificationType.RESERVATION,
                title="Reserva confirmada",
                message=f"Tu reserva {instance.code} ha sido confirmada por el proveedor",
                content_object=instance,
                metadata={
                    'reservation_code': instance.code,
                    'service_name': instance.service.name,
                    'provider_name': getattr(instance.provider, 'name', 'N/A')
                }
            )
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

