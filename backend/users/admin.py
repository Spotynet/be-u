from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ClientProfile, ProfessionalProfile, PlaceProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'first_name', 'last_name', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone')
    search_fields = ('user__username', 'user__email', 'phone')


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'last_name', 'city', 'rating')
    search_fields = ('user__username', 'name', 'last_name', 'city')
    list_filter = ('city',)


@admin.register(PlaceProfile)
class PlaceProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'city', 'country', 'owner')
    search_fields = ('user__username', 'name', 'city', 'country')
    list_filter = ('city', 'country')