from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from .models import Favorite
from .serializers import FavoriteSerializer, FavoriteCreateSerializer, FavoriteStatsSerializer


class FavoriteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user favorites"""
    
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get favorites for the current user"""
        user = self.request.user
        return Favorite.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        """Create a new favorite"""
        serializer = FavoriteCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Get the content type
            content_type_name = serializer.validated_data['content_type']
            object_id = serializer.validated_data['object_id']
            
            content_type = ContentType.objects.get(model=content_type_name)
            
            # Check if already favorited
            existing_favorite = Favorite.objects.filter(
                user=request.user,
                content_type=content_type,
                object_id=object_id
            ).first()
            
            if existing_favorite:
                return Response(
                    {"detail": "Already favorited"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the favorite
            favorite = Favorite.objects.create(
                user=request.user,
                content_type=content_type,
                object_id=object_id
            )
            
            return Response(
                FavoriteSerializer(favorite, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get favorite statistics for the user"""
        user = request.user
        favorites = Favorite.objects.filter(user=user)
        
        stats = {
            'total_count': favorites.count(),
            'professionals_count': favorites.filter(
                content_type__model='professionalprofile'
            ).count(),
            'places_count': favorites.filter(
                content_type__model='placeprofile'
            ).count(),
        }
        
        serializer = FavoriteStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_remove(self, request):
        """Remove multiple favorites"""
        favorite_ids = request.data.get('favorite_ids', [])
        
        if not favorite_ids:
            return Response(
                {"detail": "No favorite IDs provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Delete the favorites
        deleted_count = Favorite.objects.filter(
            id__in=favorite_ids,
            user=user
        ).delete()[0]
        
        return Response({
            "detail": f"Removed {deleted_count} favorites",
            "deleted_count": deleted_count
        })
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle favorite status for a content object"""
        serializer = FavoriteCreateSerializer(data=request.data)
        if serializer.is_valid():
            content_type_name = serializer.validated_data['content_type']
            object_id = serializer.validated_data['object_id']
            
            content_type = ContentType.objects.get(model=content_type_name)
            
            # Check if already favorited
            existing_favorite = Favorite.objects.filter(
                user=request.user,
                content_type=content_type,
                object_id=object_id
            ).first()
            
            if existing_favorite:
                # Remove favorite
                existing_favorite.delete()
                return Response({
                    "is_favorited": False,
                    "detail": "Removed from favorites"
                })
            else:
                # Add favorite
                favorite = Favorite.objects.create(
                    user=request.user,
                    content_type=content_type,
                    object_id=object_id
                )
                return Response({
                    "is_favorited": True,
                    "detail": "Added to favorites",
                    "favorite": FavoriteSerializer(favorite, context={'request': request}).data
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

