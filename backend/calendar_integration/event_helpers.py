"""
Calendar Event Helpers

Provides helper functions for creating and managing calendar events
related to reservations.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from django.conf import settings

from .services import google_calendar_service, CalendarEventData
from .models import CalendarEvent

logger = logging.getLogger(__name__)


def create_reservation_event(reservation) -> Optional[CalendarEvent]:
    """
    Create a Google Calendar event for a confirmed reservation.
    
    Args:
        reservation: Reservation model instance
        
    Returns:
        CalendarEvent instance if created successfully, None otherwise
    """
    # Get the provider user
    provider = reservation.provider
    if not provider:
        logger.warning(f"No provider found for reservation {reservation.code}")
        return None
    
    provider_user = provider.user
    
    # Check if provider has Google Calendar connected
    if not google_calendar_service.has_calendar_connected(provider_user):
        logger.info(f"Provider {provider_user.id} does not have Google Calendar connected")
        return None
    
    # Build event data
    client = reservation.client
    service = reservation.service
    
    # Calculate end time
    start_datetime = datetime.combine(reservation.date, reservation.time)
    if reservation.duration:
        end_datetime = start_datetime + reservation.duration
    else:
        # Default to 1 hour if no duration
        end_datetime = start_datetime + timedelta(hours=1)
    
    # Build description
    description_parts = [
        f"Cliente: {client.user.first_name} {client.user.last_name}",
        f"Email: {client.user.email}",
        f"Teléfono: {client.user.phone or 'No disponible'}",
        f"Código de reserva: {reservation.code}",
    ]
    if reservation.notes:
        description_parts.append(f"\nNotas: {reservation.notes}")
    
    # Get location if available
    location = None
    if hasattr(provider, 'street'):
        # PlaceProfile has address fields
        location_parts = [provider.street]
        if provider.number_ext:
            location_parts.append(f"#{provider.number_ext}")
        if provider.city:
            location_parts.append(provider.city)
        if provider.postal_code:
            location_parts.append(f"CP {provider.postal_code}")
        location = ", ".join(location_parts)
    
    event_data = CalendarEventData(
        summary=f"Reserva: {service.name}",
        description="\n".join(description_parts),
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        location=location,
        attendees=[client.user.email] if client.user.email else None,
        timezone='America/Mexico_City',
    )
    
    # Create the event
    try:
        credentials = provider_user.google_calendar_credentials
        calendar_id = credentials.calendar_id
    except:
        calendar_id = 'primary'
    
    google_event = google_calendar_service.create_event(
        provider_user,
        event_data,
        calendar_id=calendar_id
    )
    
    if not google_event:
        logger.error(f"Failed to create Google Calendar event for reservation {reservation.code}")
        return None
    
    # Save the calendar event record
    calendar_event = CalendarEvent.objects.create(
        reservation=reservation,
        google_event_id=google_event['id'],
        calendar_id=calendar_id,
        calendar_owner=provider_user,
        event_link=google_event.get('htmlLink'),
    )
    
    logger.info(
        f"Created calendar event {google_event['id']} "
        f"for reservation {reservation.code}"
    )
    
    return calendar_event


def delete_reservation_event(reservation) -> bool:
    """
    Delete the Google Calendar event for a reservation.
    
    Args:
        reservation: Reservation model instance
        
    Returns:
        True if deleted successfully or no event exists
    """
    try:
        calendar_event = reservation.calendar_event
    except CalendarEvent.DoesNotExist:
        logger.info(f"No calendar event found for reservation {reservation.code}")
        return True
    
    # Delete from Google Calendar
    success = google_calendar_service.delete_event(
        calendar_event.calendar_owner,
        calendar_event.google_event_id,
        calendar_event.calendar_id
    )
    
    if success:
        # Delete local record
        calendar_event.delete()
        logger.info(f"Deleted calendar event for reservation {reservation.code}")
    else:
        logger.error(f"Failed to delete calendar event for reservation {reservation.code}")
    
    return success


def update_reservation_event(reservation) -> bool:
    """
    Update the Google Calendar event for a reservation.
    
    Args:
        reservation: Reservation model instance
        
    Returns:
        True if updated successfully
    """
    try:
        calendar_event = reservation.calendar_event
    except CalendarEvent.DoesNotExist:
        # No event exists, try to create one if reservation is confirmed
        if reservation.status == 'CONFIRMED':
            return create_reservation_event(reservation) is not None
        return True
    
    # Build updated event data
    client = reservation.client
    service = reservation.service
    provider = reservation.provider
    
    start_datetime = datetime.combine(reservation.date, reservation.time)
    if reservation.duration:
        end_datetime = start_datetime + reservation.duration
    else:
        end_datetime = start_datetime + timedelta(hours=1)
    
    description_parts = [
        f"Cliente: {client.user.first_name} {client.user.last_name}",
        f"Email: {client.user.email}",
        f"Teléfono: {client.user.phone or 'No disponible'}",
        f"Código de reserva: {reservation.code}",
    ]
    if reservation.notes:
        description_parts.append(f"\nNotas: {reservation.notes}")
    
    location = None
    if hasattr(provider, 'street'):
        location_parts = [provider.street]
        if provider.number_ext:
            location_parts.append(f"#{provider.number_ext}")
        if provider.city:
            location_parts.append(provider.city)
        if provider.postal_code:
            location_parts.append(f"CP {provider.postal_code}")
        location = ", ".join(location_parts)
    
    event_data = CalendarEventData(
        summary=f"Reserva: {service.name}",
        description="\n".join(description_parts),
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        location=location,
        timezone='America/Mexico_City',
    )
    
    # Update the event
    google_event = google_calendar_service.update_event(
        calendar_event.calendar_owner,
        calendar_event.google_event_id,
        event_data,
        calendar_event.calendar_id
    )
    
    if google_event:
        logger.info(f"Updated calendar event for reservation {reservation.code}")
        return True
    else:
        logger.error(f"Failed to update calendar event for reservation {reservation.code}")
        return False




















