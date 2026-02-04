from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import models
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, NotFound
from .models import User, ProfessionalProfile, PlaceProfile, PublicProfile
from .profile_models import PlaceProfessionalLink
from .profile_serializers import PlaceProfessionalLinkSerializer
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    ClientProfileSerializer, ProfessionalProfileSerializer, PlaceProfileSerializer,
    ProfessionalProfileDetailSerializer, PlaceProfileDetailSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Admins can see all users; others can only see themselves
        user = self.request.user
        if user.is_staff:
            return super().get_queryset()
        return User.objects.filter(id=user.id)

    def create(self, request, *args, **kwargs):
        # Only admins can create arbitrary users
        if not request.user.is_staff:
            raise PermissionDenied('Only admins can create users')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        # Admins can update anyone; non-admins only themselves with limited fields
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        if not request.user.is_staff and instance.id != request.user.id:
            raise PermissionDenied('Not authorized')

        if not request.user.is_staff:
            # Limit self-edit to first/last name
            data = request.data.copy()
            allowed_keys = {'firstName', 'lastName'}
            for key in list(data.keys()):
                if key not in allowed_keys:
                    data.pop(key)
            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)

        return super().update(request, *args, partial=partial, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only admins can delete users
        if not request.user.is_staff:
            raise PermissionDenied('Only admins can delete users')
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def me_update(self, request):
        # Allow user to update their own first/last name
        user = request.user
        data = request.data.copy()
        allowed_keys = {'firstName', 'lastName'}
        for key in list(data.keys()):
            if key not in allowed_keys:
                data.pop(key)
        serializer = self.get_serializer(user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logout successful'})
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    
    if request.method == 'GET':
        user_data = UserSerializer(user).data
        
        # Include role-specific profile
        profile_data = None
        if user.role == 'CLIENT':
            if hasattr(user, 'client_profile'):
                profile_data = ClientProfileSerializer(user.client_profile).data
        elif user.role == 'PROFESSIONAL':
            if hasattr(user, 'professional_profile'):
                profile_data = ProfessionalProfileSerializer(user.professional_profile).data
        elif user.role == 'PLACE':
            if hasattr(user, 'place_profile'):
                profile_data = PlaceProfileSerializer(user.place_profile).data
        
        return Response({
            'user': user_data,
            'profile': profile_data
        })
    
    elif request.method == 'PUT':
        # Debug: Log received data
        print(f"🔧 Profile update request data: {request.data}")
        print(f"🔧 Phone in request.data: {request.data.get('phone', 'NOT FOUND')}")
        print(f"🔧 Username in request.data: {request.data.get('username', 'NOT FOUND')}")
        print(f"🔧 User before update - phone: {user.phone}, username: {user.username}")
        
        # Extract user-specific fields from request.data (including address and coordinates)
        user_fields = {
            'email': request.data.get('email'),
            'phone': request.data.get('phone'),
            'firstName': request.data.get('firstName'),
            'lastName': request.data.get('lastName'),
            'username': request.data.get('username'),
            'address': request.data.get('address'),
            'latitude': request.data.get('latitude'),
            'longitude': request.data.get('longitude'),
            'country': request.data.get('country'),
            'city': request.data.get('city'),
        }
        # Remove None values to avoid overwriting with None
        user_fields = {k: v for k, v in user_fields.items() if v is not None}
        
        print(f"🔧 Extracted user_fields: {user_fields}")
        
        # If coordinates are provided but city or country is missing, try reverse geocoding via Google Maps API
        latitude = user_fields.get('latitude') or (user.latitude if hasattr(user, 'latitude') else None)
        longitude = user_fields.get('longitude') or (user.longitude if hasattr(user, 'longitude') else None)
        country = user_fields.get('country') or (user.country if hasattr(user, 'country') else None)
        city = user_fields.get('city') or (getattr(user, 'city', None) if hasattr(user, 'city') else None)
        
        if latitude and longitude and (not country or not city):
            # Try to get city and country from reverse geocoding
            try:
                import requests
                from django.conf import settings
                import os
                from pathlib import Path
                from dotenv import load_dotenv
                
                api_key = os.getenv('GOOGLE_MAPS_API_KEY', '')
                if not api_key:
                    env_path = settings.BASE_DIR / '.env'
                    if env_path.exists():
                        load_dotenv(dotenv_path=env_path, override=True)
                        api_key = os.getenv('GOOGLE_MAPS_API_KEY', '')
                
                if api_key:
                    url = 'https://maps.googleapis.com/maps/api/geocode/json'
                    params = {
                        'latlng': f'{latitude},{longitude}',
                        'key': api_key,
                    }
                    response = requests.get(url, params=params, timeout=5)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('status') == 'OK' and data.get('results'):
                            address_components = data['results'][0].get('address_components', [])
                            for component in address_components:
                                types = component.get('types', [])
                                if not country and 'country' in types:
                                    user_fields['country'] = component.get('long_name')
                                if not city and 'locality' in types:
                                    user_fields['city'] = component.get('long_name')
                            # Fallback: some regions use administrative_area_level_2 for city
                            if 'city' not in user_fields:
                                for component in address_components:
                                    if 'administrative_area_level_2' in component.get('types', []):
                                        user_fields['city'] = component.get('long_name')
                                        break
            except Exception as e:
                print(f"⚠️ Failed to get city/country from coordinates: {e}")
        
        # Update user data (including address and coordinates)
        user_serializer = UserSerializer(user, data=user_fields, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()
            # Refresh user from database to get updated values
            user.refresh_from_db()
            print(f"🔧 User after update - phone: {user.phone}, username: {user.username}, address: {user.address}, country: {user.country}, city: {user.city}")
        else:
            print(f"🔧 UserSerializer validation errors: {user_serializer.errors}")
            return Response({
                'error': 'User data validation failed',
                'details': user_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update role-specific profile
        profile_data = None
        if user.role == 'CLIENT':
            if hasattr(user, 'client_profile'):
                # ClientProfile no longer stores address/coordinates - they're in User model
                # Only update phone if it's different (for backward compatibility)
                client_profile_fields = {}
                if request.data.get('phone') is not None and request.data.get('phone') != user.phone:
                    client_profile_fields['phone'] = request.data.get('phone')
                
                if client_profile_fields:
                    profile_serializer = ClientProfileSerializer(
                        user.client_profile, 
                        data=client_profile_fields, 
                        partial=True
                    )
                    if profile_serializer.is_valid():
                        profile_serializer.save()
                        profile_data = profile_serializer.data
                    else:
                        return Response({
                            'error': 'Profile data validation failed',
                            'details': profile_serializer.errors
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Return existing profile data
                    profile_data = ClientProfileSerializer(user.client_profile).data
        elif user.role == 'PROFESSIONAL':
            if hasattr(user, 'professional_profile'):
                prof_data = dict(request.data)
                if not prof_data.get('city') and user_fields.get('city'):
                    prof_data['city'] = user_fields['city']
                profile_serializer = ProfessionalProfileSerializer(
                    user.professional_profile, 
                    data=prof_data, 
                    partial=True
                )
                if profile_serializer.is_valid():
                    profile_serializer.save()
                    profile_data = profile_serializer.data
                else:
                    return Response({
                        'error': 'Profile data validation failed',
                        'details': profile_serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
        elif user.role == 'PLACE':
            if hasattr(user, 'place_profile'):
                # Extract only place profile fields from request.data; use reverse-geocoded city/country from user_fields if not in request
                place_profile_fields = {
                    'name': request.data.get('name'),
                    'bio': request.data.get('bio'),
                    'street': request.data.get('street'),
                    'number_ext': request.data.get('number_ext'),
                    'number_int': request.data.get('number_int'),
                    'postal_code': request.data.get('postal_code'),
                    'city': request.data.get('city') or user_fields.get('city'),
                    'country': request.data.get('country') or user_fields.get('country'),
                }
                # Remove None values to avoid overwriting with None
                place_profile_fields = {k: v for k, v in place_profile_fields.items() if v is not None}
                
                profile_serializer = PlaceProfileSerializer(
                    user.place_profile, 
                    data=place_profile_fields, 
                    partial=True
                )
                if profile_serializer.is_valid():
                    profile_serializer.save()
                    profile_data = profile_serializer.data
                else:
                    return Response({
                        'error': 'Profile data validation failed',
                        'details': profile_serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)

        # Sync city/country to PublicProfile for PROFESSIONAL and PLACE when address was updated
        if user.role in ('PROFESSIONAL', 'PLACE') and hasattr(user, 'public_profile'):
            pub_updates = {}
            if user_fields.get('city') is not None:
                pub_updates['city'] = user_fields['city']
            if user_fields.get('country') is not None:
                pub_updates['country'] = user_fields['country']
            if pub_updates:
                PublicProfile.objects.filter(user=user).update(**pub_updates)

        return Response({
            'user': UserSerializer(user).data,
            'profile': profile_data
        })


class ProfessionalProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for browsing professional profiles (same city only)"""
    queryset = ProfessionalProfile.objects.select_related('user').all()
    serializer_class = ProfessionalProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProfessionalProfileDetailSerializer
        return ProfessionalProfileSerializer

    def _viewer_city(self):
        if self.request.user and self.request.user.is_authenticated:
            return getattr(self.request.user, 'city', None) or ''
        return ''

    def get_queryset(self):
        queryset = super().get_queryset()
        viewer_city = self._viewer_city()
        if viewer_city:
            queryset = queryset.filter(Q(city__iexact=viewer_city) | Q(user__city__iexact=viewer_city))
        else:
            queryset = queryset.none()

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(user__username__icontains=search) |
                models.Q(city__icontains=search) |
                models.Q(bio__icontains=search)
            )
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(Q(city__icontains=city) | Q(user__city__icontains=city))
        queryset = queryset.order_by('-rating', 'name')
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        viewer_city = self._viewer_city()
        prof_city = (getattr(instance, 'city', None) or '') or (getattr(instance.user, 'city', None) or '')
        if not viewer_city or not prof_city or viewer_city.lower() != prof_city.lower():
            raise NotFound('Profile not found')
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class PlaceProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for browsing place profiles (same city only)"""
    queryset = PlaceProfile.objects.select_related('user', 'owner').all()
    serializer_class = PlaceProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PlaceProfileDetailSerializer
        return PlaceProfileSerializer

    def _viewer_city(self):
        if self.request.user and self.request.user.is_authenticated:
            return getattr(self.request.user, 'city', None) or ''
        return ''

    def get_queryset(self):
        queryset = super().get_queryset()
        viewer_city = self._viewer_city()
        if viewer_city:
            queryset = queryset.filter(Q(city__iexact=viewer_city) | Q(user__city__iexact=viewer_city) | Q(owner__city__iexact=viewer_city))
        else:
            queryset = queryset.none()

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(city__icontains=search) |
                models.Q(street__icontains=search) |
                models.Q(country__icontains=search) |
                models.Q(description__icontains=search)
            )
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(Q(city__icontains=city) | Q(user__city__icontains=city))
        queryset = queryset.order_by('name')
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        viewer_city = self._viewer_city()
        place_city = (getattr(instance, 'city', None) or '') or (getattr(instance.user, 'city', None) or '') or (getattr(instance.owner, 'city', None) or '')
        if not viewer_city or not place_city or viewer_city.lower() != place_city.lower():
            raise NotFound('Profile not found')
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'], url_path='links', permission_classes=[IsAuthenticated])
    def links(self, request, pk=None):
        """List or create links for a specific place.
        GET: list links (default ACCEPTED unless ?status provided)
        POST: invite a professional { professional_id, notes? } (place owner only)
        """
        place = self.get_object()
        user = request.user
        
        # GET: list links
        if request.method == 'GET':
            status_param = request.query_params.get('status') or PlaceProfessionalLink.Status.ACCEPTED
            # Allow place owner to view; professionals can view their own accepted links for this place
            if user.is_staff or (user.role == User.Role.PLACE and (place.user_id == user.id or (place.owner_id and place.owner_id == user.id))):
                links = PlaceProfessionalLink.objects.select_related('professional__user').filter(place=place)
                if status_param:
                    links = links.filter(status=status_param)
                return Response(PlaceProfessionalLinkSerializer(links, many=True).data)
            elif user.role == User.Role.PROFESSIONAL and hasattr(user, 'professional_profile'):
                links = PlaceProfessionalLink.objects.filter(place=place, professional=user.professional_profile, status=PlaceProfessionalLink.Status.ACCEPTED)
                return Response(PlaceProfessionalLinkSerializer(links, many=True).data)
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # POST: create invite, only place owner
        if user.role != User.Role.PLACE or not (place.user_id == user.id or (place.owner_id and place.owner_id == user.id)):
            return Response({'detail': 'Not authorized to invite for this place'}, status=status.HTTP_403_FORBIDDEN)
        
        professional_id = request.data.get('professional_id')
        if not professional_id:
            return Response({'detail': 'professional_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        notes = request.data.get('notes', '')
        
        try:
            prof = ProfessionalProfile.objects.get(id=professional_id)
        except ProfessionalProfile.DoesNotExist:
            return Response({'detail': 'Professional not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get categories from PublicProfile (where they are actually edited and stored)
        try:
            place_public_profile = place.user.public_profile
            place_categories = place_public_profile.category if isinstance(place_public_profile.category, list) else ([place_public_profile.category] if place_public_profile.category else [])
        except PublicProfile.DoesNotExist:
            # Fallback to PlaceProfile category if PublicProfile doesn't exist
            place_categories = place.category if isinstance(place.category, list) else ([place.category] if place.category else [])
        
        try:
            professional_public_profile = prof.user.public_profile
            professional_categories = professional_public_profile.category if isinstance(professional_public_profile.category, list) else ([professional_public_profile.category] if professional_public_profile.category else [])
        except PublicProfile.DoesNotExist:
            # Fallback to ProfessionalProfile category if PublicProfile doesn't exist
            professional_categories = prof.category if isinstance(prof.category, list) else ([prof.category] if prof.category else [])
        
        # Handle case where category might be a stringified JSON array (from migration issues)
        def normalize_category_list(categories):
            """Normalize category list, handling stringified JSON arrays"""
            if not categories:
                return []
            result = []
            for cat in categories:
                if isinstance(cat, str):
                    # Check if it's a stringified JSON array
                    if cat.strip().startswith('[') and cat.strip().endswith(']'):
                        try:
                            import json
                            parsed = json.loads(cat)
                            if isinstance(parsed, list):
                                result.extend(parsed)
                            else:
                                result.append(cat)
                        except:
                            result.append(cat)
                    else:
                        result.append(cat)
                else:
                    result.append(cat)
            return result
        
        place_categories = normalize_category_list(place_categories)
        professional_categories = normalize_category_list(professional_categories)
        
        # Normalize categories to strings for comparison
        place_categories = [str(cat).strip().lower() for cat in place_categories if cat]
        professional_categories = [str(cat).strip().lower() for cat in professional_categories if cat]
        
        # Check if there's any intersection
        common_categories = set(place_categories) & set(professional_categories)
        
        if not common_categories:
            return Response({
                'detail': 'No se puede enviar la invitación. El establecimiento y el profesional deben tener al menos una categoría principal en común.',
                'place_categories': place_categories,
                'professional_categories': professional_categories
            }, status=status.HTTP_400_BAD_REQUEST)
        
        link, created = PlaceProfessionalLink.objects.get_or_create(
            place=place, professional=prof,
            defaults={'status': PlaceProfessionalLink.Status.INVITED, 'invited_by': user, 'notes': notes}
        )
        if not created:
            link.status = PlaceProfessionalLink.Status.INVITED
            link.invited_by = user
            link.notes = notes
            link.save(update_fields=['status', 'invited_by', 'notes', 'updated_at'])
        return Response(PlaceProfessionalLinkSerializer(link).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
