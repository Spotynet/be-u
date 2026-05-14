from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ["total"]


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display  = ["sale_number", "seller", "client_name", "currency", "total", "status", "created_at"]
    list_filter   = ["status", "currency", "payment_method", "created_at"]
    search_fields = ["sale_number", "client_name", "client_email"]
    readonly_fields = ["sale_number", "subtotal", "total", "paid_at", "created_at", "updated_at"]
    inlines = [SaleItemInline]
