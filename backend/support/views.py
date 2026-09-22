import logging
import secrets
import string

from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .emails import send_support_feedback_email, THEME_LABELS

logger = logging.getLogger(__name__)

MAX_MESSAGE_LENGTH = 500
MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024  # 5MB
ALLOWED_ATTACHMENT_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
}


def _ticket_id() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(8))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def submit_feedback(request):
    """
    POST /api/support/feedback/
    multipart: theme, message, email, accept_terms, attachment?
    """
    theme = (request.data.get("theme") or "").strip()
    message = (request.data.get("message") or "").strip()
    reply_email = (request.data.get("email") or "").strip().lower()
    accept_terms_raw = (request.data.get("accept_terms") or "").strip().lower()
    attachment = request.FILES.get("attachment")

    if theme not in THEME_LABELS:
        return Response(
            {"theme": ["Tema inválido. Usa: error, sugerencia, cita, queja, otro."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not message:
        return Response(
            {"message": ["El mensaje es obligatorio."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if len(message) > MAX_MESSAGE_LENGTH:
        return Response(
            {"message": [f"Máximo {MAX_MESSAGE_LENGTH} caracteres."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not reply_email:
        return Response(
            {"email": ["Indica un correo de contacto."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        validate_email(reply_email)
    except ValidationError:
        return Response(
            {"email": ["Correo inválido."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if accept_terms_raw not in ("true", "1", "yes"):
        return Response(
            {"accept_terms": ["Debes aceptar los términos de soporte."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if attachment is not None:
        size = getattr(attachment, "size", 0) or 0
        if size > MAX_ATTACHMENT_BYTES:
            return Response(
                {"attachment": ["La imagen supera 5MB."]},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )
        content_type = (getattr(attachment, "content_type", "") or "").lower()
        if content_type and content_type not in ALLOWED_ATTACHMENT_CONTENT_TYPES:
            name = (getattr(attachment, "name", "") or "").lower()
            if not any(name.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif")):
                return Response(
                    {"attachment": ["Solo se permiten imágenes."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

    ticket_id = _ticket_id()
    sent = send_support_feedback_email(
        ticket_id=ticket_id,
        theme=theme,
        message=message,
        reply_email=reply_email,
        user=request.user,
        attachment=attachment,
    )

    if not sent:
        return Response(
            {"message": "No se pudo enviar el mensaje. Intenta de nuevo más tarde."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "ticket_id": ticket_id,
            "message": "Mensaje recibido. Te responderemos pronto.",
        },
        status=status.HTTP_201_CREATED,
    )
