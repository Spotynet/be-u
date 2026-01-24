from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, ClientProfile, ProfessionalProfile, PlaceProfile, PublicProfile, EmailAuthCode
from .serializers import (
    UserSerializer,
    GoogleAuthUrlSerializer,
    GoogleCallbackSerializer,
    EmailCodeRequestSerializer,
    EmailCodeVerifySerializer,
)
from .services import google_auth_service
from calendar_integration.models import GoogleCalendarCredentials
import json
import logging
import secrets
import hashlib
import hmac
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.shortcuts import render
from .models import GoogleAuthPendingCode

# Get logger for this module
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user using email (since USERNAME_FIELD is email)
        user = authenticate(username=email, password=password)
        if user is not None:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'message': 'Login successful',
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def google_auth_url_view(request):
    """
    GET /api/auth/google/auth-url/

    Returns the Google OAuth authorization URL for Google Sign-In.
    """
    state = secrets.token_urlsafe(32)
    request.session['google_auth_state'] = state
    mobile_redirect_uri = request.query_params.get('redirect_uri', None)
    auth_url = google_auth_service.get_auth_url(state=state, redirect_uri=mobile_redirect_uri)
    serializer = GoogleAuthUrlSerializer({
        'auth_url': auth_url,
        'state': state,
    })
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def google_callback_view(request):
    """
    GET/POST /api/auth/google/callback/

    - GET: OAuth redirect target from Google (must be allowed + will contain ?code=...&state=...)
    - POST: Exchange code for tokens, create/update user, and return JWT tokens.
    """
    if request.method == 'GET':
        # Google redirects via GET. In production, we persist the code so the mobile app can
        # exchange it later via POST even if the browser doesn't return cleanly to the app.
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        error = request.query_params.get('error')
        error_description = request.query_params.get('error_description', '')

        if error:
          return render(
              request,
              "users/google_auth_callback.html",
              {"error": error, "error_description": error_description},
          )

        if code and state:
            redirect_uri_used = request.build_absolute_uri(request.path)

            # Replace any existing pending code for this state
            GoogleAuthPendingCode.objects.filter(state=state).delete()
            GoogleAuthPendingCode.objects.create(
                state=state,
                code=code,
                redirect_uri=redirect_uri_used,
            )

            logger.info(f"Stored Google auth code for state {state[:8]}... (production callback)")
            return render(request, "users/google_auth_callback.html", {"success": True, "state": state})

        # Fallback (no params)
        return render(request, "users/google_auth_callback.html", {"success": True, "state": state})

    serializer = GoogleCallbackSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    code = serializer.validated_data.get('code') or None
    state = serializer.validated_data.get('state') or None
    redirect_uri = serializer.validated_data.get('redirect_uri') or None

    # Production flow: allow exchanging using only state (code was stored during GET redirect)
    if not code and state:
        try:
            pending = GoogleAuthPendingCode.objects.get(state=state)
            if pending.is_expired():
                pending.delete()
                return Response(
                    {'error': 'Authorization code has expired. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            code = pending.code
            if not redirect_uri:
                redirect_uri = pending.redirect_uri
            pending.delete()
        except GoogleAuthPendingCode.DoesNotExist:
            # Client may be polling before the GET redirect is processed
            return Response(
                {'error': 'Authorization code not found yet. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    stored_state = request.session.get('google_auth_state')
    if stored_state and state and stored_state != state:
        return Response({'error': 'Invalid state parameter'}, status=status.HTTP_400_BAD_REQUEST)
    if 'google_auth_state' in request.session:
        del request.session['google_auth_state']

    try:
        if not code:
            return Response({'error': 'No authorization code provided.'}, status=status.HTTP_400_BAD_REQUEST)
        tokens = google_auth_service.exchange_code_for_tokens(code, redirect_uri=redirect_uri)
        google_user_data = google_auth_service.get_user_info(tokens['access_token'])

        if not google_user_data.get('email_verified', False):
            return Response({'error': 'Email not verified with Google'}, status=status.HTTP_400_BAD_REQUEST)

        google_id = google_user_data.get('sub') or google_user_data.get('id')
        email = google_user_data.get('email', '').strip().lower()
        
        # Check if user exists by Google ID or email
        if google_id and User.objects.filter(google_auth_credentials__google_id=google_id).exists():
            existing_user = User.objects.filter(google_auth_credentials__google_id=google_id).first()
        elif email and User.objects.filter(email=email).exists():
            existing_user = User.objects.filter(email=email).first()
        else:
            existing_user = None

        # If user doesn't exist, return Google data for registration
        if not existing_user:
            return Response({
                'requires_registration': True,
                'google_user_data': {
                    'email': email,
                    'first_name': google_user_data.get('given_name', ''),
                    'last_name': google_user_data.get('family_name', ''),
                    'picture': google_user_data.get('picture'),
                },
                'google_id': google_id,
                'tokens': {
                    'access_token': tokens.get('access_token'),
                    'refresh_token': tokens.get('refresh_token'),
                }
            }, status=status.HTTP_200_OK)

        user = google_auth_service.create_or_update_user(google_user_data)
        if existing_user and existing_user.id != user.id:
            return Response(
                {'error': 'Google account already linked to another user'},
                status=status.HTTP_409_CONFLICT
            )

        google_auth_credentials = google_auth_service.link_google_account(user, google_user_data, tokens)

        # Connect calendar using same tokens
        calendar_credentials, _ = GoogleCalendarCredentials.objects.update_or_create(
            user=user,
            defaults={
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token'],
                'token_expiry': tokens['expires_at'],
                'is_active': True,
                'sync_error': None,
                'google_auth_credentials': google_auth_credentials,
            }
        )

        if hasattr(user, 'public_profile'):
            user.public_profile.has_calendar = True
            user.public_profile.save(update_fields=['has_calendar'])

        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response({
            'message': 'Google login successful',
            'access': str(access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'calendar_id': calendar_credentials.calendar_id,
        })
    except Exception as e:
        logger.error(f"Google auth failed: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


def _hash_email_code(email: str, code: str) -> str:
    msg = f"{email.lower().strip()}:{code}".encode("utf-8")
    key = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def email_request_code_view(request):
    """
    POST /api/auth/email/request-code/
    Body: { "email": "user@example.com" }
    """
    serializer = EmailCodeRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"].strip().lower()
    # 6-digit numeric code
    code = f"{secrets.randbelow(1000000):06d}"
    code_hash = _hash_email_code(email, code)
    expires_at = timezone.now() + timezone.timedelta(minutes=10)

    # Invalidate previous pending codes for this email
    EmailAuthCode.objects.filter(email=email, consumed_at__isnull=True).update(consumed_at=timezone.now())

    EmailAuthCode.objects.create(email=email, code_hash=code_hash, expires_at=expires_at)

    # Send email (best-effort)
    email_sent = False
    try:
        send_mail(
            subject="Tu código de acceso - Be-U",
            message=f"Tu código de acceso es: {code}\n\nEste código expira en 10 minutos.",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[email],
            fail_silently=False,  # Changed to False to catch errors
        )
        email_sent = True
        logger.info(f"Email code sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed sending email code to {email}: {e}")
        # In development, if console backend is used, email will be printed to console
        # In production, this should be configured with proper SMTP credentials
    
    # For development: Log the code to console for easy testing
    # IMPORTANT: Remove this in production or make it DEBUG-only
    if settings.DEBUG or settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        logger.info(f"🔐 EMAIL CODE FOR {email}: {code} (This is only shown in development)")
        print(f"\n{'='*60}")
        print(f"🔐 EMAIL CODE FOR {email}: {code}")
        print(f"{'='*60}\n")
    
    return Response({
        "message": "Si el correo existe, te enviamos un código.",
        "email_sent": email_sent,  # Include status for debugging
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def email_verify_code_view(request):
    """
    POST /api/auth/email/verify-code/
    Body: { "email": "user@example.com", "code": "123456" }
    """
    serializer = EmailCodeVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"].strip().lower()
    code = serializer.validated_data["code"].strip()

    auth_code = (
        EmailAuthCode.objects.filter(email=email, consumed_at__isnull=True, expires_at__gt=timezone.now())
        .order_by("-created_at")
        .first()
    )
    if not auth_code:
        return Response({"error": "Código inválido o expirado"}, status=status.HTTP_400_BAD_REQUEST)

    # Attempt limit
    if auth_code.attempts >= 5:
        auth_code.consumed_at = timezone.now()
        auth_code.save(update_fields=["consumed_at", "updated_at"])
        return Response({"error": "Demasiados intentos. Solicita un nuevo código."}, status=status.HTTP_400_BAD_REQUEST)

    expected = auth_code.code_hash
    provided = _hash_email_code(email, code)
    if not hmac.compare_digest(expected, provided):
        auth_code.attempts += 1
        auth_code.save(update_fields=["attempts", "updated_at"])
        return Response({"error": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST)

    auth_code.consumed_at = timezone.now()
    auth_code.save(update_fields=["consumed_at", "updated_at"])

    user, created = User.objects.get_or_create(email=email, defaults={})
    if created:
        user.set_unusable_password()
        user.role = User.Role.CLIENT
        user.save()
        ClientProfile.objects.get_or_create(user=user)

    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token

    return Response(
        {
            "message": "Login successful",
            "access": str(access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }
    )


@api_view(['POST'])
def google_link_account_view(request):
    """
    POST /api/auth/google/link/

    Link Google account to an existing user.
    """
    if not request.user or not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    serializer = GoogleCallbackSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    code = serializer.validated_data.get('code')
    redirect_uri = serializer.validated_data.get('redirect_uri')

    try:
        tokens = google_auth_service.exchange_code_for_tokens(code, redirect_uri=redirect_uri)
        google_user_data = google_auth_service.get_user_info(tokens['access_token'])
        google_id = google_user_data.get('sub') or google_user_data.get('id')
        if google_id:
            existing_user = User.objects.filter(google_auth_credentials__google_id=google_id).exclude(id=request.user.id).first()
            if existing_user:
                return Response(
                    {'error': 'Google account already linked to another user'},
                    status=status.HTTP_409_CONFLICT
                )
        google_auth_credentials = google_auth_service.link_google_account(request.user, google_user_data, tokens)

        GoogleCalendarCredentials.objects.update_or_create(
            user=request.user,
            defaults={
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token'],
                'token_expiry': tokens['expires_at'],
                'is_active': True,
                'sync_error': None,
                'google_auth_credentials': google_auth_credentials,
            }
        )

        if hasattr(request.user, 'public_profile'):
            request.user.public_profile.has_calendar = True
            request.user.public_profile.save(update_fields=['has_calendar'])

        return Response({'message': 'Google account linked successfully'})
    except Exception as e:
        logger.error(f"Failed to link Google account: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def register_view(request):
    logger.info("=== REGISTRATION REQUEST STARTED ===")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request body (raw): {request.body}")
    
    try:
        data = json.loads(request.body)
        logger.info(f"Parsed JSON data: {data}")
        
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        username = data.get('username', '')
        role = data.get('role', None)
        
        logger.info(f"Extracted fields:")
        logger.info(f"  - email: {email}")
        logger.info(f"  - password: {'*' * len(password) if password else 'None'}")
        logger.info(f"  - first_name: {first_name}")
        logger.info(f"  - last_name: {last_name}")
        logger.info(f"  - username: {username}")
        logger.info(f"  - role: {role}")
        logger.info(f"  - category: {data.get('category', 'NOT PROVIDED')}")
        logger.info(f"  - subcategory: {data.get('subcategory', 'NOT PROVIDED')}")
        
        if not email or not password or not username:
            logger.warning("Missing required fields")
            logger.warning(f"  - email present: {bool(email)}")
            logger.warning(f"  - password present: {bool(password)}")
            logger.warning(f"  - username present: {bool(username)}")
            return Response({'error': 'Email, password, and username are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        logger.info("Checking if email already exists...")
        if User.objects.filter(email=email).exists():
            logger.warning(f"Email {email} already exists in database")
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        logger.info("Email is available")
        
        # Check if username already exists
        logger.info("Checking if username already exists...")
        if User.objects.filter(username=username).exists():
            logger.warning(f"Username {username} already exists in database")
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        logger.info("Username is available")
        
        # Create user
        logger.info("Creating user in database...")
        logger.info(f"User creation parameters:")
        logger.info(f"  - username: {username}")
        logger.info(f"  - email: {email}")
        logger.info(f"  - first_name: {first_name}")
        logger.info(f"  - last_name: {last_name}")
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        # Assign role if provided and valid
        # Accept both lowercase and uppercase, convert to uppercase for database
        try:
            if role:
                # Normalize role to uppercase for validation
                role_upper = role.upper()
                # Map lowercase to uppercase if needed
                role_mapping = {
                    'client': 'CLIENT',
                    'professional': 'PROFESSIONAL',
                    'place': 'PLACE'
                }
                normalized_role = role_mapping.get(role.lower(), role_upper)
                
                if normalized_role in [choice[0] for choice in User.Role.choices]:
                    user.role = normalized_role
                    user.save(update_fields=['role'])
                    logger.info(f"Role assigned: {normalized_role} (from input: {role})")
                else:
                    logger.warning(f"Invalid role provided: {role} (normalized: {normalized_role})")
        except Exception as e:
            logger.warning(f"Invalid role provided during registration: {role} ({e})")

        # Auto-create role-specific profiles
        try:
            if user.role == User.Role.CLIENT:
                ClientProfile.objects.get_or_create(user=user, defaults={'phone': data.get('phone')})
            elif user.role == User.Role.PROFESSIONAL:
                # Get category and subcategory from registration data
                category = data.get('category', '')
                subcategory = data.get('subcategory', '')
                sub_categories = [subcategory] if subcategory else []
                
                # Create or update ProfessionalProfile with category/subcategory
                prof_profile, _ = ProfessionalProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        'name': first_name or username or email.split('@')[0],
                        'last_name': last_name or '',
                        'bio': data.get('bio', ''),
                        'city': data.get('city', ''),
                        'category': category,
                        'sub_categories': sub_categories,
                    }
                )
                logger.info(f"ProfessionalProfile {'created' if _ else 'updated'}: category={category}, subcategory={subcategory}")
                
                # Use update_or_create to ensure category/subcategory are saved even if profile exists
                public_profile, created = PublicProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        'profile_type': 'PROFESSIONAL',
                        'name': prof_profile.name,
                        'last_name': prof_profile.last_name,
                        'bio': prof_profile.bio,
                        'city': prof_profile.city,
                        'category': category,
                        'sub_categories': sub_categories,
                    }
                )
                logger.info(f"PublicProfile {'created' if created else 'updated'} for professional: category={category}, subcategory={subcategory}")
            elif user.role == User.Role.PLACE:
                # Get category and subcategory from registration data
                category = data.get('category', '')
                subcategory = data.get('subcategory', '')
                sub_categories = [subcategory] if subcategory else []
                
                place_name = data.get('placeName') or first_name or username or email.split('@')[0]
                street = data.get('address') or 'Dirección no disponible'
                postal_code = data.get('postal_code') or '00000'
                city = data.get('city') or ''
                country = data.get('country') or ''
                
                # Create or update PlaceProfile with category/subcategory
                place_profile, _ = PlaceProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        'name': place_name,
                        'street': street,
                        'postal_code': postal_code,
                        'city': city,
                        'country': country,
                        'number_ext': data.get('number_ext') or '',
                        'number_int': data.get('number_int') or '',
                        'owner': user,
                        'category': category,
                        'sub_categories': sub_categories,
                    }
                )
                logger.info(f"PlaceProfile {'created' if _ else 'updated'}: category={category}, subcategory={subcategory}")
                
                # Use update_or_create to ensure category/subcategory are saved even if profile exists
                public_profile, created = PublicProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        'profile_type': 'PLACE',
                        'name': place_profile.name,
                        'description': place_profile.description or '',
                        'street': place_profile.street,
                        'postal_code': place_profile.postal_code,
                        'city': place_profile.city,
                        'country': place_profile.country,
                        'latitude': data.get('latitude'),
                        'longitude': data.get('longitude'),
                        'category': category,
                        'sub_categories': sub_categories,
                    }
                )
                logger.info(f"PublicProfile {'created' if created else 'updated'} for place: category={category}, subcategory={subcategory}")
        except Exception as e:
            logger.error(f"Error auto-creating profile for user {user.id}: {e}")
        
        logger.info(f"User created successfully with ID: {user.id}")
        logger.info(f"User details: {user}")
        
        # Generate JWT tokens for new user
        logger.info("Generating JWT tokens...")
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        logger.info("JWT tokens generated successfully")
        
        # Serialize user data
        logger.info("Serializing user data...")
        user_data = UserSerializer(user).data
        logger.info(f"Serialized user data: {user_data}")
        
        response_data = {
            'message': 'User created successfully',
            'access': str(access_token),
            'refresh': str(refresh),
            'user': user_data
        }
        
        logger.info("=== REGISTRATION SUCCESSFUL ===")
        logger.info(f"Response data: {response_data}")
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        logger.error(f"Request body that caused error: {request.body}")
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error during registration: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def logout_view(request):
    try:
        # For JWT-based authentication, we don't need to call Django's logout
        # The token will be invalidated on the client side
        # If you want to blacklist the token, you would need to implement token blacklisting
        
        # For now, just return success - the client will remove the token
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def refresh_token_view(request):
    """Refresh JWT token"""
    try:
        data = json.loads(request.body)
        refresh_token = data.get('refresh')
        
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = refresh.access_token
            
            return Response({
                'access': str(access_token),
            })
        except Exception:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
            
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

