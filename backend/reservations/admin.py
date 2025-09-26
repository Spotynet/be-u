from django.contrib import admin
from .models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('code', 'client', 'place', 'service', 'date', 'time', 'status', 'created_at')
    search_fields = ('code', 'client__user__username', 'place__name', 'service__name')
    list_filter = ('status', 'date', 'created_at', 'place__city')
    raw_id_fields = ('client', 'professional', 'place', 'service')
    readonly_fields = ('code', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Reservation Details', {
            'fields': ('code', 'client', 'professional', 'place', 'service')
        }),
        ('Schedule', {
            'fields': ('date', 'time')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )