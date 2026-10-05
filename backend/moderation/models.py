from django.conf import settings
from django.db import models


class ContentReport(models.Model):
    class TargetType(models.TextChoices):
        POST = "post", "Post"
        COMMENT = "comment", "Comment"
        REVIEW = "review", "Review"
        PROFILE = "profile", "Profile"

    class Reason(models.TextChoices):
        SPAM = "spam", "Spam"
        ACOSO = "acoso", "Acoso"
        INAPROPIADO = "inapropiado", "Contenido inapropiado"
        ESTAFA = "estafa", "Estafa"
        OTRO = "otro", "Otro"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="content_reports",
    )
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.PositiveIntegerField()
    reason = models.CharField(max_length=20, choices=Reason.choices)
    note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.target_type}:{self.target_id} by {self.reporter_id}"


class UserBlock(models.Model):
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocks_made",
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocks_received",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["blocker", "blocked"], name="unique_user_block"),
        ]

    def __str__(self):
        return f"{self.blocker_id} blocked {self.blocked_id}"
