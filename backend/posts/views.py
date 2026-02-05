from rest_framework import viewsets, status, generics
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from .models import Post, PostMedia, PostLike, PostComment, PollOption, PollVote
from .serializers import (
    PostSerializer, PostCreateSerializer, CommentCreateSerializer,
    PollVoteSerializer, PostMediaSerializer, PostCommentSerializer
)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Post.objects.select_related('author').prefetch_related('media', 'likes', 'comments')

        # Filter out expired video posts (stories-like behavior)
        # Show videos that either:
        # 1. Are not expired (expires_at > now) OR
        # 2. Don't have an expiration date (expires_at is null) OR
        # 3. Are not video type posts
        now = timezone.now()
        queryset = queryset.filter(
            Q(post_type='video', expires_at__gt=now) | 
            Q(post_type='video', expires_at__isnull=True) | 
            ~Q(post_type='video')
        )

        # Filter by author
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author_id=author)

        # Filter by type
        post_type = self.request.query_params.get('type', None)
        if post_type:
            queryset = queryset.filter(post_type=post_type)

        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Return a single post."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        # Only the author can update
        instance = self.get_object()
        if instance.author != self.request.user:
            raise PermissionDenied('Not authorized')
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        # Only the author can delete
        instance = self.get_object()
        if instance.author != request.user:
            raise PermissionDenied('Not authorized')
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user

        # Check if like already exists
        like, created = PostLike.objects.get_or_create(post=post, user=user)

        if not created:
            # Unlike if already exists
            like.delete()
            return Response({'liked': False})

        return Response({'liked': True})
    
    @action(detail=False, methods=['get'], url_path='liked')
    def liked_posts(self, request):
        """Get all posts liked by the authenticated user"""
        user = request.user
        liked_post_ids = PostLike.objects.filter(user=user).values_list('post_id', flat=True)
        posts = Post.objects.filter(id__in=liked_post_ids).select_related(
            'author', 'author__public_profile'
        ).prefetch_related('media', 'likes', 'comments')
        
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        post = self.get_object()
        comments = post.comments.select_related('author').all()
        page = self.paginate_queryset(comments)

        if page is not None:
            serializer = PostCommentSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = PostCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        post = self.get_object()
        serializer = CommentCreateSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            comment = PostComment.objects.create(
                post=post,
                author=request.user,
                **serializer.validated_data
            )
            return Response(PostCommentSerializer(comment, context={'request': request}).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'])
    def delete_comment(self, request, pk=None):
        post = self.get_object()
        comment_id = request.query_params.get('comment_id')

        if not comment_id:
            return Response({'error': 'comment_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            comment = PostComment.objects.get(id=comment_id, post=post, author=request.user)
            comment.delete()
            return Response({'deleted': True})
        except PostComment.DoesNotExist:
            return Response({'error': 'Comment not found or not authorized'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_photo_post(request):
    if not request.user or not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Log request info for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Creating photo post for user {request.user.id}")
    logger.info(f"Request FILES keys: {list(request.FILES.keys())}")
    logger.info(f"Request data keys: {list(request.data.keys())}")
    
    # Check if media files are provided
    if 'media' not in request.FILES and len(request.FILES) == 0:
        logger.warning("No media files in request")
        return Response({'detail': 'No media file provided. Please select at least one image.'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = PostCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save(post_type='photo')
        logger.info(f"Photo post created successfully: {post.id}")
        return Response(PostSerializer(post, context={'request': request}).data)

    logger.error(f"Serializer errors: {serializer.errors}")
    return Response({
        'detail': 'Validation failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_video_post(request):
    if not request.user or not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if media file is provided
    if 'media' not in request.FILES and len(request.FILES) == 0:
        return Response({'error': 'No media file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Video posts don't accept content/description
    # Use request.data directly (it includes files when using MultiPartParser)
    # Don't use .copy() as it might lose file references
    data = {}
    for key, value in request.data.items():
        if key != 'content':  # Skip content field
            data[key] = value
    
    # Add media files from request.FILES
    if 'media' in request.FILES:
        # Get all files with 'media' key
        media_list = request.FILES.getlist('media')
        if media_list:
            data['media'] = media_list
    
    serializer = PostCreateSerializer(data=data, context={'request': request})

    if serializer.is_valid():
        # Set expiration to 24 hours from now for video posts
        expires_at = timezone.now() + timedelta(hours=24)
        post = serializer.save(post_type='video', expires_at=expires_at, content=None)
        return Response(PostSerializer(post, context={'request': request}).data)

    # Return detailed error information for debugging
    return Response({
        'errors': serializer.errors, 
        'received_data_keys': list(data.keys()),
        'files_keys': list(request.FILES.keys()),
        'has_media_in_files': 'media' in request.FILES,
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_carousel_post(request):
    serializer = PostCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save(post_type='carousel')
        return Response(PostSerializer(post, context={'request': request}).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_mosaic_post(request):
    serializer = PostCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save(post_type='mosaic')
        return Response(PostSerializer(post, context={'request': request}).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_pet_adoption_post(request):
    if not request.user or not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = PostCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save(post_type='pet_adoption')
        return Response(PostSerializer(post, context={'request': request}).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_poll_post(request):
    data = request.data.copy()
    data['post_type'] = 'poll'

    serializer = PostCreateSerializer(data=data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save()

        # Create poll options
        options = request.data.getlist('options', [])
        for i, option_text in enumerate(options):
            PollOption.objects.create(post=post, text=option_text, order=i)

        return Response(PostSerializer(post, context={'request': request}).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_review_post(request):
    data = request.data.copy()
    data['post_type'] = 'review'

    serializer = PostCreateSerializer(data=data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save()
        return Response(PostSerializer(post, context={'request': request}).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_transformation_post(request):
    """Create a Before/After (transformation) post with two images.

    Expected multipart/form-data fields:
    - before: file (required)
    - after: file (required)
    - caption: string (optional)
    - treatment, duration, products: optional metadata (currently stored in content)
    """
    if not request.user or not request.user.is_authenticated:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    before_file = request.FILES.get('before')
    after_file = request.FILES.get('after')

    if not before_file or not after_file:
        return Response({'error': 'Both before and after images are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Build content from caption/metadata
    caption = request.data.get('caption', '')
    treatment = request.data.get('treatment')
    duration = request.data.get('duration')
    products = request.data.get('products')
    extra_parts = []
    if treatment:
        extra_parts.append(f"Tratamiento: {treatment}")
    if duration:
        extra_parts.append(f"Duración: {duration}")
    if products:
        extra_parts.append(f"Productos: {products}")
    full_content = caption
    if extra_parts:
        full_content = (caption + "\n\n" + " | ".join(extra_parts)).strip()

    # Create post
    post = Post.objects.create(author=request.user, post_type='before_after', content=full_content)

    # Attach media in order
    PostMedia.objects.create(post=post, media_file=before_file, media_type='image', order=0, caption='before')
    PostMedia.objects.create(post=post, media_file=after_file, media_type='image', order=1, caption='after')

    return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_in_poll(request, post_id):
    try:
        post = Post.objects.get(id=post_id, post_type='poll')
    except Post.DoesNotExist:
        return Response({'error': 'Poll not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = PollVoteSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        vote = serializer.save()
        return Response({'voted': True})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)