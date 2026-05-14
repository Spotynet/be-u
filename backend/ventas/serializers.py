from rest_framework import serializers
from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = [
            "id", "item_type", "service_ref",
            "name", "description", "quantity",
            "unit_price", "discount", "total",
        ]
        read_only_fields = ["id", "total"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, required=False)

    class Meta:
        model = Sale
        fields = [
            "id", "sale_number", "seller",
            "reservation",
            "client_name", "client_email", "client_phone",
            "currency",
            "subtotal", "discount", "tax", "total",
            "status", "payment_method", "amount_paid", "change_given",
            "notes", "paid_at",
            "created_at", "updated_at",
            "items",
        ]
        read_only_fields = ["id", "sale_number", "seller", "subtotal", "total", "paid_at", "created_at", "updated_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        sale.save()  # recalculate totals
        return sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SaleItem.objects.create(sale=instance, **item_data)

        instance.save()  # recalculate totals
        return instance


class SaleListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list view."""
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            "id", "sale_number",
            "client_name", "client_email",
            "currency", "subtotal", "discount", "tax", "total",
            "status", "payment_method", "amount_paid",
            "notes", "paid_at", "created_at",
            "item_count",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class SaleStatsSerializer(serializers.Serializer):
    total_sales      = serializers.IntegerField()
    total_revenue    = serializers.DecimalField(max_digits=14, decimal_places=2)
    paid_revenue     = serializers.DecimalField(max_digits=14, decimal_places=2)
    pending_revenue  = serializers.DecimalField(max_digits=14, decimal_places=2)
    today_revenue    = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_currency      = serializers.DictField()
    by_status        = serializers.DictField()
