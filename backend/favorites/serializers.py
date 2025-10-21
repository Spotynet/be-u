from rest_framework import serializers
from .models import Favorite
from users.models import ProfessionalProfile, PlaceProfile


class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer for Favorite model"""
    
    favorite_name = serializers.ReadOnlyField()
    favorite_type = serializers.ReadOnlyField()
    favorite_specialty = serializers.ReadOnlyField()
    favorite_rating = serializers.ReadOnlyField()
    content_object_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorite
        fields = [
            'id',
            'user',
            'content_type',
            'object_id',
            'content_object_id',
            'favorite_name',
            'favorite_type',
            'favorite_specialty',
            'favorite_rating',
            'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def get_content_object_id(self, obj):
        """Get the actual ID of the content object"""
        return obj.object_id
    
    def create(self, validated_data):
        """Create a new favorite"""
        # Set the user from the request context
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user.client_profile
        return super().create(validated_data)


class FavoriteCreateSerializer(serializers.Serializer):
    """Serializer for creating favorites"""
    
    content_type = serializers.ChoiceField(choices=[
        ('professionalprofile', 'Professional'),
        ('placeprofile', 'Place')
    ])
    object_id = serializers.IntegerField()
    
    def validate(self, data):
        """Validate that the content object exists"""
        content_type = data['content_type']
        object_id = data['object_id']
        
        if content_type == 'professionalprofile':
            try:
                ProfessionalProfile.objects.get(id=object_id)
            except ProfessionalProfile.DoesNotExist:
                raise serializers.ValidationError("Professional not found")
        elif content_type == 'placeprofile':
            try:
                PlaceProfile.objects.get(id=object_id)
            except PlaceProfile.DoesNotExist:
                raise serializers.ValidationError("Place not found")
        
        return data


class FavoriteStatsSerializer(serializers.Serializer):
    """Serializer for favorite statistics"""
    
    total_count = serializers.IntegerField()
    professionals_count = serializers.IntegerField()
    places_count = serializers.IntegerField()

