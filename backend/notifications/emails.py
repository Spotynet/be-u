"""
Email utilities for sending reservation confirmation emails
"""
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_reservation_confirmation_to_client(reservation):
    """
    Send confirmation email to client when reservation is created/confirmed.
    
    Args:
        reservation: Reservation model instance
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        client = reservation.client
        client_email = client.user.email
        
        if not client_email:
            logger.warning(f"Cannot send email to client: no email address for reservation {reservation.code}")
            return False
        
        # Get provider name
        provider = reservation.provider
        provider_name = "N/A"
        if provider:
            if hasattr(provider, 'name'):
                if hasattr(provider, 'last_name'):
                    provider_name = f"{provider.name} {provider.last_name}"
                else:
                    provider_name = provider.name
        
        # Calculate end time
        from datetime import datetime, timedelta
        start_datetime = datetime.combine(reservation.date, reservation.time)
        if reservation.duration:
            end_datetime = start_datetime + reservation.duration
            end_time = end_datetime.time().strftime('%H:%M')
        else:
            end_time = (start_datetime + timedelta(hours=1)).time().strftime('%H:%M')
        
        # Prepare context for template
        context = {
            'reservation': reservation,
            'client_name': f"{client.user.first_name} {client.user.last_name}".strip() or client.user.username,
            'provider_name': provider_name,
            'service_name': reservation.service.name,
            'date': reservation.date.strftime('%d/%m/%Y'),
            'time': reservation.time.strftime('%H:%M'),
            'end_time': end_time,
            'reservation_code': reservation.code,
            'notes': reservation.notes or '',
        }
        
        # Render HTML email
        html_message = render_to_string('emails/reservation_confirmed_client.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        subject = f'Confirmación de Reserva - {reservation.service.name}'
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@be-u.ai')
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=from_email,
                recipient_list=[client_email],
                html_message=html_message,
                fail_silently=True,  # Don't raise exception if email fails, just log it
            )
        except Exception as email_error:
            logger.error(f"Email sending exception for client {client_email}: {email_error}")
            return False
        
        logger.info(f"✅ Confirmation email sent to client {client_email} for reservation {reservation.code}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send confirmation email to client for reservation {reservation.code}: {e}", exc_info=True)
        return False


def send_reservation_notification_to_provider(reservation):
    """
    Send notification email to provider when a new reservation is created/confirmed.
    
    Args:
        reservation: Reservation model instance
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        provider = reservation.provider
        if not provider:
            logger.warning(f"Cannot send email to provider: no provider found for reservation {reservation.code}")
            return False
        
        provider_user = provider.user
        provider_email = provider_user.email
        
        if not provider_email:
            logger.warning(f"Cannot send email to provider: no email address for reservation {reservation.code}")
            return False
        
        # Get client name
        client = reservation.client
        client_name = f"{client.user.first_name} {client.user.last_name}".strip() or client.user.username or "Cliente"
        client_email = client.user.email or "No disponible"
        client_phone = getattr(client, 'phone', None) or "No disponible"
        
        # Get provider name
        provider_name = "N/A"
        if hasattr(provider, 'name'):
            if hasattr(provider, 'last_name'):
                provider_name = f"{provider.name} {provider.last_name}"
            else:
                provider_name = provider.name
        
        # Calculate end time
        from datetime import datetime, timedelta
        start_datetime = datetime.combine(reservation.date, reservation.time)
        if reservation.duration:
            end_datetime = start_datetime + reservation.duration
            end_time = end_datetime.time().strftime('%H:%M')
        else:
            end_time = (start_datetime + timedelta(hours=1)).time().strftime('%H:%M')
        
        # Prepare context for template
        context = {
            'reservation': reservation,
            'provider_name': provider_name,
            'client_name': client_name,
            'client_email': client_email,
            'client_phone': client_phone,
            'service_name': reservation.service.name,
            'date': reservation.date.strftime('%d/%m/%Y'),
            'time': reservation.time.strftime('%H:%M'),
            'end_time': end_time,
            'reservation_code': reservation.code,
            'notes': reservation.notes or '',
        }
        
        # Render HTML email
        html_message = render_to_string('emails/reservation_confirmed_provider.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        subject = f'Nueva Reserva Confirmada - {reservation.service.name}'
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@be-u.ai')
        
        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=from_email,
                recipient_list=[provider_email],
                html_message=html_message,
                fail_silently=True,  # Don't raise exception if email fails, just log it
            )
        except Exception as email_error:
            logger.error(f"Email sending exception for provider {provider_email}: {email_error}")
            return False
        
        logger.info(f"✅ Notification email sent to provider {provider_email} for reservation {reservation.code}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send notification email to provider for reservation {reservation.code}: {e}", exc_info=True)
        return False
