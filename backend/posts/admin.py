from django.contrib import admin
from django.utils.html import format_html
from .models import Post, PostMedia, PostLike, PostComment, PollOption, PollVote


class PostMediaInline(admin.TabularInline):
    model = PostMedia
    extra = 0
    fields = ("media_type", "media_file", "order", "preview")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj and obj.media_file:
            # Use the storage URL (S3 signed URL if enabled)
            return format_html('<img src="{}" style="height:60px;border-radius:6px;"/>', obj.media_file.url)
        return ""


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "post_type", "created_at", "updated_at", "media_count")
    list_filter = ("post_type", "created_at")
    search_fields = ("author__username", "content")
    date_hierarchy = "created_at"
    inlines = [PostMediaInline]

    def media_count(self, obj):
        return obj.media.count()


@admin.register(PostMedia)
class PostMediaAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "media_type", "order", "thumb")
    list_filter = ("media_type",)
    search_fields = ("post__author__username",)
    readonly_fields = ("thumb",)

    def thumb(self, obj):
        if obj.media_file:
            return format_html('<img src="{}" style="height:80px;border-radius:8px;"/>', obj.media_file.url)
        return ""


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "author", "created_at")
    search_fields = ("content", "author__username")
    date_hierarchy = "created_at"
    raw_id_fields = ("post", "author")


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")
    search_fields = ("user__username",)
    raw_id_fields = ("post", "user")


@admin.register(PollOption)
class PollOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "text", "order")
    list_filter = ("post",)
    search_fields = ("text",)
    raw_id_fields = ("post",)


@admin.register(PollVote)
class PollVoteAdmin(admin.ModelAdmin):
    list_display = ("id", "poll_option", "user", "created_at")
    raw_id_fields = ("poll_option", "user")
