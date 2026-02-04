from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ClientProfile, ProfessionalProfile, PlaceProfile, PublicProfile
from .profile_models import ProfileImage, CustomService, AvailabilitySchedule, TimeSlot, BreakTime


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'first_name', 'last_name', 'phone', 'city', 'country', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'date_joined', 'country', 'city')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone', 'country', 'city')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
        ('Contact Information', {'fields': ('phone', 'city', 'country')}),
        ('Profile Image', {'fields': ('image',)}),
    )


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone')
    search_fields = ('user__username', 'user__email', 'phone')


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'last_name', 'category', 'city', 'rating')
    search_fields = ('user__username', 'name', 'last_name', 'city', 'category')
    list_filter = ('category', 'city')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'last_name', 'bio', 'city', 'rating')
        }),
        ('Categories', {
            'fields': ('category', 'sub_categories')
        }),
    )


@admin.register(PlaceProfile)
class PlaceProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'category', 'city', 'country', 'owner')
    search_fields = ('user__username', 'name', 'city', 'country', 'bio', 'description', 'category')
    list_filter = ('category', 'city', 'country')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'bio', 'description')
        }),
        ('Categories', {
            'fields': ('category', 'sub_categories')
        }),
        ('Address', {
            'fields': ('street', 'number_ext', 'number_int', 'postal_code', 'city', 'country')
        }),
        ('Ownership', {
            'fields': ('owner',)
        }),
    )


@admin.register(PublicProfile)
class PublicProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'profile_type', 'name', 'category', 'city', 'rating', 'has_calendar', 'latitude', 'longitude')
    search_fields = ('user__email', 'name', 'description', 'category', 'city')
    list_filter = ('profile_type', 'category', 'city', 'has_calendar')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'profile_type', 'name', 'description', 'category', 'sub_categories')
        }),
        ('Images & Links', {
            'fields': ('images', 'linked_pros_place', 'has_calendar')
        }),
        ('Professional Fields', {
            'fields': ('last_name', 'bio', 'rating'),
            'classes': ('collapse',)
        }),
        ('Place Fields', {
            'fields': ('street', 'number_ext', 'number_int', 'postal_code', 'city', 'country'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ProfileImage)
class ProfileImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_profile_type', 'caption', 'is_primary', 'is_active', 'order')
    list_filter = ('is_primary', 'is_active', 'content_type')
    search_fields = ('caption',)
    ordering = ('order', 'created_at')
    
    def get_profile_type(self, obj):
        """Get the type of profile this image belongs to"""
        if obj.content_type:
            return f"{obj.content_type.model} (ID: {obj.object_id})"
        return "No profile"
    get_profile_type.short_description = "Profile Type"


@admin.register(CustomService)
class CustomServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price', 'duration_minutes', 'category', 'is_active', 'get_profile_type')
    list_filter = ('category', 'is_active', 'content_type')
    search_fields = ('name', 'description', 'category')
    ordering = ('name',)
    
    def get_profile_type(self, obj):
        """Get the type of profile this service belongs to"""
        if obj.content_type:
            return f"{obj.content_type.model} (ID: {obj.object_id})"
        return "No profile"
    get_profile_type.short_description = "Profile Type"


@admin.register(BreakTime)
class BreakTimeAdmin(admin.ModelAdmin):
    list_display = ('schedule', 'start_time', 'end_time', 'label', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('label', 'schedule__day_of_week')
    raw_id_fields = ('schedule',)


@admin.register(AvailabilitySchedule)
class AvailabilityScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'day_of_week', 'is_available', 'get_profile_type')
    list_filter = ('day_of_week', 'is_available', 'content_type')
    ordering = ('day_of_week',)
    
    def get_profile_type(self, obj):
        """Get the type of profile this schedule belongs to"""
        if obj.content_type:
            return f"{obj.content_type.model} (ID: {obj.object_id})"
        return "No profile"
    get_profile_type.short_description = "Profile Type"


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('id', 'schedule', 'start_time', 'end_time', 'is_active')
    list_filter = ('is_active', 'schedule__day_of_week')
    search_fields = ('start_time', 'end_time')
    ordering = ('schedule__day_of_week', 'start_time')