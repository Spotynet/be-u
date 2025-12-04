"""
Google Calendar API Service

This module provides a wrapper around the Google Calendar API
for managing calendar events and availability.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from django.conf import settings
from django.utils import timezone

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from .models import GoogleCalendarCredentials, CalendarEvent

logger = logging.getLogger(__name__)


@dataclass
class BusyTime:
    """Represents a busy time period from Google Calendar"""
    start: datetime
    end: datetime


@dataclass
class CalendarEventData:
    """Data for creating/updating a calendar event"""
    summary: str
    description: str
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    attendees: Optional[List[str]] = None
    timezone: str = 'America/Mexico_City'


class GoogleCalendarService:
    """
    Service class for Google Calendar API operations.
    Handles OAuth flow, event management, and availability queries.
    """
    
    SCOPES = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
    ]
    
    def __init__(self):
        self.client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        self.redirect_uri = getattr(settings, 'GOOGLE_REDIRECT_URI', '')
    
    def get_auth_url(self, state: Optional[str] = None, redirect_uri: Optional[str] = None) -> str:
        """
        Generate Google OAuth authorization URL.
        
        Args:
            state: Optional state parameter for CSRF protection
            redirect_uri: Optional custom redirect URI (for mobile apps)
            
        Returns:
            Authorization URL for redirecting the user
        """
        # Use provided redirect_uri (for mobile) or default to backend redirect_uri
        final_redirect_uri = redirect_uri or self.redirect_uri
        
        flow = Flow.from_client_config(
            {
                'web': {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                }
            },
            scopes=self.SCOPES,
            redirect_uri=final_redirect_uri
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state
        )
        
        return auth_url
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens.
        
        Args:
            code: Authorization code from OAuth callback
            redirect_uri: Optional redirect URI used in authorization (must match)
            
        Returns:
            Dict containing access_token, refresh_token, and expires_at
        """
        # Use provided redirect_uri (from mobile) or default to backend redirect_uri
        final_redirect_uri = redirect_uri or self.redirect_uri
        
        flow = Flow.from_client_config(
            {
                'web': {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                }
            },
            scopes=self.SCOPES,
            redirect_uri=final_redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'expires_at': credentials.expiry,
        }
    
    def get_credentials_for_user(self, user) -> Optional[Credentials]:
        """
        Get valid Google credentials for a user.
        Automatically refreshes expired tokens.
        
        Args:
            user: Django User instance
            
        Returns:
            Google Credentials object or None
        """
        try:
            cal_creds = user.google_calendar_credentials
        except GoogleCalendarCredentials.DoesNotExist:
            return None
        
        if not cal_creds.is_active:
            return None
        
        credentials = Credentials(
            token=cal_creds.access_token,
            refresh_token=cal_creds.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self.client_id,
            client_secret=self.client_secret,
        )
        
        # Refresh if expired
        if cal_creds.is_token_expired():
            try:
                credentials.refresh(Request())
                cal_creds.access_token = credentials.token
                cal_creds.token_expiry = credentials.expiry
                cal_creds.save(update_fields=['_access_token', 'token_expiry', 'updated_at'])
            except Exception as e:
                logger.error(f"Failed to refresh token for user {user.id}: {e}")
                cal_creds.is_active = False
                cal_creds.sync_error = str(e)
                cal_creds.save(update_fields=['is_active', 'sync_error', 'updated_at'])
                return None
        
        return credentials
    
    def _get_calendar_service(self, user):
        """
        Get Google Calendar API service for a user.
        
        Args:
            user: Django User instance
            
        Returns:
            Google Calendar API service or None
        """
        credentials = self.get_credentials_for_user(user)
        if not credentials:
            return None
        
        return build('calendar', 'v3', credentials=credentials)
    
    def create_event(self, user, event_data: CalendarEventData, calendar_id: str = 'primary') -> Optional[Dict]:
        """
        Create a new event in the user's Google Calendar.
        
        Args:
            user: Django User instance
            event_data: CalendarEventData with event details
            calendar_id: Calendar ID to create event in
            
        Returns:
            Created event data or None
        """
        service = self._get_calendar_service(user)
        if not service:
            logger.warning(f"No calendar service available for user {user.id}")
            return None
        
        event_body = {
            'summary': event_data.summary,
            'description': event_data.description,
            'start': {
                'dateTime': event_data.start_datetime.isoformat(),
                'timeZone': event_data.timezone,
            },
            'end': {
                'dateTime': event_data.end_datetime.isoformat(),
                'timeZone': event_data.timezone,
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 60},
                    {'method': 'popup', 'minutes': 15},
                ],
            },
        }
        
        if event_data.location:
            event_body['location'] = event_data.location
        
        if event_data.attendees:
            event_body['attendees'] = [
                {'email': email} for email in event_data.attendees
            ]
        
        try:
            event = service.events().insert(
                calendarId=calendar_id,
                body=event_body,
                sendUpdates='all' if event_data.attendees else 'none'
            ).execute()
            
            logger.info(f"Created calendar event {event['id']} for user {user.id}")
            return event
            
        except HttpError as e:
            logger.error(f"Failed to create calendar event for user {user.id}: {e}")
            return None
    
    def update_event(
        self,
        user,
        event_id: str,
        event_data: CalendarEventData,
        calendar_id: str = 'primary'
    ) -> Optional[Dict]:
        """
        Update an existing event in the user's Google Calendar.
        
        Args:
            user: Django User instance
            event_id: Google Calendar event ID
            event_data: CalendarEventData with updated details
            calendar_id: Calendar ID containing the event
            
        Returns:
            Updated event data or None
        """
        service = self._get_calendar_service(user)
        if not service:
            return None
        
        event_body = {
            'summary': event_data.summary,
            'description': event_data.description,
            'start': {
                'dateTime': event_data.start_datetime.isoformat(),
                'timeZone': event_data.timezone,
            },
            'end': {
                'dateTime': event_data.end_datetime.isoformat(),
                'timeZone': event_data.timezone,
            },
        }
        
        if event_data.location:
            event_body['location'] = event_data.location
        
        try:
            event = service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event_body
            ).execute()
            
            logger.info(f"Updated calendar event {event_id} for user {user.id}")
            return event
            
        except HttpError as e:
            logger.error(f"Failed to update calendar event {event_id} for user {user.id}: {e}")
            return None
    
    def delete_event(self, user, event_id: str, calendar_id: str = 'primary') -> bool:
        """
        Delete an event from the user's Google Calendar.
        
        Args:
            user: Django User instance
            event_id: Google Calendar event ID
            calendar_id: Calendar ID containing the event
            
        Returns:
            True if deleted successfully, False otherwise
        """
        service = self._get_calendar_service(user)
        if not service:
            return False
        
        try:
            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            logger.info(f"Deleted calendar event {event_id} for user {user.id}")
            return True
            
        except HttpError as e:
            # 410 Gone means already deleted, which is fine
            if e.resp.status == 410:
                logger.info(f"Calendar event {event_id} already deleted")
                return True
            logger.error(f"Failed to delete calendar event {event_id} for user {user.id}: {e}")
            return False
    
    def get_busy_times(
        self,
        user,
        start_datetime: datetime,
        end_datetime: datetime,
        calendar_id: str = 'primary'
    ) -> List[BusyTime]:
        """
        Get busy times from the user's Google Calendar.
        
        Args:
            user: Django User instance
            start_datetime: Start of time range to check
            end_datetime: End of time range to check
            calendar_id: Calendar ID to check
            
        Returns:
            List of BusyTime objects
        """
        service = self._get_calendar_service(user)
        if not service:
            return []
        
        try:
            # Use freebusy query for efficient busy time lookup
            body = {
                'timeMin': start_datetime.isoformat() + 'Z' if start_datetime.tzinfo is None else start_datetime.isoformat(),
                'timeMax': end_datetime.isoformat() + 'Z' if end_datetime.tzinfo is None else end_datetime.isoformat(),
                'items': [{'id': calendar_id}],
            }
            
            result = service.freebusy().query(body=body).execute()
            
            busy_times = []
            calendar_busy = result.get('calendars', {}).get(calendar_id, {}).get('busy', [])
            
            for busy in calendar_busy:
                busy_times.append(BusyTime(
                    start=datetime.fromisoformat(busy['start'].replace('Z', '+00:00')),
                    end=datetime.fromisoformat(busy['end'].replace('Z', '+00:00')),
                ))
            
            logger.info(f"Retrieved {len(busy_times)} busy times for user {user.id}")
            return busy_times
            
        except HttpError as e:
            logger.error(f"Failed to get busy times for user {user.id}: {e}")
            return []
    
    def get_events(
        self,
        user,
        start_datetime: datetime,
        end_datetime: datetime,
        calendar_id: str = 'primary',
        max_results: int = 100
    ) -> List[Dict]:
        """
        Get events from the user's Google Calendar.
        
        Args:
            user: Django User instance
            start_datetime: Start of time range
            end_datetime: End of time range
            calendar_id: Calendar ID to query
            max_results: Maximum number of events to return
            
        Returns:
            List of event dictionaries
        """
        service = self._get_calendar_service(user)
        if not service:
            return []
        
        try:
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=start_datetime.isoformat() + 'Z' if start_datetime.tzinfo is None else start_datetime.isoformat(),
                timeMax=end_datetime.isoformat() + 'Z' if end_datetime.tzinfo is None else end_datetime.isoformat(),
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime',
                # Only show confirmed events (exclude cancelled)
                showDeleted=False
            ).execute()
            
            events = events_result.get('items', [])
            
            # Filter out cancelled events and optionally all-day events
            filtered_events = []
            for event in events:
                # Skip cancelled events
                if event.get('status') == 'cancelled':
                    continue
                
                # Skip events without a start time (shouldn't happen, but just in case)
                if not event.get('start'):
                    continue
                
                filtered_events.append(event)
            
            return filtered_events
            
        except HttpError as e:
            logger.error(f"Failed to get events for user {user.id}: {e}")
            return []
    
    def revoke_access(self, user) -> bool:
        """
        Revoke Google Calendar access for a user.
        
        Args:
            user: Django User instance
            
        Returns:
            True if revoked successfully
        """
        try:
            cal_creds = user.google_calendar_credentials
        except GoogleCalendarCredentials.DoesNotExist:
            return True
        
        try:
            import requests
            # Revoke the token
            requests.post(
                'https://oauth2.googleapis.com/revoke',
                params={'token': cal_creds.access_token},
                headers={'content-type': 'application/x-www-form-urlencoded'}
            )
        except Exception as e:
            logger.warning(f"Failed to revoke token for user {user.id}: {e}")
        
        # Delete the credentials regardless
        cal_creds.delete()
        logger.info(f"Revoked calendar access for user {user.id}")
        return True
    
    def has_calendar_connected(self, user) -> bool:
        """
        Check if a user has Google Calendar connected.
        
        Args:
            user: Django User instance
            
        Returns:
            True if calendar is connected and active
        """
        try:
            return user.google_calendar_credentials.is_active
        except GoogleCalendarCredentials.DoesNotExist:
            return False


# Singleton instance
google_calendar_service = GoogleCalendarService()




