from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from cryptography.fernet import Fernet
import base64


# ======================
# USUARIO BASE
# ======================
class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        PROFESSIONAL = "PROFESSIONAL", "Professional"
        PLACE = "PLACE", "Place"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT
    )

    # Use email as the unique identifier
    email = models.EmailField(unique=True)
    
    # Make username optional since we're using email
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    
    # Phone number for all users
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Country for all users
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # Profile image for all users
    image = models.ImageField(upload_to="users/images/", blank=True, null=True)
    
    # Address and location for all users
    address = models.CharField(max_length=500, blank=True, null=True, help_text="Full address string")
    latitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Auto-generate a UNIQUE username from email prefix if not provided
        if not self.username and self.email:
            base = self.email.split('@')[0]
            candidate = base
            i = 0
            # Ensure uniqueness (avoid collisions like john@gmail.com and john@yahoo.com)
            while User.objects.filter(username=candidate).exclude(pk=self.pk).exists():
                i += 1
                candidate = f"{base}{i}"
            self.username = candidate
        super().save(*args, **kwargs)


class EmailAuthCode(models.Model):
    """One-time email auth code for passwordless login/verification."""

    email = models.EmailField(db_index=True)
    # Store a hash of the code, never the plaintext
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(blank=True, null=True)
    attempts = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Indexes removed to prevent Django from generating problematic rename migrations
        # The email field has db_index=True, so single-column index is still created
        # Composite indexes can be added manually via SQL if needed for performance
        pass

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() >= self.expires_at

    def is_consumed(self):
        return self.consumed_at is not None


def get_encryption_key():
    """Get or generate encryption key for token storage"""
    key = getattr(settings, 'GOOGLE_TOKEN_ENCRYPTION_KEY', None)
    if not key:
        # Generate a key from Django's SECRET_KEY
        secret = settings.SECRET_KEY.encode()
        # Pad or truncate to 32 bytes for Fernet
        key = base64.urlsafe_b64encode(secret[:32].ljust(32, b'0'))
    return key


class GoogleAuthCredentials(models.Model):
    """
    Stores encrypted Google OAuth tokens for authentication.
    Tokens are encrypted at rest for security.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='google_auth_credentials'
    )

    google_id = models.CharField(max_length=255, unique=True)
    email_verified = models.BooleanField(default=False)
    picture_url = models.URLField(blank=True, null=True)

    # Encrypted token storage
    _access_token = models.TextField(db_column='access_token')
    _refresh_token = models.TextField(db_column='refresh_token')

    # Token metadata
    token_expiry = models.DateTimeField(
        help_text="When the access token expires"
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Whether the Google auth connection is active"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Google Auth Credentials'
        verbose_name_plural = 'Google Auth Credentials'

    def __str__(self):
        status = "active" if self.is_active else "inactive"
        return f"{self.user.email} - Google Auth ({status})"

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


class GoogleAuthPendingCode(models.Model):
    """
    Temporary storage for Google Auth authorization codes received from Google (GET redirect).
    Used to bridge web redirect (GET) and mobile app token exchange (POST) in production.
    """
    state = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="OAuth state parameter used to link authorization code",
    )
    code = models.TextField(
        help_text="Authorization code from Google OAuth",
    )
    redirect_uri = models.URLField(
        help_text="Redirect URI used in the OAuth flow",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this code was received",
    )

    class Meta:
        verbose_name = "Pending Google Auth Code"
        verbose_name_plural = "Pending Google Auth Codes"
        # Index removed - state field has db_index=True, so single-column index is still created
        pass

    def __str__(self):
        return f"Google auth code for state {self.state[:8]}..."

    def is_expired(self, max_age_minutes=10):
        """Check if the code has expired (default 10 minutes)"""
        from django.utils import timezone
        from datetime import timedelta

        age = timezone.now() - self.created_at
        return age > timedelta(minutes=max_age_minutes)


# ======================
# PERFILES DE USUARIO
# ======================
class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    phone = models.CharField(max_length=20, blank=True, null=True)
    photo = models.ImageField(upload_to="clients/photos/", blank=True, null=True)
    # Note: address, latitude, longitude are now stored in User model

    def __str__(self):
        return f"Client: {self.user.username}"


class ProfessionalProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="professional_profile")
    name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)  # promedio de reseñas
    category = models.JSONField(default=list, blank=True, help_text="List of main categories")
    sub_categories = models.JSONField(default=list, blank=True, help_text="List of sub-categories")

    def __str__(self):
        return f"Professional: {self.name} {self.last_name}"


class PlaceProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="place_profile")
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True, null=True, help_text="Biography/About section for the place")
    description = models.TextField(blank=True, null=True, help_text="Description of the place")
    street = models.CharField(max_length=200)
    number_ext = models.CharField(max_length=20, blank=True, null=True)
    number_int = models.CharField(max_length=20, blank=True, null=True)
    postal_code = models.CharField(max_length=10)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="owned_places")
    category = models.JSONField(default=list, blank=True, help_text="List of main categories")
    sub_categories = models.JSONField(default=list, blank=True, help_text="List of sub-categories")

    def __str__(self):
        return f"Place: {self.name}"


class PublicProfile(models.Model):
    """Unified profile model for both professionals and places"""
    PROFILE_TYPE_CHOICES = [
        ('PROFESSIONAL', 'Professional'),
        ('PLACE', 'Place'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="public_profile")
    profile_type = models.CharField(max_length=20, choices=PROFILE_TYPE_CHOICES)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.JSONField(default=list, blank=True, help_text="List of main categories")
    sub_categories = models.JSONField(default=list, blank=True, help_text="List of sub-categories")
    images = models.JSONField(default=list, blank=True, help_text="List of image URLs/paths")
    linked_pros_place = models.JSONField(default=list, blank=True, help_text="List of linked professional/place IDs")
    has_calendar = models.BooleanField(default=False, help_text="Whether this profile has calendar functionality")
    # Geolocation (only for PROFESSIONAL and PLACE)
    latitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Place-specific fields
    street = models.CharField(max_length=200, blank=True, null=True)
    number_ext = models.CharField(max_length=20, blank=True, null=True)
    number_int = models.CharField(max_length=20, blank=True, null=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # Professional-specific fields
    last_name = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.profile_type}: {self.name}"
    
    @property
    def display_name(self):
        """Get display name based on profile type"""
        if self.profile_type == 'PROFESSIONAL' and self.last_name:
            return f"{self.name} {self.last_name}"
        return self.name