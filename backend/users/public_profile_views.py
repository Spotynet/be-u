from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import PublicProfile, User
from .location_utils import filter_by_radius
from .public_profile_serializers import (
    PublicProfileSerializer, 
    PublicProfileCreateSerializer,
    PublicProfileUpdateSerializer,
    PublicProfileListSerializer
)


class PublicProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing public profiles"""
    
    queryset = PublicProfile.objects.select_related('user').all()
    # Default to authenticated for safety; relax for read-only via get_permissions
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Allow anyone to list/retrieve public profiles; require auth otherwise."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        # Default behavior for create/update/destroy and custom actions
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return PublicProfileCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PublicProfileUpdateSerializer
        elif self.action == 'list':
            return PublicProfileListSerializer
        return PublicProfileSerializer
    
    def get_queryset(self):
        """Filter profiles based on user permissions and query parameters"""
        queryset = PublicProfile.objects.select_related('user').all()
        
        # Filter by profile type
        profile_type = self.request.query_params.get('profile_type')
        if profile_type:
            queryset = queryset.filter(profile_type=profile_type)
        
        # Filter by category (supports both single category and array)
        category = self.request.query_params.get('category')
        if category:
            # For JSONField, check if category is in the array
            queryset = queryset.filter(
                Q(category__contains=[category]) |  # Array contains category
                Q(category=category)  # Single category match (backward compatibility)
            )
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(bio__icontains=search)
            )

        latitude = self.request.query_params.get("latitude")
        longitude = self.request.query_params.get("longitude")
        radius = self.request.query_params.get("radius")
        if latitude is not None and longitude is not None:
            try:
                latitude = float(latitude)
                longitude = float(longitude)
                radius_km = float(radius) if radius is not None else 10.0
            except (TypeError, ValueError):
                return queryset

            items = list(queryset)
            items = filter_by_radius(items, latitude, longitude, radius_km)
            items.sort(key=lambda item: item.distance_km if item.distance_km is not None else float("inf"))
            return items

        return queryset

    @action(detail=False, methods=["get"], url_path="nearby", permission_classes=[AllowAny])
    def nearby(self, request):
        latitude = request.query_params.get("latitude")
        longitude = request.query_params.get("longitude")
        radius = request.query_params.get("radius")

        if latitude is None or longitude is None:
            return Response({"detail": "latitude and longitude are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            latitude = float(latitude)
            longitude = float(longitude)
            radius_km = float(radius) if radius is not None else 10.0
        except (TypeError, ValueError):
            return Response({"detail": "Invalid latitude/longitude/radius values."}, status=status.HTTP_400_BAD_REQUEST)

        items = filter_by_radius(list(self.get_queryset()), latitude, longitude, radius_km)
        items.sort(key=lambda item: item.distance_km if item.distance_km is not None else float("inf"))

        serializer = PublicProfileListSerializer(items, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Set user to current user when creating profile"""
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Only allow users to update their own profiles"""
        instance = self.get_object()
        if instance.user != self.request.user:
            return Response(
                {"detail": "You can only update your own profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
    
    def update(self, request, *args, **kwargs):
        """Handle profile updates including photo uploads"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check authorization
        if instance.user != request.user:
            return Response(
                {"detail": "You can only update your own profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Refresh instance from database to get updated image URL
        instance.refresh_from_db()
        if instance.user:
            instance.user.refresh_from_db()
        
        # Return full profile data with updated image URL
        return Response(PublicProfileSerializer(instance, context={'request': request}).data)
    
    def partial_update(self, request, *args, **kwargs):
        """Handle partial profile updates"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only allow users to delete their own profiles"""
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {"detail": "You can only delete your own profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'], url_path='my-profile')
    def my_profile(self, request):
        """Get current user's public profile"""
        try:
            profile = PublicProfile.objects.get(user=request.user)
            serializer = PublicProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except PublicProfile.DoesNotExist:
            return Response(
                {"detail": "No public profile found for this user"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], url_path='create-profile')
    def create_profile(self, request):
        """Create a public profile for the current user"""
        # Check if user already has a public profile
        if PublicProfile.objects.filter(user=request.user).exists():
            return Response(
                {"detail": "User already has a public profile"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PublicProfileCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            profile = serializer.save()
            return Response(
                PublicProfileSerializer(profile, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """Upload an image for the public profile (max 10 images)"""
        profile = self.get_object()
        
        # Check if user owns this profile
        if profile.user != request.user:
            return Response(
                {"detail": "You can only upload images to your own profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check image limit (max 10)
        current_images = profile.images or []
        if len(current_images) >= 10:
            return Response(
                {"detail": "Maximum of 10 images allowed per profile"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the uploaded file
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {"detail": "No image file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {"detail": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if image_file.size > max_size:
            return Response(
                {"detail": "File too large. Maximum size is 5MB"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Upload to S3 and get the URL
            from storages.backends.s3boto3 import S3Boto3Storage
            from django.conf import settings
            import uuid
            
            # Generate unique filename
            file_extension = image_file.name.split('.')[-1]
            unique_filename = f"public_profiles/{profile.id}/images/{uuid.uuid4()}.{file_extension}"
            
            # Upload to S3
            storage = S3Boto3Storage()
            file_path = storage.save(unique_filename, image_file)
            file_url = storage.url(file_path)
            
            # Add image URL to the images list
            current_images.append(file_url)
            profile.images = current_images
            profile.save()
            
            return Response({
                "message": "Image uploaded successfully",
                "image_url": file_url,
                "images": profile.images,
                "total_images": len(profile.images)
            })
            
        except Exception as e:
            return Response(
                {"detail": f"Error uploading image: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='remove-image')
    def remove_image(self, request, pk=None):
        """Remove an image from the public profile"""
        profile = self.get_object()
        
        # Check if user owns this profile
        if profile.user != request.user:
            return Response(
                {"detail": "You can only remove images from your own profile"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        image_index = request.data.get('image_index')
        if image_index is None:
            return Response(
                {"detail": "image_index is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        images = profile.images or []
        try:
            image_index = int(image_index)
            if 0 <= image_index < len(images):
                # Get the image URL to potentially delete from S3
                image_url = images[image_index]
                
                # Remove from list
                images.pop(image_index)
                profile.images = images
                profile.save()
                
                # Optionally delete from S3 (you might want to keep images for backup)
                # Uncomment the following lines if you want to delete from S3
                # try:
                #     from storages.backends.s3boto3 import S3Boto3Storage
                #     storage = S3Boto3Storage()
                #     # Extract the key from the URL
                #     if 'amazonaws.com' in image_url:
                #         key = image_url.split('amazonaws.com/')[-1]
                #         storage.delete(key)
                # except Exception as e:
                #     # Log error but don't fail the request
                #     pass
                
                return Response({
                    "message": "Image removed successfully",
                    "images": profile.images,
                    "total_images": len(profile.images)
                })
            else:
                return Response(
                    {"detail": "Invalid image index"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"detail": "image_index must be a number"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def links(self, request, pk=None):
        """
        Public endpoint to get links for a profile (professionals or places).
        Returns linked professionals if PLACE, or linked places if PROFESSIONAL.
        No authentication required.
        
        URL: GET /api/public-profiles/{id}/links/?status=ACCEPTED
        """
        try:
            from users.profile_models import PlaceProfessionalLink, PlaceProfile, ProfessionalProfile
            
            # Get the public profile
            public_profile = self.get_object()
            
            # Get status filter from query params (default to ACCEPTED)
            status_filter = request.query_params.get('status', 'ACCEPTED')
            
            if public_profile.profile_type == 'PLACE':
                # Find the PlaceProfile associated with this public profile
                try:
                    place_profile = PlaceProfile.objects.get(user=public_profile.user)
                    # Get links where this place is the place
                    links = PlaceProfessionalLink.objects.filter(
                        place=place_profile,
                        status=status_filter
                    ).select_related('professional', 'professional__user')
                except PlaceProfile.DoesNotExist:
                    return Response([], status=status.HTTP_200_OK)
                    
            elif public_profile.profile_type == 'PROFESSIONAL':
                # Find the ProfessionalProfile associated with this public profile
                try:
                    prof_profile = ProfessionalProfile.objects.get(user=public_profile.user)
                    # Get links where this professional is the professional
                    links = PlaceProfessionalLink.objects.filter(
                        professional=prof_profile,
                        status=status_filter
                    ).select_related('place', 'place__user')
                except ProfessionalProfile.DoesNotExist:
                    return Response([], status=status.HTTP_200_OK)
            else:
                return Response([], status=status.HTTP_200_OK)
            
            # Serialize the links
            from users.profile_serializers import PlaceProfessionalLinkSerializer
            serializer = PlaceProfessionalLinkSerializer(links, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error in public profile links endpoint: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )