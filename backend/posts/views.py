from rest_framework import viewsets, status, generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.contrib.contenttypes.models import ContentType
from .models import Post, PostMedia, PostLike, PostComment, PollOption, PollVote
from .serializers import (
    PostSerializer, PostCreateSerializer, CommentCreateSerializer,
    PollVoteSerializer, PostMediaSerializer, PostCommentSerializer
)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    permission_classes = [AllowAny]  # Public read, authenticated write

    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'like', 'add_comment', 'delete_comment']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = Post.objects.select_related('author').prefetch_related('media', 'likes', 'comments')

        # Filter by author
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author_id=author)

        # Filter by type
        post_type = self.request.query_params.get('type', None)
        if post_type:
            queryset = queryset.filter(post_type=post_type)

        return queryset

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
    serializer = PostCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save(post_type='photo')
        return Response(PostSerializer(post, context={'request': request}).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_video_post(request):
    serializer = PostCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save(post_type='video')
        return Response(PostSerializer(post, context={'request': request}).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_carousel_post(request):
    serializer = PostCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        post = serializer.save(post_type='carousel')
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