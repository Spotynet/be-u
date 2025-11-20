from rest_framework import serializers
from users.models import User
from .models import Post, PostMedia, PostLike, PostComment, PollOption, PollVote

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class PostMediaSerializer(serializers.ModelSerializer):
    media_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PostMedia
        fields = ['id', 'media_type', 'media_file', 'media_url', 'caption', 'order']
    
    def get_media_url(self, obj):
        if obj.media_file:
            return obj.media_file.url
        return None

class PollOptionSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'text', 'order', 'votes_count']

    def get_votes_count(self, obj):
        return obj.votes.count()

class PostCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = PostComment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']

class PostLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostLike
        fields = ['id', 'user', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    media = PostMediaSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()
    poll_options = PollOptionSerializer(many=True, read_only=True)
    author_category = serializers.SerializerMethodField()
    author_sub_categories = serializers.SerializerMethodField()
    author_display_name = serializers.SerializerMethodField()
    author_rating = serializers.SerializerMethodField()
    author_profile_id = serializers.SerializerMethodField()
    author_public_profile_id = serializers.SerializerMethodField()
    author_profile_type = serializers.SerializerMethodField()
    author_photo = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'post_type', 'content', 'created_at', 'updated_at', 'expires_at',
            'media', 'likes_count', 'comments_count', 'user_has_liked', 'poll_options',
            'author_category', 'author_sub_categories', 'author_display_name',
            'author_rating', 'author_profile_id', 'author_public_profile_id', 'author_profile_type',
            'author_photo'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_user_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_author_category(self, obj):
        """Get the author's category from their PublicProfile"""
        try:
            # Try to access public_profile directly
            # If it doesn't exist, Django will raise PublicProfile.DoesNotExist
            profile = obj.author.public_profile
            return profile.category if profile else None
        except Exception:
            # Profile doesn't exist or other error
            return None

    def get_author_sub_categories(self, obj):
        """Get the author's subcategories from their PublicProfile"""
        try:
            # Try to access public_profile directly
            profile = obj.author.public_profile
            if not profile:
                return []
            
            sub_cats = profile.sub_categories
            # Ensure it's a list and handle None
            if sub_cats is None:
                return []
            if isinstance(sub_cats, list):
                return sub_cats
            # If it's stored as a string, try to parse it
            if isinstance(sub_cats, str):
                import json
                try:
                    return json.loads(sub_cats)
                except:
                    return [sub_cats] if sub_cats else []
            return []
        except Exception:
            # Profile doesn't exist or other error
            return []

    def _get_public_profile(self, obj):
        try:
            return obj.author.public_profile
        except Exception:
            return None

    def get_author_display_name(self, obj):
        profile = self._get_public_profile(obj)
        if profile:
            try:
                return profile.display_name
            except Exception:
                return profile.name
        return obj.author.username or obj.author.get_full_name() or obj.author.email

    def get_author_rating(self, obj):
        profile = self._get_public_profile(obj)
        if profile and profile.rating is not None:
            return float(profile.rating)
        return None

    def get_author_profile_id(self, obj):
        profile = self._get_public_profile(obj)
        if profile:
            return profile.id
        return None
    
    def get_author_public_profile_id(self, obj):
        """Alias for author_profile_id for consistency"""
        return self.get_author_profile_id(obj)

    def get_author_profile_type(self, obj):
        profile = self._get_public_profile(obj)
        if profile:
            return profile.profile_type
        return None
    
    def get_author_photo(self, obj):
        """Get author's profile photo from PublicProfile"""
        profile = self._get_public_profile(obj)
        if profile:
            # PublicProfile uses a JSON field for images or ProfileImage model
            # For now, return None - can be enhanced later to get primary image
            # from ProfileImage model using Generic Foreign Keys
            if hasattr(profile, 'images') and profile.images:
                # If images is a list with at least one URL
                if isinstance(profile.images, list) and len(profile.images) > 0:
                    return profile.images[0]  # Return first image
        return None

class PostCreateSerializer(serializers.ModelSerializer):
    media = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Post
        fields = ['post_type', 'content', 'media', 'expires_at']

    def create(self, validated_data):
        media_files = validated_data.pop('media', [])
        post = Post.objects.create(author=self.context['request'].user, **validated_data)

        # Handle media uploads
        for i, media_file in enumerate(media_files):
            # Determine media type based on file extension
            file_extension = media_file.name.lower().split('.')[-1]
            media_type = 'video' if file_extension in ['mp4', 'mov', 'avi', 'mkv', 'webm'] else 'image'
            
            PostMedia.objects.create(
                post=post,
                media_file=media_file,
                media_type=media_type,
                order=i
            )

        return post

class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostComment
        fields = ['content']

class PollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollVote
        fields = ['poll_option']

    def create(self, validated_data):
        poll_option = validated_data['poll_option']
        user = self.context['request'].user

        # Remove any existing vote by this user on this poll
        PollVote.objects.filter(
            poll_option__post=poll_option.post,
            user=user
        ).delete()

        return PollVote.objects.create(poll_option=poll_option, user=user)

