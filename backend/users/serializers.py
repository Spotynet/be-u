from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, ClientProfile, ProfessionalProfile, PlaceProfile


class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    dateJoined = serializers.DateTimeField(source='date_joined')
    lastLogin = serializers.DateTimeField(source='last_login')
    isStaff = serializers.BooleanField(source='is_staff')
    isSuperuser = serializers.BooleanField(source='is_superuser')
    isActive = serializers.BooleanField(source='is_active')
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'firstName', 'lastName', 'isActive',
            'dateJoined', 'lastLogin', 'role', 'isStaff', 'isSuperuser'
        ]
        read_only_fields = ['id', 'dateJoined', 'lastLogin']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'firstName', 'lastName', 'username'
        ]
    
    def create(self, validated_data):
        # Extract first_name and last_name
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        
        # Create user - username is now included in validated_data
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            role=User.Role.CLIENT  # Default role
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Authenticate with email and password directly
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ['phone', 'photo']


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    services_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProfessionalProfile
        fields = ['id', 'user_id', 'email', 'name', 'last_name', 'bio', 'city', 'rating', 'services_count']
        read_only_fields = ['id', 'user_id', 'email', 'rating']
    
    def get_services_count(self, obj):
        return obj.services.filter(is_active=True).count()


class PlaceProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    services_count = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    
    class Meta:
        model = PlaceProfile
        fields = [
            'id', 'user_id', 'email', 'name', 'street', 'number_ext', 'number_int',
            'postal_code', 'city', 'country', 'owner', 'services_count', 'address'
        ]
        read_only_fields = ['id', 'user_id', 'email']
    
    def get_services_count(self, obj):
        return obj.services_offered.filter(is_active=True).count()
    
    def get_address(self, obj):
        parts = [obj.street]
        if obj.number_ext:
            parts.append(f"#{obj.number_ext}")
        if obj.city:
            parts.append(obj.city)
        return ', '.join(parts)

