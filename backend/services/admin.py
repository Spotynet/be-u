from django.contrib import admin
from .models import (
    ServicesCategory, ServicesType, ServiceInPlace, 
    ProfessionalService, ProviderAvailability, TimeSlotBlock, Service
)


@admin.register(ServicesCategory)
class ServicesCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name', 'description')


@admin.register(ServicesType)
class ServicesTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    search_fields = ('name', 'description')
    list_filter = ('category',)


@admin.register(ServiceInPlace)
class ServiceInPlaceAdmin(admin.ModelAdmin):
    list_display = ('service', 'place', 'professional', 'price', 'time', 'is_active', 'created_at')
    search_fields = ('service__name', 'place__name', 'description')
    list_filter = ('is_active', 'service__category', 'place__city')
    raw_id_fields = ('place', 'service', 'professional')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ProfessionalService)
class ProfessionalServiceAdmin(admin.ModelAdmin):
    list_display = ('service', 'professional', 'price', 'time', 'is_active', 'created_at')
    search_fields = ('service__name', 'professional__name', 'description')
    list_filter = ('is_active', 'service__category', 'professional__city')
    raw_id_fields = ('professional', 'service')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ProviderAvailability)
class ProviderAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('provider', 'day_of_week', 'start_time', 'end_time', 'is_active')
    list_filter = ('day_of_week', 'is_active')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TimeSlotBlock)
class TimeSlotBlockAdmin(admin.ModelAdmin):
    list_display = ('provider', 'date', 'start_time', 'end_time', 'reason')
    list_filter = ('reason', 'date')
    search_fields = ('notes',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'pro_user', 'category', 'sub_category', 'price', 'duration', 'is_active')
    search_fields = ('name', 'description', 'category', 'sub_category', 'pro_user__email')
    list_filter = ('category', 'sub_category', 'is_active', 'pro_user__role')
    raw_id_fields = ('pro_user',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Service Information', {
            'fields': ('name', 'description', 'category', 'sub_category')
        }),
        ('Pricing & Duration', {
            'fields': ('price', 'duration')
        }),
        ('Provider', {
            'fields': ('pro_user',)
        }),
        ('Media', {
            'fields': ('images',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )