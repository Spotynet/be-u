from django.contrib import admin

from .models import ContentReport, UserBlock


@admin.register(ContentReport)
class ContentReportAdmin(admin.ModelAdmin):
    list_display = ("id", "target_type", "target_id", "reason", "reporter", "created_at")
    list_filter = ("target_type", "reason")
    search_fields = ("note", "reporter__email")


@admin.register(UserBlock)
class UserBlockAdmin(admin.ModelAdmin):
    list_display = ("id", "blocker", "blocked", "created_at")
    search_fields = ("blocker__email", "blocked__email")
