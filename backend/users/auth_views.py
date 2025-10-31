from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, ClientProfile, ProfessionalProfile, PlaceProfile, PublicProfile
from .serializers import UserSerializer
import json
import logging

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
        try:
            if role and role in [choice[0] for choice in User.Role.choices]:
                user.role = role
                user.save(update_fields=['role'])
        except Exception as e:
            logger.warning(f"Invalid role provided during registration: {role} ({e})")

        # Auto-create role-specific profiles
        try:
            if user.role == User.Role.CLIENT:
                ClientProfile.objects.get_or_create(user=user, defaults={'phone': data.get('phone')})
            elif user.role == User.Role.PROFESSIONAL:
                prof_profile, _ = ProfessionalProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'name': first_name or username or email.split('@')[0],
                        'last_name': last_name or '',
                        'bio': data.get('bio', ''),
                        'city': data.get('city', ''),
                    }
                )
                PublicProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'profile_type': 'PROFESSIONAL',
                        'name': prof_profile.name,
                        'last_name': prof_profile.last_name,
                        'bio': prof_profile.bio,
                        'city': prof_profile.city,
                    }
                )
            elif user.role == User.Role.PLACE:
                place_name = data.get('placeName') or first_name or username or email.split('@')[0]
                street = data.get('address') or 'Dirección no disponible'
                postal_code = data.get('postal_code') or '00000'
                city = data.get('city') or ''
                country = data.get('country') or ''
                place_profile, _ = PlaceProfile.objects.get_or_create(
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
                    }
                )
                PublicProfile.objects.get_or_create(
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
                    }
                )
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

