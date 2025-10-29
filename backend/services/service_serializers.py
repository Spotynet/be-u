from rest_framework import serializers
from .models import Service, ServicesCategory, ServicesType
from users.models import User


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model"""
    
    pro_name = serializers.CharField(read_only=True)
    pro_user_email = serializers.EmailField(source='pro_user.email', read_only=True)
    pro_user_first_name = serializers.CharField(source='pro_user.first_name', read_only=True)
    pro_user_last_name = serializers.CharField(source='pro_user.last_name', read_only=True)
    pro_user_role = serializers.CharField(source='pro_user.role', read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'price', 'duration',
            'category', 'sub_category', 'pro_user', 'pro_name',
            'pro_user_email', 'pro_user_first_name', 'pro_user_last_name', 'pro_user_role',
            'images', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'pro_user', 'created_at', 'updated_at']
    
    def validate_price(self, value):
        """Validate price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
    
    def validate_duration(self, value):
        """Validate duration is positive"""
        if value.total_seconds() <= 0:
            raise serializers.ValidationError("Duration must be greater than 0")
        return value


class ServiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Service"""
    
    class Meta:
        model = Service
        fields = [
            'name', 'description', 'price', 'duration',
            'category', 'sub_category', 'images'
        ]
    
    def create(self, validated_data):
        """Create a new service"""
        # Set the pro_user from the request context
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['pro_user'] = request.user
        return super().create(validated_data)


class ServiceUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating Service"""
    
    class Meta:
        model = Service
        fields = [
            'name', 'description', 'price', 'duration',
            'category', 'sub_category', 'images', 'is_active'
        ]


class ServiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing services"""
    
    pro_name = serializers.CharField(read_only=True)
    pro_user_email = serializers.EmailField(source='pro_user.email', read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'price', 'duration', 'category', 'sub_category',
            'pro_name', 'pro_user_email', 'is_active', 'created_at'
        ]


class ServiceCategorySerializer(serializers.ModelSerializer):
    """Serializer for service categories"""
    
    class Meta:
        model = ServicesCategory
        fields = ['id', 'name', 'description']


class ServiceTypeSerializer(serializers.ModelSerializer):
    """Serializer for service types"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ServicesType
        fields = ['id', 'name', 'category', 'category_name', 'photo', 'description']
