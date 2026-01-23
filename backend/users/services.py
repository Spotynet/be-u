"""
Google Authentication Service

Provides OAuth flow helpers for Google Sign-In, user info retrieval,
and user linking/creation with encrypted token storage.
"""

import logging
from typing import Optional, Dict, Any
from urllib.request import urlopen

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone

from google_auth_oauthlib.flow import Flow

from .models import User, ClientProfile, GoogleAuthCredentials

logger = logging.getLogger(__name__)


class GoogleAuthService:
    SCOPES = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
    ]

    def __init__(self):
        self.client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        self.redirect_uri = getattr(settings, 'GOOGLE_REDIRECT_URI_AUTH', '')

    def get_auth_url(self, state: Optional[str] = None, redirect_uri: Optional[str] = None) -> str:
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

    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        # Use the OpenID userinfo endpoint
        import json
        from urllib.request import Request
        request = Request(
            'https://openidconnect.googleapis.com/v1/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        response = urlopen(request)
        return json.loads(response.read().decode('utf-8'))

    def _maybe_update_profile_image(self, user: User, picture_url: Optional[str]) -> None:
        if not picture_url or user.image:
            return
        try:
            image_data = urlopen(picture_url).read()
            filename = f"google_{user.id}.jpg"
            user.image.save(filename, ContentFile(image_data), save=True)
        except Exception as exc:
            logger.warning(f"Failed to import Google profile image for user {user.id}: {exc}")

    def create_or_update_user(self, google_user_data: Dict[str, Any]) -> User:
        email = google_user_data.get('email', '').strip().lower()
        given_name = google_user_data.get('given_name', '') or ''
        family_name = google_user_data.get('family_name', '') or ''
        picture_url = google_user_data.get('picture')

        if not email:
            raise ValueError("Google user info missing email")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': given_name,
                'last_name': family_name,
            }
        )

        if created:
            user.set_unusable_password()
            user.save(update_fields=['password'])
            ClientProfile.objects.get_or_create(user=user)
        else:
            # Keep user info fresh
            user.first_name = given_name or user.first_name
            user.last_name = family_name or user.last_name
            user.save(update_fields=['first_name', 'last_name'])

        self._maybe_update_profile_image(user, picture_url)
        return user

    def link_google_account(self, user: User, google_user_data: Dict[str, Any], tokens: Dict[str, Any]) -> GoogleAuthCredentials:
        google_id = google_user_data.get('sub') or google_user_data.get('id')
        if not google_id:
            raise ValueError("Google user info missing id")

        email_verified = bool(google_user_data.get('email_verified'))
        picture_url = google_user_data.get('picture')

        credentials, _ = GoogleAuthCredentials.objects.update_or_create(
            user=user,
            defaults={
                'google_id': google_id,
                'email_verified': email_verified,
                'picture_url': picture_url,
                'access_token': tokens.get('access_token'),
                'refresh_token': tokens.get('refresh_token'),
                'token_expiry': tokens.get('expires_at', timezone.now()),
                'is_active': True,
            }
        )
        return credentials


google_auth_service = GoogleAuthService()
