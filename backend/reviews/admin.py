from django.contrib import admin
from .models import PlaceReview, ProfessionalReview


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