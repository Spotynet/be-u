from django.contrib import admin
from .models import GoogleCalendarCredentials, CalendarEvent


@admin.register(GoogleCalendarCredentials)
class GoogleCalendarCredentialsAdmin(admin.ModelAdmin):
    list_display = ('user', 'calendar_id', 'is_active', 'last_sync_at', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'user__username', 'calendar_id')
    readonly_fields = ('created_at', 'updated_at', 'token_expiry', 'last_sync_at')
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Calendar Settings', {
            'fields': ('calendar_id', 'is_active')
        }),
        ('Sync Status', {
            'fields': ('last_sync_at', 'sync_error')
        }),
        ('Token Info', {
            'fields': ('token_expiry',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'google_event_id', 'calendar_owner', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('google_event_id', 'reservation__code', 'calendar_owner__email')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('reservation', 'calendar_owner')




