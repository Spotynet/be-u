from django.contrib import admin
from .models import ServicesCategory, ServicesType, ServiceInPlace


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
    list_display = ('service', 'place', 'price', 'time', 'is_active')
    search_fields = ('service__name', 'place__name', 'description')
    list_filter = ('is_active', 'service__category', 'place__city')
    raw_id_fields = ('place', 'service')