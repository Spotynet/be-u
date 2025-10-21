from django.contrib import admin
from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'content_object', 'favorite_type', 'favorite_name', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['user__user__username', 'user__user__email']
    raw_id_fields = ['user']
    readonly_fields = ['created_at']
    
    def favorite_type(self, obj):
        return obj.favorite_type
    favorite_type.short_description = 'Tipo'
    
    def favorite_name(self, obj):
        return obj.favorite_name
    favorite_name.short_description = 'Nombre'

