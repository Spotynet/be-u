from rest_framework import serializers
from .models import GoogleCalendarCredentials, CalendarEvent


class GoogleCalendarCredentialsSerializer(serializers.ModelSerializer):
    """Serializer for Google Calendar credentials (read-only, excludes sensitive data)"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    is_token_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = GoogleCalendarCredentials
        fields = [
            'id',
            'user_email',
            'calendar_id',
            'is_active',
            'last_sync_at',
            'sync_error',
            'is_token_expired',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields
    
    def get_is_token_expired(self, obj):
        return obj.is_token_expired()


class CalendarStatusSerializer(serializers.Serializer):
    """Serializer for calendar connection status"""
    
    is_connected = serializers.BooleanField()
    calendar_id = serializers.CharField(allow_null=True)
    last_sync_at = serializers.DateTimeField(allow_null=True)
    sync_error = serializers.CharField(allow_null=True)
    is_active = serializers.BooleanField()


class CalendarAuthUrlSerializer(serializers.Serializer):
    """Serializer for auth URL response"""
    
    auth_url = serializers.URLField()
    state = serializers.CharField(allow_null=True)


class CalendarCallbackSerializer(serializers.Serializer):
    """Serializer for OAuth callback request"""
    
    code = serializers.CharField(required=False, allow_null=True)
    state = serializers.CharField(required=False, allow_null=True)
    redirect_uri = serializers.CharField(required=False, allow_null=True)


class BusyTimeSerializer(serializers.Serializer):
    """Serializer for busy time periods"""
    
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()


class BusyTimesRequestSerializer(serializers.Serializer):
    """Serializer for busy times request"""
    
    start = serializers.DateTimeField(required=True)
    end = serializers.DateTimeField(required=True)


class CalendarEventSerializer(serializers.ModelSerializer):
    """Serializer for calendar events"""
    
    reservation_code = serializers.CharField(source='reservation.code', read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = [
            'id',
            'reservation',
            'reservation_code',
            'google_event_id',
            'calendar_id',
            'event_link',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields




