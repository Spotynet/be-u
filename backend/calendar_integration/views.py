"""
Google Calendar Integration Views

Provides API endpoints for:
- OAuth authorization flow
- Calendar connection management
- Busy times retrieval
"""

import logging
import secrets
from datetime import datetime

from django.utils import timezone
from django.shortcuts import render, redirect
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GoogleCalendarCredentials, GoogleOAuthPendingCode
from .services import google_calendar_service, BusyTime
from .serializers import (
    CalendarAuthUrlSerializer,
    CalendarCallbackSerializer,
    CalendarStatusSerializer,
    BusyTimeSerializer,
    BusyTimesRequestSerializer,
)

logger = logging.getLogger(__name__)


class CalendarAuthUrlView(APIView):
    """
    GET /api/calendar/auth-url/
    
    Returns the Google OAuth authorization URL for connecting calendar.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state in session for verification
        request.session['google_oauth_state'] = state
        
        # Allow mobile app to specify its own redirect URI
        # This is needed because mobile apps use custom URL schemes (e.g., mypikapp://)
        mobile_redirect_uri = request.query_params.get('redirect_uri', None)
        
        auth_url = google_calendar_service.get_auth_url(
            state=state,
            redirect_uri=mobile_redirect_uri
        )
        
        serializer = CalendarAuthUrlSerializer({
            'auth_url': auth_url,
            'state': state,
        })
        
        return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([])  # Allow unauthenticated GET from Google; we'll enforce auth manually for POST
def calendar_callback(request):
    """
    GET/POST /api/calendar/callback/
    
    Handle OAuth callback from Google.
    For GET requests (web redirect), show a page that closes automatically.
    For POST requests (mobile), exchange code for tokens.
    """
    if request.method == 'GET':
        # This is a web redirect from Google OAuth
        # Show a page that tells user to return to app
        code = request.GET.get('code')
        state = request.GET.get('state')
        error = request.GET.get('error')
        
        if error:
            return render(request, 'calendar_integration/callback_page.html', {
                'error': error,
                'error_description': request.GET.get('error_description', '')
            })
        
        if code and state:
            # Store code in database temporarily for mobile to pick up
            # This works in production where session cookies aren't available
            redirect_uri_used = request.build_absolute_uri(request.path)
            
            # Delete any existing pending code for this state
            GoogleOAuthPendingCode.objects.filter(state=state).delete()
            
            # Create new pending code
            GoogleOAuthPendingCode.objects.create(
                state=state,
                code=code,
                redirect_uri=redirect_uri_used
            )
            
            logger.info(f"Stored OAuth code for state {state[:8]}... (production callback)")
            
            # Show success page
            return render(request, 'calendar_integration/callback_page.html', {
                'success': True
            })
        
        return render(request, 'calendar_integration/callback_page.html')
    
    # POST request from mobile app (must be authenticated)
    if not request.user or not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Now we know the user is authenticated
    serializer = CalendarCallbackSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    code = serializer.validated_data.get('code')
    state = serializer.validated_data.get('state')
    redirect_uri = request.data.get('redirect_uri')  # Get redirect_uri from mobile
    
    # If no code provided but we have state, try to get code from pending storage (production flow)
    if not code and state:
        try:
            pending_code = GoogleOAuthPendingCode.objects.get(state=state)
            
            # Check if expired
            if pending_code.is_expired():
                pending_code.delete()
                return Response(
                    {'error': 'Authorization code has expired. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the stored code and redirect_uri
            code = pending_code.code
            if not redirect_uri:
                redirect_uri = pending_code.redirect_uri
            
            # Delete the pending code (one-time use)
            pending_code.delete()
            
            logger.info(f"Retrieved OAuth code from pending storage for state {state[:8]}...")
        except GoogleOAuthPendingCode.DoesNotExist:
            # Fallback to session (development)
            session_code = request.session.get('google_oauth_code')
            if session_code:
                code = session_code
                del request.session['google_oauth_code']
                if not redirect_uri:
                    redirect_uri = None
    
    if not code:
        return Response(
            {'error': 'No authorization code provided. Please complete the OAuth flow again.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify state if stored in session (development)
    stored_state = request.session.get('google_oauth_state')
    if stored_state and state and stored_state != state:
        return Response(
            {'error': 'Invalid state parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Clear the state from session if exists
    if 'google_oauth_state' in request.session:
        del request.session['google_oauth_state']
    
    try:
        # Exchange code for tokens using the same redirect_uri that was used in authorization
        tokens = google_calendar_service.exchange_code_for_tokens(code, redirect_uri=redirect_uri)
        
        # Save or update credentials
        credentials, created = GoogleCalendarCredentials.objects.update_or_create(
            user=request.user,
            defaults={
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token'],
                'token_expiry': tokens['expires_at'],
                'is_active': True,
                'sync_error': None,
            }
        )
        
        # Update has_calendar flag on user's public profile if exists
        if hasattr(request.user, 'public_profile'):
            request.user.public_profile.has_calendar = True
            request.user.public_profile.save(update_fields=['has_calendar'])
        
        logger.info(f"Google Calendar connected for user {request.user.id}")
        
        return Response({
            'message': 'Google Calendar connected successfully',
            'is_connected': True,
            'calendar_id': credentials.calendar_id,
        })
        
    except Exception as e:
        logger.error(f"Failed to connect Google Calendar for user {request.user.id}: {e}")
        return Response(
            {'error': f'Failed to connect Google Calendar: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )




class CalendarDisconnectView(APIView):
    """
    POST /api/calendar/disconnect/
    
    Disconnect Google Calendar and revoke access.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            google_calendar_service.revoke_access(request.user)
            
            # Update has_calendar flag on user's public profile if exists
            if hasattr(request.user, 'public_profile'):
                request.user.public_profile.has_calendar = False
                request.user.public_profile.save(update_fields=['has_calendar'])
            
            logger.info(f"Google Calendar disconnected for user {request.user.id}")
            
            return Response({
                'message': 'Google Calendar disconnected successfully',
                'is_connected': False,
            })
            
        except Exception as e:
            logger.error(f"Failed to disconnect Google Calendar for user {request.user.id}: {e}")
            return Response(
                {'error': f'Failed to disconnect: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CalendarStatusView(APIView):
    """
    GET /api/calendar/status/
    
    Check if Google Calendar is connected for the current user.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            credentials = request.user.google_calendar_credentials
            serializer = CalendarStatusSerializer({
                'is_connected': credentials.is_active,
                'calendar_id': credentials.calendar_id,
                'last_sync_at': credentials.last_sync_at,
                'sync_error': credentials.sync_error,
                'is_active': credentials.is_active,
            })
        except GoogleCalendarCredentials.DoesNotExist:
            serializer = CalendarStatusSerializer({
                'is_connected': False,
                'calendar_id': None,
                'last_sync_at': None,
                'sync_error': None,
                'is_active': False,
            })
        
        return Response(serializer.data)


class CalendarBusyTimesView(APIView):
    """
    GET /api/calendar/busy-times/
    
    Get busy times from Google Calendar for a date range.
    Query params: start, end (ISO datetime strings)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        
        if not start_str or not end_str:
            return Response(
                {'error': 'start and end query parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Invalid datetime format. Use ISO format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        busy_times = google_calendar_service.get_busy_times(request.user, start, end)
        
        serializer = BusyTimeSerializer(
            [{'start': bt.start, 'end': bt.end} for bt in busy_times],
            many=True
        )
        
        return Response({
            'busy_times': serializer.data,
            'count': len(busy_times),
        })


class CalendarEventsView(APIView):
    """
    GET /api/calendar/events/
    
    Get events from Google Calendar for a date range.
    Query params: start, end (ISO datetime strings), max_results (optional)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        max_results = int(request.query_params.get('max_results', 50))
        
        if not start_str or not end_str:
            return Response(
                {'error': 'start and end query parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Invalid datetime format. Use ISO format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not google_calendar_service.has_calendar_connected(request.user):
            return Response({
                'events': [],
                'count': 0,
                'has_calendar': False,
            })
        
        try:
            credentials = request.user.google_calendar_credentials
            calendar_id = credentials.calendar_id
        except:
            calendar_id = 'primary'
        
        events = google_calendar_service.get_events(
            request.user,
            start,
            end,
            calendar_id=calendar_id,
            max_results=max_results
        )
        
        # Format events for response
        formatted_events = []
        for event in events:
            start_time = event.get('start', {}).get('dateTime') or event.get('start', {}).get('date')
            end_time = event.get('end', {}).get('dateTime') or event.get('end', {}).get('date')
            
            # Determine if it's an all-day event
            is_all_day = 'date' in event.get('start', {}) and 'dateTime' not in event.get('start', {})
            
            formatted_events.append({
                'id': event.get('id'),
                'summary': event.get('summary', 'Sin título'),
                'description': event.get('description', ''),
                'location': event.get('location', ''),
                'start': start_time,
                'end': end_time,
                'htmlLink': event.get('htmlLink'),
                'status': event.get('status'),
                'attendees': event.get('attendees', []),
                'is_all_day': is_all_day,
            })
        
        return Response({
            'events': formatted_events,
            'count': len(formatted_events),
            'has_calendar': True,
        })


class CalendarSyncView(APIView):
    """
    POST /api/calendar/sync-availability/
    
    Manually trigger availability sync from Google Calendar.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not google_calendar_service.has_calendar_connected(request.user):
            return Response(
                {'error': 'Google Calendar not connected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update last sync time
            credentials = request.user.google_calendar_credentials
            credentials.last_sync_at = timezone.now()
            credentials.sync_error = None
            credentials.save(update_fields=['last_sync_at', 'sync_error', 'updated_at'])
            
            return Response({
                'message': 'Calendar sync completed',
                'last_sync_at': credentials.last_sync_at,
            })
            
        except Exception as e:
            logger.error(f"Failed to sync calendar for user {request.user.id}: {e}")
            
            try:
                credentials = request.user.google_calendar_credentials
                credentials.sync_error = str(e)
                credentials.save(update_fields=['sync_error', 'updated_at'])
            except:
                pass
            
            return Response(
                {'error': f'Sync failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def provider_busy_times(request, provider_type, provider_id):
    """
    GET /api/calendar/provider-busy-times/<provider_type>/<provider_id>/
    
    Get busy times for a specific provider (for availability display).
    Public endpoint for viewing provider availability.
    """
    from users.models import ProfessionalProfile, PlaceProfile
    
    start_str = request.query_params.get('start')
    end_str = request.query_params.get('end')
    
    if not start_str or not end_str:
        return Response(
            {'error': 'start and end query parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
    except ValueError:
        return Response(
            {'error': 'Invalid datetime format. Use ISO format.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get provider user
    try:
        if provider_type == 'professional':
            profile = ProfessionalProfile.objects.get(id=provider_id)
        elif provider_type == 'place':
            profile = PlaceProfile.objects.get(id=provider_id)
        else:
            return Response(
                {'error': 'Invalid provider type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = profile.user
    except (ProfessionalProfile.DoesNotExist, PlaceProfile.DoesNotExist):
        return Response(
            {'error': 'Provider not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get busy times if calendar is connected
    if google_calendar_service.has_calendar_connected(user):
        busy_times = google_calendar_service.get_busy_times(user, start, end)
        serializer = BusyTimeSerializer(
            [{'start': bt.start, 'end': bt.end} for bt in busy_times],
            many=True
        )
        
        return Response({
            'has_calendar': True,
            'busy_times': serializer.data,
            'count': len(busy_times),
        })
    else:
        return Response({
            'has_calendar': False,
            'busy_times': [],
            'count': 0,
        })




