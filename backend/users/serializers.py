from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, ClientProfile, ProfessionalProfile, PlaceProfile
from .profile_models import ProfileImage, CustomService, AvailabilitySchedule, TimeSlot


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
            'id', 'email', 'username', 'firstName', 'lastName', 'phone', 'isActive',
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
            'email', 'password', 'firstName', 'lastName', 'username', 'phone'
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
            phone=validated_data.get('phone', ''),
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
        fields = ['id', 'user_id', 'email', 'name', 'last_name', 'bio', 'city', 'rating', 'category', 'sub_categories', 'services_count']
        read_only_fields = ['id', 'user_id', 'email', 'rating']
    
    def get_services_count(self, obj):
        total = 0
        # Services offered independently by the professional
        try:
            total += obj.independent_services.filter(is_active=True).count()
        except Exception:
            pass
        # Services assigned to the professional in places
        try:
            total += obj.assigned_services.filter(is_active=True).count()
        except Exception:
            pass
        return total


class PlaceProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    services_count = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    
    class Meta:
        model = PlaceProfile
        fields = [
            'id', 'user_id', 'email', 'name', 'bio', 'street', 'number_ext', 'number_int',
            'postal_code', 'city', 'country', 'owner', 'category', 'sub_categories', 'services_count', 'address'
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


# Enhanced serializers for client viewing with related data
class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'start_time', 'end_time', 'is_active']


class AvailabilityScheduleSerializer(serializers.ModelSerializer):
    time_slots = TimeSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = AvailabilitySchedule
        fields = ['id', 'day_of_week', 'is_available', 'time_slots']


class ProfileImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProfileImage
        fields = ['id', 'image', 'image_url', 'caption', 'is_primary', 'order', 'is_active']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class CustomServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomService
        fields = ['id', 'name', 'description', 'price', 'duration_minutes', 'category', 'is_active']


class ProfessionalProfileDetailSerializer(serializers.ModelSerializer):
    """Enhanced serializer for professional profiles with all related data"""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    images = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    services_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProfessionalProfile
        fields = [
            'id', 'user_id', 'email', 'phone', 'name', 'last_name', 'bio', 'city', 'rating',
            'category', 'sub_categories', 'images', 'services', 'availability', 'services_count'
        ]
        read_only_fields = ['id', 'user_id', 'email', 'phone', 'rating']
    
    def get_images(self, obj):
        images = ProfileImage.objects.filter(
            content_type__model='professionalprofile',
            object_id=obj.id,
            is_active=True
        ).order_by('order', 'created_at')
        return ProfileImageSerializer(images, many=True, context=self.context).data
    
    def get_services(self, obj):
        services = CustomService.objects.filter(
            content_type__model='professionalprofile',
            object_id=obj.id,
            is_active=True
        ).order_by('name')
        return CustomServiceSerializer(services, many=True).data
    
    def get_availability(self, obj):
        schedules = AvailabilitySchedule.objects.filter(
            content_type__model='professionalprofile',
            object_id=obj.id
        ).order_by('day_of_week')
        return AvailabilityScheduleSerializer(schedules, many=True).data
    
    def get_services_count(self, obj):
        total = 0
        # Custom services
        total += CustomService.objects.filter(
            content_type__model='professionalprofile',
            object_id=obj.id,
            is_active=True
        ).count()
        # Services offered independently by the professional
        try:
            total += obj.independent_services.filter(is_active=True).count()
        except Exception:
            pass
        # Services assigned to the professional in places
        try:
            total += obj.assigned_services.filter(is_active=True).count()
        except Exception:
            pass
        return total


class PlaceProfileDetailSerializer(serializers.ModelSerializer):
    """Enhanced serializer for place profiles with all related data"""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    images = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    services_count = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    
    class Meta:
        model = PlaceProfile
        fields = [
            'id', 'user_id', 'email', 'phone', 'name', 'bio', 'street', 'number_ext', 'number_int',
            'postal_code', 'city', 'country', 'owner', 'category', 'sub_categories', 'images', 'services', 'availability', 
            'services_count', 'address'
        ]
        read_only_fields = ['id', 'user_id', 'email', 'phone']
    
    def get_images(self, obj):
        images = ProfileImage.objects.filter(
            content_type__model='placeprofile',
            object_id=obj.id,
            is_active=True
        ).order_by('order', 'created_at')
        return ProfileImageSerializer(images, many=True, context=self.context).data
    
    def get_services(self, obj):
        services = CustomService.objects.filter(
            content_type__model='placeprofile',
            object_id=obj.id,
            is_active=True
        ).order_by('name')
        return CustomServiceSerializer(services, many=True).data
    
    def get_availability(self, obj):
        schedules = AvailabilitySchedule.objects.filter(
            content_type__model='placeprofile',
            object_id=obj.id
        ).order_by('day_of_week')
        return AvailabilityScheduleSerializer(schedules, many=True).data
    
    def get_services_count(self, obj):
        total = 0
        # Custom services
        total += CustomService.objects.filter(
            content_type__model='placeprofile',
            object_id=obj.id,
            is_active=True
        ).count()
        # Services offered by the place
        total += obj.services_offered.filter(is_active=True).count()
        return total
    
    def get_address(self, obj):
        parts = [obj.street]
        if obj.number_ext:
            parts.append(f"#{obj.number_ext}")
        if obj.city:
            parts.append(obj.city)
        return ', '.join(parts)

