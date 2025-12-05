from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet
import base64
import os


def get_encryption_key():
    """Get or generate encryption key for token storage"""
    key = getattr(settings, 'GOOGLE_TOKEN_ENCRYPTION_KEY', None)
    if not key:
        # Generate a key from Django's SECRET_KEY
        secret = settings.SECRET_KEY.encode()
        # Pad or truncate to 32 bytes for Fernet
        key = base64.urlsafe_b64encode(secret[:32].ljust(32, b'0'))
    return key


class GoogleCalendarCredentials(models.Model):
    """
    Stores encrypted Google OAuth tokens for calendar integration.
    Tokens are encrypted at rest for security.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='google_calendar_credentials'
    )
    
    # Encrypted token storage
    _access_token = models.TextField(db_column='access_token')
    _refresh_token = models.TextField(db_column='refresh_token')
    
    # Token metadata
    token_expiry = models.DateTimeField(
        help_text="When the access token expires"
    )
    
    # Calendar settings
    calendar_id = models.CharField(
        max_length=255,
        default='primary',
        help_text="Google Calendar ID to use (default: primary)"
    )
    
    # Connection status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the calendar connection is active"
    )
    
    # Sync metadata
    last_sync_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time availability was synced from Google Calendar"
    )
    sync_error = models.TextField(
        null=True,
        blank=True,
        help_text="Last sync error message, if any"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Google Calendar Credentials'
        verbose_name_plural = 'Google Calendar Credentials'
    
    def __str__(self):
        status = "active" if self.is_active else "inactive"
        return f"{self.user.email} - Google Calendar ({status})"
    
    def _get_fernet(self):
        """Get Fernet instance for encryption/decryption"""
        return Fernet(get_encryption_key())
    
    @property
    def access_token(self):
        """Decrypt and return access token"""
        if not self._access_token:
            return None
        try:
            fernet = self._get_fernet()
            return fernet.decrypt(self._access_token.encode()).decode()
        except Exception:
            return None
    
    @access_token.setter
    def access_token(self, value):
        """Encrypt and store access token"""
        if value:
            fernet = self._get_fernet()
            self._access_token = fernet.encrypt(value.encode()).decode()
        else:
            self._access_token = ''
    
    @property
    def refresh_token(self):
        """Decrypt and return refresh token"""
        if not self._refresh_token:
            return None
        try:
            fernet = self._get_fernet()
            return fernet.decrypt(self._refresh_token.encode()).decode()
        except Exception:
            return None
    
    @refresh_token.setter
    def refresh_token(self, value):
        """Encrypt and store refresh token"""
        if value:
            fernet = self._get_fernet()
            self._refresh_token = fernet.encrypt(value.encode()).decode()
        else:
            self._refresh_token = ''
    
    def is_token_expired(self):
        """Check if the access token has expired"""
        from django.utils import timezone
        if not self.token_expiry:
            return True
        return timezone.now() >= self.token_expiry
    
    def deactivate(self):
        """Deactivate the calendar connection"""
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])


class CalendarEvent(models.Model):
    """
    Tracks Google Calendar events created by the system.
    Used to manage event updates and deletions.
    """
    # Link to reservation
    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='calendar_event'
    )
    
    # Google Calendar event details
    google_event_id = models.CharField(
        max_length=255,
        help_text="Google Calendar event ID"
    )
    calendar_id = models.CharField(
        max_length=255,
        default='primary',
        help_text="Google Calendar ID where event was created"
    )
    
    # Owner of the calendar (provider)
    calendar_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calendar_events'
    )
    
    # Event metadata
    event_link = models.URLField(
        null=True,
        blank=True,
        help_text="Link to view the event in Google Calendar"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Calendar Event'
        verbose_name_plural = 'Calendar Events'
        indexes = [
            models.Index(fields=['google_event_id']),
            models.Index(fields=['calendar_owner']),
        ]
    
    def __str__(self):
        return f"Event {self.google_event_id} for Reservation {self.reservation.code}"


class GoogleOAuthPendingCode(models.Model):
    """
    Temporary storage for OAuth authorization codes received from Google.
    Used to bridge the gap between web redirect (GET) and mobile app (POST) in production.
    """
    state = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="OAuth state parameter used to link authorization code"
    )
    code = models.TextField(
        help_text="Authorization code from Google OAuth"
    )
    redirect_uri = models.URLField(
        help_text="Redirect URI used in the OAuth flow"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this code was received"
    )
    
    class Meta:
        verbose_name = 'Pending OAuth Code'
        verbose_name_plural = 'Pending OAuth Codes'
        indexes = [
            models.Index(fields=['state']),
        ]
    
    def __str__(self):
        return f"OAuth code for state {self.state[:8]}..."
    
    def is_expired(self, max_age_minutes=10):
        """Check if the code has expired (default 10 minutes)"""
        from django.utils import timezone
        from datetime import timedelta
        age = timezone.now() - self.created_at
        return age > timedelta(minutes=max_age_minutes)






