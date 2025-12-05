"""
Tests for Google Calendar Integration

These tests cover the calendar integration functionality including:
- OAuth flow
- Event creation/deletion
- Busy times retrieval
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from .models import GoogleCalendarCredentials, CalendarEvent
from .services import GoogleCalendarService, CalendarEventData, BusyTime

User = get_user_model()


class GoogleCalendarCredentialsModelTest(TestCase):
    """Tests for GoogleCalendarCredentials model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='pro@test.com',
            password='testpass123',
            role='PROFESSIONAL'
        )
    
    def test_token_encryption(self):
        """Test that tokens are encrypted when stored"""
        credentials = GoogleCalendarCredentials.objects.create(
            user=self.user,
            access_token='test_access_token',
            refresh_token='test_refresh_token',
            token_expiry=datetime.now() + timedelta(hours=1),
        )
        
        # Raw database value should be encrypted (different from input)
        self.assertNotEqual(credentials._access_token, 'test_access_token')
        self.assertNotEqual(credentials._refresh_token, 'test_refresh_token')
        
        # But property should return decrypted value
        self.assertEqual(credentials.access_token, 'test_access_token')
        self.assertEqual(credentials.refresh_token, 'test_refresh_token')
    
    def test_token_expiry_check(self):
        """Test token expiry detection"""
        # Expired token
        credentials = GoogleCalendarCredentials.objects.create(
            user=self.user,
            access_token='token',
            refresh_token='refresh',
            token_expiry=datetime.now() - timedelta(hours=1),
        )
        self.assertTrue(credentials.is_token_expired())
        
        # Valid token
        credentials.token_expiry = datetime.now() + timedelta(hours=1)
        credentials.save()
        self.assertFalse(credentials.is_token_expired())


class CalendarStatusAPITest(APITestCase):
    """Tests for calendar status endpoint"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='pro@test.com',
            password='testpass123',
            role='PROFESSIONAL'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_status_not_connected(self):
        """Test status when calendar is not connected"""
        response = self.client.get('/api/calendar/status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_connected'])
        self.assertIsNone(response.data['calendar_id'])
    
    def test_status_connected(self):
        """Test status when calendar is connected"""
        GoogleCalendarCredentials.objects.create(
            user=self.user,
            access_token='token',
            refresh_token='refresh',
            token_expiry=datetime.now() + timedelta(hours=1),
            is_active=True,
        )
        
        response = self.client.get('/api/calendar/status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_connected'])
        self.assertEqual(response.data['calendar_id'], 'primary')


class CalendarAuthAPITest(APITestCase):
    """Tests for calendar OAuth endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='pro@test.com',
            password='testpass123',
            role='PROFESSIONAL'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    @override_settings(
        GOOGLE_CLIENT_ID='test_client_id',
        GOOGLE_CLIENT_SECRET='test_secret',
        GOOGLE_REDIRECT_URI='http://localhost:8000/api/calendar/callback/'
    )
    def test_get_auth_url(self):
        """Test getting OAuth authorization URL"""
        response = self.client.get('/api/calendar/auth-url/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('auth_url', response.data)
        self.assertIn('state', response.data)
        self.assertIn('accounts.google.com', response.data['auth_url'])
    
    @patch('calendar_integration.views.google_calendar_service.exchange_code_for_tokens')
    def test_callback_success(self, mock_exchange):
        """Test successful OAuth callback"""
        mock_exchange.return_value = {
            'access_token': 'new_access_token',
            'refresh_token': 'new_refresh_token',
            'expires_at': datetime.now() + timedelta(hours=1),
        }
        
        response = self.client.post('/api/calendar/callback/', {
            'code': 'test_auth_code',
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_connected'])
        
        # Verify credentials were saved
        self.assertTrue(
            GoogleCalendarCredentials.objects.filter(user=self.user).exists()
        )


class CalendarServiceTest(TestCase):
    """Tests for GoogleCalendarService"""
    
    def setUp(self):
        self.service = GoogleCalendarService()
        self.user = User.objects.create_user(
            email='pro@test.com',
            password='testpass123',
            role='PROFESSIONAL'
        )
    
    def test_has_calendar_connected_false(self):
        """Test has_calendar_connected when not connected"""
        self.assertFalse(self.service.has_calendar_connected(self.user))
    
    def test_has_calendar_connected_true(self):
        """Test has_calendar_connected when connected"""
        GoogleCalendarCredentials.objects.create(
            user=self.user,
            access_token='token',
            refresh_token='refresh',
            token_expiry=datetime.now() + timedelta(hours=1),
            is_active=True,
        )
        self.assertTrue(self.service.has_calendar_connected(self.user))
    
    def test_has_calendar_connected_inactive(self):
        """Test has_calendar_connected when credentials are inactive"""
        GoogleCalendarCredentials.objects.create(
            user=self.user,
            access_token='token',
            refresh_token='refresh',
            token_expiry=datetime.now() + timedelta(hours=1),
            is_active=False,
        )
        self.assertFalse(self.service.has_calendar_connected(self.user))


class CalendarEventDataTest(TestCase):
    """Tests for CalendarEventData dataclass"""
    
    def test_event_data_creation(self):
        """Test creating CalendarEventData"""
        event = CalendarEventData(
            summary='Test Event',
            description='Test Description',
            start_datetime=datetime(2024, 1, 15, 10, 0),
            end_datetime=datetime(2024, 1, 15, 11, 0),
            location='Test Location',
            attendees=['test@example.com'],
        )
        
        self.assertEqual(event.summary, 'Test Event')
        self.assertEqual(event.timezone, 'America/Mexico_City')
        self.assertEqual(len(event.attendees), 1)


class BusyTimeTest(TestCase):
    """Tests for BusyTime dataclass"""
    
    def test_busy_time_creation(self):
        """Test creating BusyTime"""
        busy = BusyTime(
            start=datetime(2024, 1, 15, 10, 0),
            end=datetime(2024, 1, 15, 11, 0),
        )
        
        self.assertEqual(busy.start.hour, 10)
        self.assertEqual(busy.end.hour, 11)






