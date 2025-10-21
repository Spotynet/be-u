from rest_framework import serializers
from .models import Notification, NotificationTemplate


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    # Computed fields
    time_ago = serializers.SerializerMethodField()
    is_unread = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'status', 'metadata',
            'created_at', 'updated_at', 'read_at', 'time_ago', 'is_unread'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'read_at']
    
    def get_time_ago(self, obj):
        """Get human-readable time difference"""
        from django.utils import timezone
        from django.utils.timesince import timesince
        
        now = timezone.now()
        return timesince(obj.created_at, now)
    
    def get_is_unread(self, obj):
        """Check if notification is unread"""
        return obj.status == Notification.NotificationStatus.UNREAD


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = ['type', 'title', 'message', 'metadata']
    
    def create(self, validated_data):
        # Get user from context
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class NotificationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating notifications"""
    
    class Meta:
        model = Notification
        fields = ['status']
    
    def update(self, instance, validated_data):
        if validated_data.get('status') == Notification.NotificationStatus.READ:
            instance.mark_as_read()
        elif validated_data.get('status') == Notification.NotificationStatus.UNREAD:
            instance.mark_as_unread()
        return instance


class NotificationBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk operations on notifications"""
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100
    )
    action = serializers.ChoiceField(choices=['mark_read', 'mark_unread', 'delete'])
    
    def validate_notification_ids(self, value):
        """Validate that all notification IDs belong to the current user"""
        user = self.context['request'].user
        notifications = Notification.objects.filter(
            id__in=value,
            user=user
        )
        
        if len(notifications) != len(value):
            raise serializers.ValidationError("Some notifications not found or don't belong to you")
        
        return value


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    
    total_count = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    by_type = serializers.DictField()
    by_status = serializers.DictField()


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for notification templates"""
    
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'type', 'title_template', 'message_template', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

