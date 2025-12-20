from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import PublicProfile, User, ProfessionalProfile, PlaceProfile
from .profile_models import AvailabilitySchedule
from .profile_serializers import AvailabilityScheduleSerializer


class PublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for PublicProfile model"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_country = serializers.CharField(source='user.country', read_only=True)
    user_image = serializers.SerializerMethodField()
    display_name = serializers.CharField(read_only=True)
    availability = serializers.SerializerMethodField()
    
    def get_user_image(self, obj):
        """Get user image URL with proper absolute URL handling"""
        if obj.user and obj.user.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.image.url)
            # Fallback: if no request context, try to build URL manually
            from django.conf import settings
            if hasattr(settings, 'USE_S3') and settings.USE_S3:
                # S3 URL - should already be absolute
                return obj.user.image.url if obj.user.image.url.startswith('http') else f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{obj.user.image.name}"
            else:
                # Local storage - build absolute URL
                media_url = settings.MEDIA_URL
                if not media_url.startswith('http'):
                    # Need to construct full URL
                    # Try to get domain from request if available
                    if request:
                        scheme = request.scheme
                        host = request.get_host()
                        return f"{scheme}://{host}{media_url}{obj.user.image.name}"
                return obj.user.image.url
        return None
    
    class Meta:
        model = PublicProfile
        fields = [
            'id', 'user', 'user_email', 'user_first_name', 'user_last_name', 
            'user_phone', 'user_country', 'user_image',
            'profile_type', 'name', 'description', 'category', 'sub_categories',
            'images', 'linked_pros_place', 'has_calendar',
            'street', 'number_ext', 'number_int', 'postal_code', 'city', 'country',
            'last_name', 'bio', 'rating', 'display_name', 'availability',
            'latitude', 'longitude',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'rating', 'created_at', 'updated_at']
    
    def validate_profile_type(self, value):
        """Validate profile type"""
        if value not in [PublicProfile.ProfileType.PROFESSIONAL, PublicProfile.ProfileType.PLACE]:
            raise serializers.ValidationError("Invalid profile type")
        return value
    
    def validate(self, attrs):
        """Validate profile data based on type"""
        profile_type = attrs.get('profile_type')
        
        if profile_type == PublicProfile.ProfileType.PROFESSIONAL:
            # For professionals, last_name is required
            if not attrs.get('last_name'):
                raise serializers.ValidationError({
                    'last_name': 'Last name is required for professionals'
                })
        elif profile_type == PublicProfile.ProfileType.PLACE:
            # For places, address fields are more important
            if not attrs.get('street') or not attrs.get('city'):
                raise serializers.ValidationError({
                    'street': 'Street and city are required for places'
                })
        
        return attrs
    
    def get_availability(self, obj):
        """Get availability schedule for the public profile"""
        try:
            # Determine the underlying profile based on profile_type
            if obj.profile_type == 'PROFESSIONAL':
                # Get the ProfessionalProfile
                try:
                    professional_profile = obj.user.professional_profile
                    content_type = ContentType.objects.get_for_model(ProfessionalProfile)
                    object_id = professional_profile.id
                except (ProfessionalProfile.DoesNotExist, AttributeError):
                    return []
            elif obj.profile_type == 'PLACE':
                # Get the PlaceProfile
                try:
                    place_profile = obj.user.place_profile
                    content_type = ContentType.objects.get_for_model(PlaceProfile)
                    object_id = place_profile.id
                except (PlaceProfile.DoesNotExist, AttributeError):
                    return []
            else:
                return []
            
            # Fetch availability schedules
            schedules = AvailabilitySchedule.objects.filter(
                content_type=content_type,
                object_id=object_id
            ).order_by('day_of_week')
            
            return AvailabilityScheduleSerializer(schedules, many=True).data
        except Exception as e:
            # Return empty list if there's any error
            return []


class PublicProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating PublicProfile"""
    
    class Meta:
        model = PublicProfile
        fields = [
            'profile_type', 'name', 'description', 'category', 'sub_categories',
            'images', 'linked_pros_place', 'has_calendar',
            'street', 'number_ext', 'number_int', 'postal_code', 'city', 'country',
            'last_name', 'bio', 'latitude', 'longitude'
        ]
    
    def create(self, validated_data):
        """Create a new public profile"""
        # Set the user from the request context
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)


class PublicProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating PublicProfile"""
    photo = serializers.ImageField(write_only=True, required=False, allow_null=True, help_text="Profile photo (updates user.image). Send null/empty to delete.")
    delete_photo = serializers.BooleanField(write_only=True, required=False, help_text="Set to true to delete the profile photo")
    
    class Meta:
        model = PublicProfile
        fields = [
            'name', 'description', 'category', 'sub_categories',
            'images', 'linked_pros_place', 'has_calendar',
            'street', 'number_ext', 'number_int', 'postal_code', 'city', 'country',
            'last_name', 'bio', 'latitude', 'longitude', 'photo', 'delete_photo'
        ]
    
    def update(self, instance, validated_data):
        """Update profile and handle photo upload/delete to user.image"""
        photo = validated_data.pop('photo', None)
        delete_photo = validated_data.pop('delete_photo', False)
        
        # Update PublicProfile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle photo deletion
        if delete_photo:
            if instance.user.image:
                instance.user.image.delete(save=False)
            instance.user.image = None
            instance.user.save(update_fields=['image'])
        # Handle photo update
        elif photo is not None:
            # Check if photo is an empty string or None (deletion request via empty file)
            if photo == '' or (hasattr(photo, 'name') and not photo.name):
                # Delete the photo
                if instance.user.image:
                    instance.user.image.delete(save=False)
                instance.user.image = None
                instance.user.save(update_fields=['image'])
            else:
                # Update with new photo
                instance.user.image = photo
                instance.user.save(update_fields=['image'])
        
        return instance


class PublicProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing public profiles"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    display_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = PublicProfile
        fields = [
            'id', 'user_email', 'profile_type', 'name', 'display_name',
            'category', 'city', 'rating', 'has_calendar', 'created_at',
            'latitude', 'longitude'
        ]
