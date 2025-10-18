from rest_framework import serializers
from users.models import User
from .models import Post, PostMedia, PostLike, PostComment, PollOption, PollVote

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ['id', 'media_type', 'media_file', 'caption', 'order']

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

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'post_type', 'content', 'created_at', 'updated_at',
            'media', 'likes_count', 'comments_count', 'user_has_liked', 'poll_options'
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

class PostCreateSerializer(serializers.ModelSerializer):
    media = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Post
        fields = ['post_type', 'content', 'media']

    def create(self, validated_data):
        media_files = validated_data.pop('media', [])
        post = Post.objects.create(author=self.context['request'].user, **validated_data)

        # Handle media uploads
        for i, media_file in enumerate(media_files):
            PostMedia.objects.create(
                post=post,
                media_file=media_file,
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

