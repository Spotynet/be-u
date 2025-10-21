from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Notification, NotificationTemplate


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'title', 'status', 'created_at', 'is_unread_display')
    list_filter = ('type', 'status', 'created_at', 'user__role')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'title', 'message')
    readonly_fields = ('created_at', 'updated_at', 'read_at')
    raw_id_fields = ('user',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'type', 'title', 'message', 'status')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'read_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_unread_display(self, obj):
        """Display unread status with color coding"""
        if obj.status == Notification.NotificationStatus.UNREAD:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">●</span> Unread'
            )
        return format_html(
            '<span style="color: #28a745;">✓</span> Read'
        )
    is_unread_display.short_description = 'Status'
    is_unread_display.admin_order_field = 'status'
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request).select_related('user', 'content_type')
    
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected']
    
    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read"""
        updated = queryset.filter(status=Notification.NotificationStatus.UNREAD).update(
            status=Notification.NotificationStatus.READ,
            read_at=timezone.now()
        )
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread"""
        updated = queryset.filter(status=Notification.NotificationStatus.READ).update(
            status=Notification.NotificationStatus.UNREAD,
            read_at=None
        )
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('type', 'title_template', 'is_active', 'created_at')
    list_filter = ('type', 'is_active', 'created_at')
    search_fields = ('type', 'title_template', 'message_template')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Template Information', {
            'fields': ('type', 'title_template', 'message_template', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request)