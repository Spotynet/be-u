from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from .models import Notification, NotificationTemplate, PushDeviceToken, ReservationReminder
from .serializers import (
    NotificationSerializer, 
    NotificationCreateSerializer,
    NotificationUpdateSerializer,
    NotificationBulkUpdateSerializer,
    NotificationStatsSerializer,
    NotificationTemplateSerializer,
    PushDeviceTokenSerializer,
    ReservationReminderSerializer
)


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user notifications"""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter notifications by current user"""
        return Notification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return NotificationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NotificationUpdateSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
        """Set user to current user when creating notification"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notification statistics for current user"""
        user = request.user
        
        # Get basic counts
        total_count = Notification.objects.filter(user=user).count()
        unread_count = Notification.objects.filter(
            user=user, 
            status=Notification.NotificationStatus.UNREAD
        ).count()
        
        # Get counts by type
        by_type = Notification.objects.filter(user=user).values('type').annotate(
            count=Count('id')
        ).order_by('type')
        by_type_dict = {item['type']: item['count'] for item in by_type}
        
        # Get counts by status
        by_status = Notification.objects.filter(user=user).values('status').annotate(
            count=Count('id')
        ).order_by('status')
        by_status_dict = {item['status']: item['count'] for item in by_status}
        
        stats_data = {
            'total_count': total_count,
            'unread_count': unread_count,
            'by_type': by_type_dict,
            'by_status': by_status_dict
        }
        
        serializer = NotificationStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        user = request.user
        updated_count = Notification.objects.filter(
            user=user,
            status=Notification.NotificationStatus.UNREAD
        ).update(
            status=Notification.NotificationStatus.READ,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'Marked {updated_count} notifications as read',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk actions on notifications"""
        serializer = NotificationBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data['notification_ids']
        action = serializer.validated_data['action']
        
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            user=request.user
        )
        
        if action == 'mark_read':
            updated_count = notifications.filter(
                status=Notification.NotificationStatus.UNREAD
            ).update(
                status=Notification.NotificationStatus.READ,
                read_at=timezone.now()
            )
            message = f'Marked {updated_count} notifications as read'
            
        elif action == 'mark_unread':
            updated_count = notifications.filter(
                status=Notification.NotificationStatus.READ
            ).update(
                status=Notification.NotificationStatus.UNREAD,
                read_at=None
            )
            message = f'Marked {updated_count} notifications as unread'
            
        elif action == 'delete':
            updated_count = notifications.count()
            notifications.delete()
            message = f'Deleted {updated_count} notifications'
        
        return Response({
            'message': message,
            'updated_count': updated_count
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark specific notification as read"""
        notification = self.get_object()
        if notification.status == Notification.NotificationStatus.UNREAD:
            notification.mark_as_read()
            return Response({'message': 'Notification marked as read'})
        return Response({'message': 'Notification already read'})
    
    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Mark specific notification as unread"""
        notification = self.get_object()
        if notification.status == Notification.NotificationStatus.READ:
            notification.mark_as_unread()
            return Response({'message': 'Notification marked as unread'})
        return Response({'message': 'Notification already unread'})
    
    def list(self, request, *args, **kwargs):
        """List notifications with filtering and pagination"""
        queryset = self.get_queryset()
        
        # Filter by type
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)
        
        # Filter by status
        notification_status = request.query_params.get('status')
        if notification_status:
            queryset = queryset.filter(status=notification_status)
        
        # Filter by date range
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Search in title and message
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(message__icontains=search)
            )
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NotificationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for notification templates (admin only)"""
    
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show active templates to regular users"""
        if self.request.user.is_staff:
            return NotificationTemplate.objects.all()
        return NotificationTemplate.objects.filter(is_active=True)


class PushDeviceTokenViewSet(viewsets.ModelViewSet):
    """Register/manage push device tokens for current user"""

    serializer_class = PushDeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PushDeviceToken.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        platform = serializer.validated_data.get('platform', PushDeviceToken.Platform.UNKNOWN)

        # Reassign token if it exists for another user
        token_obj, _ = PushDeviceToken.objects.update_or_create(
            token=token,
            defaults={
                'user': request.user,
                'platform': platform,
                'is_active': True,
                'last_seen_at': timezone.now(),
            }
        )
        out = self.get_serializer(token_obj)
        return Response(out.data, status=status.HTTP_201_CREATED)


class ReservationReminderViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only reminders for current user (debug/admin use)"""

    serializer_class = ReservationReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReservationReminder.objects.filter(user=self.request.user)