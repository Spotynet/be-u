from django.contrib import admin
from .models import Review, ReviewImage


class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 0
    fields = ("image", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_public_profile', 'rating', 'service', 'created_at')
    search_fields = ('from_user__email', 'to_public_profile__name', 'message', 'service__name')
    list_filter = ('rating', 'created_at', 'to_public_profile__profile_type', 'to_public_profile__category')
    raw_id_fields = ('from_user', 'to_public_profile', 'service')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ReviewImageInline]
    
    fieldsets = (
        ('Review Information', {
            'fields': ('from_user', 'to_public_profile', 'rating', 'message')
        }),
        ('Service Reference', {
            'fields': ('service',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )