from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone

User = get_user_model()


class Notification(models.Model):
    """Notification model for user notifications"""
    
    class NotificationType(models.TextChoices):
        RESERVATION = "reserva", "Reserva"
        REVIEW = "reseña", "Reseña"
        SYSTEM = "sistema", "Sistema"
        MESSAGE = "mensaje", "Mensaje"
    
    class NotificationStatus(models.TextChoices):
        READ = "read", "Read"
        UNREAD = "unread", "Unread"
    
    # User who receives the notification
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    
    # Notification content
    type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=10, choices=NotificationStatus.choices, default=NotificationStatus.UNREAD)
    
    # Related object (reservation, review, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional metadata as JSON
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if self.status == self.NotificationStatus.UNREAD:
            self.status = self.NotificationStatus.READ
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])
    
    def mark_as_unread(self):
        """Mark notification as unread"""
        if self.status == self.NotificationStatus.READ:
            self.status = self.NotificationStatus.UNREAD
            self.read_at = None
            self.save(update_fields=['status', 'read_at'])


class NotificationTemplate(models.Model):
    """Template for generating notifications"""
    
    class NotificationType(models.TextChoices):
        RESERVATION = "reserva", "Reserva"
        REVIEW = "reseña", "Reseña"
        SYSTEM = "sistema", "Sistema"
        MESSAGE = "mensaje", "Mensaje"
    
    type = models.CharField(max_length=20, choices=NotificationType.choices, unique=True)
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Template for {self.type}"
    
    def render_notification(self, context):
        """Render notification using template and context"""
        from django.template import Template, Context
        
        title = Template(self.title_template).render(Context(context))
        message = Template(self.message_template).render(Context(context))
        
        return {
            'title': title,
            'message': message
        }