import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ContentReport, UserBlock

logger = logging.getLogger(__name__)

REASON_LABELS = {
    "spam": "Spam",
    "acoso": "Acoso",
    "inapropiado": "Contenido inapropiado",
    "estafa": "Estafa",
    "otro": "Otro",
}


def _notify_support(report: ContentReport, reporter):
    inbox = (getattr(settings, "SUPPORT_INBOX_EMAIL", "") or "").strip()
    if not inbox:
        logger.warning("SUPPORT_INBOX_EMAIL is not configured; content report stored only")
        return
    label = REASON_LABELS.get(report.reason, report.reason)
    body = (
        f"Nuevo reporte de contenido — nabbi\n"
        f"Tipo: {report.target_type}\n"
        f"ID: {report.target_id}\n"
        f"Motivo: {label}\n"
        f"Nota: {report.note or '—'}\n"
        f"Reportado por: {getattr(reporter, 'email', '')} (id {reporter.id})\n"
    )
    try:
        send_mail(
            subject=f"[Nabbi Reporte] {report.target_type} #{report.target_id} — {label}",
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[inbox],
            fail_silently=False,
        )
    except Exception as exc:
        logger.error("Failed to email content report: %s", exc)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_report(request):
    target_type = (request.data.get("target_type") or "").strip()
    reason = (request.data.get("reason") or "").strip()
    note = (request.data.get("note") or "").strip()
    try:
        target_id = int(request.data.get("target_id"))
    except (TypeError, ValueError):
        return Response({"error": "target_id inválido"}, status=status.HTTP_400_BAD_REQUEST)

    valid_types = {choice[0] for choice in ContentReport.TargetType.choices}
    valid_reasons = {choice[0] for choice in ContentReport.Reason.choices}
    if target_type not in valid_types or reason not in valid_reasons:
        return Response({"error": "Tipo o motivo inválido"}, status=status.HTTP_400_BAD_REQUEST)

    report = ContentReport.objects.create(
        reporter=request.user,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        note=note[:1000],
    )
    _notify_support(report, request.user)
    return Response({"id": report.id, "message": "Reporte enviado"}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_block(request):
    try:
        user_id = int(request.data.get("user_id"))
    except (TypeError, ValueError):
        return Response({"error": "user_id inválido"}, status=status.HTTP_400_BAD_REQUEST)

    if user_id == request.user.id:
        return Response({"error": "No puedes bloquearte a ti mismo"}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    if not User.objects.filter(pk=user_id).exists():
        return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    block, _created = UserBlock.objects.get_or_create(blocker=request.user, blocked_id=user_id)
    return Response({"id": block.id, "blocked_user_id": user_id}, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_block(request, user_id):
    UserBlock.objects.filter(blocker=request.user, blocked_id=user_id).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
