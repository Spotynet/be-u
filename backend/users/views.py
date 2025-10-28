from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import models
from rest_framework.exceptions import PermissionDenied
from .models import User, ProfessionalProfile, PlaceProfile
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    ProfessionalProfileSerializer, PlaceProfileSerializer,
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
        # Update user data
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()
        
        # Update role-specific profile
        profile_data = None
        if user.role == 'CLIENT':
            if hasattr(user, 'client_profile'):
                profile_serializer = ClientProfileSerializer(
                    user.client_profile, 
                    data=request.data, 
                    partial=True
                )
                if profile_serializer.is_valid():
                    profile_serializer.save()
                profile_data = profile_serializer.data
        elif user.role == 'PROFESSIONAL':
            if hasattr(user, 'professional_profile'):
                profile_serializer = ProfessionalProfileSerializer(
                    user.professional_profile, 
                    data=request.data, 
                    partial=True
                )
                if profile_serializer.is_valid():
                    profile_serializer.save()
                profile_data = profile_serializer.data
        elif user.role == 'PLACE':
            if hasattr(user, 'place_profile'):
                profile_serializer = PlaceProfileSerializer(
                    user.place_profile, 
                    data=request.data, 
                    partial=True
                )
                if profile_serializer.is_valid():
                    profile_serializer.save()
                profile_data = profile_serializer.data
        
        return Response({
            'user': UserSerializer(user).data,
            'profile': profile_data
        })


class ProfessionalProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for browsing professional profiles"""
    queryset = ProfessionalProfile.objects.select_related('user').all()
    serializer_class = ProfessionalProfileSerializer
    permission_classes = [AllowAny]  # Public access for browsing
    
    def get_serializer_class(self):
        """Use detail serializer for retrieve action"""
        if self.action == 'retrieve':
            return ProfessionalProfileDetailSerializer
        return ProfessionalProfileSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(city__icontains=search) |
                models.Q(bio__icontains=search)
            )
        
        # Filter by city
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Order by rating by default
        queryset = queryset.order_by('-rating', 'name')
        
        return queryset


class PlaceProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for browsing place profiles"""
    queryset = PlaceProfile.objects.select_related('user', 'owner').all()
    serializer_class = PlaceProfileSerializer
    permission_classes = [AllowAny]  # Public access for browsing
    
    def get_serializer_class(self):
        """Use detail serializer for retrieve action"""
        if self.action == 'retrieve':
            return PlaceProfileDetailSerializer
        return PlaceProfileSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(city__icontains=search) |
                models.Q(street__icontains=search) |
                models.Q(country__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        # Filter by city
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Order by name
        queryset = queryset.order_by('name')
        
        return queryset
