from django.contrib import admin
from .models import PlaceReview, ProfessionalReview, Review


@admin.register(PlaceReview)
class PlaceReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'place', 'service', 'qualification', 'created_at')
    search_fields = ('user__user__username', 'place__name', 'service__name', 'opinion')
    list_filter = ('qualification', 'created_at', 'place__city')
    raw_id_fields = ('user', 'place', 'service')
    readonly_fields = ('created_at',)


@admin.register(ProfessionalReview)
class ProfessionalReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'professional', 'service', 'qualification', 'created_at')
    search_fields = ('user__user__username', 'professional__name', 'service__name', 'opinion')
    list_filter = ('qualification', 'created_at', 'professional__city')
    raw_id_fields = ('user', 'professional', 'service')
    readonly_fields = ('created_at',)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_public_profile', 'rating', 'service', 'created_at')
    search_fields = ('from_user__email', 'to_public_profile__name', 'message', 'service__name')
    list_filter = ('rating', 'created_at', 'to_public_profile__profile_type', 'to_public_profile__category')
    raw_id_fields = ('from_user', 'to_public_profile', 'service')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Review Information', {
            'fields': ('from_user', 'to_public_profile', 'rating', 'message')
        }),
        ('Service Reference', {
            'fields': ('service',)
        }),
        ('Media', {
            'fields': ('images',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )