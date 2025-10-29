from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Service, ServicesCategory, ServicesType
from .service_serializers import (
    ServiceSerializer, 
    ServiceCreateSerializer,
    ServiceUpdateSerializer,
    ServiceListSerializer,
    ServiceCategorySerializer,
    ServiceTypeSerializer
)


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing services"""
    
    queryset = Service.objects.select_related('pro_user').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return ServiceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ServiceUpdateSerializer
        elif self.action == 'list':
            return ServiceListSerializer
        return ServiceSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter services based on query parameters"""
        queryset = Service.objects.select_related('pro_user').filter(is_active=True)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Filter by sub-category
        sub_category = self.request.query_params.get('sub_category')
        if sub_category:
            queryset = queryset.filter(sub_category__icontains=sub_category)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass
        
        max_price = self.request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass
        
        # Filter by provider
        provider = self.request.query_params.get('provider')
        if provider:
            queryset = queryset.filter(pro_user_id=provider)
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Set pro_user to current user when creating service"""
        serializer.save(pro_user=self.request.user)
    
    def perform_update(self, serializer):
        """Only allow users to update their own services"""
        instance = self.get_object()
        if instance.pro_user != self.request.user:
            return Response(
                {"detail": "You can only update your own services"},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        """Only allow users to delete their own services"""
        instance = self.get_object()
        if instance.pro_user != request.user:
            return Response(
                {"detail": "You can only delete your own services"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'], url_path='my-services')
    def my_services(self, request):
        """Get current user's services"""
        services = Service.objects.filter(pro_user=request.user)
        serializer = ServiceListSerializer(services, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """Upload an image for the service"""
        service = self.get_object()
        
        # Check if user owns this service
        if service.pro_user != request.user:
            return Response(
                {"detail": "You can only upload images to your own services"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the uploaded file
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {"detail": "No image file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add image to the images list
        images = service.images or []
        # In a real implementation, you would upload the file to S3 and get the URL
        # For now, we'll just add a placeholder
        images.append(f"uploaded_image_{len(images) + 1}.jpg")
        service.images = images
        service.save()
        
        return Response({
            "message": "Image uploaded successfully",
            "images": service.images
        })
    
    @action(detail=True, methods=['delete'], url_path='remove-image')
    def remove_image(self, request, pk=None):
        """Remove an image from the service"""
        service = self.get_object()
        
        # Check if user owns this service
        if service.pro_user != request.user:
            return Response(
                {"detail": "You can only remove images from your own services"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        image_index = request.data.get('image_index')
        if image_index is None:
            return Response(
                {"detail": "image_index is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        images = service.images or []
        try:
            image_index = int(image_index)
            if 0 <= image_index < len(images):
                images.pop(image_index)
                service.images = images
                service.save()
                return Response({
                    "message": "Image removed successfully",
                    "images": service.images
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
    
    @action(detail=True, methods=['patch'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        """Toggle service active status"""
        service = self.get_object()
        
        # Check if user owns this service
        if service.pro_user != request.user:
            return Response(
                {"detail": "You can only toggle your own services"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        service.is_active = not service.is_active
        service.save()
        
        return Response({
            "message": f"Service {'activated' if service.is_active else 'deactivated'} successfully",
            "is_active": service.is_active
        })


class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for service categories - read only"""
    queryset = ServicesCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [AllowAny]


class ServiceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for service types - read only"""
    queryset = ServicesType.objects.select_related('category').all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [AllowAny]
