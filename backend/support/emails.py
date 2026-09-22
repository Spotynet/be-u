"""
Send help/support feedback emails to SUPPORT_INBOX_EMAIL.
Reuses the same SMTP stack as login codes (EMAIL_* / DEFAULT_FROM_EMAIL).
"""
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)

THEME_LABELS = {
    "error": "Reportar un Error",
    "sugerencia": "Sugerencia",
    "cita": "Problema con una Cita",
    "queja": "Queja",
    "otro": "Otro",
}


def _from_email_display() -> str:
    default_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@be-u.ai")
    raw = str(default_email)
    if "<" in raw and ">" in raw:
        email_addr = raw[raw.index("<") + 1 : raw.index(">")]
    else:
        email_addr = raw
    return f"Nabbi Soporte <{email_addr}>"


def send_support_feedback_email(
    *,
    ticket_id: str,
    theme: str,
    message: str,
    reply_email: str,
    user=None,
    attachment=None,
) -> bool:
    """Email the support inbox. Returns True if send succeeded."""
    inbox = (getattr(settings, "SUPPORT_INBOX_EMAIL", "") or "").strip()
    if not inbox:
        logger.error("SUPPORT_INBOX_EMAIL is not configured; cannot send support feedback")
        return False

    theme_label = THEME_LABELS.get(theme, theme)
    user_id = getattr(user, "id", None) if user and getattr(user, "is_authenticated", False) else None
    user_email = getattr(user, "email", None) if user and getattr(user, "is_authenticated", False) else None

    context = {
        "ticket_id": ticket_id,
        "theme": theme,
        "theme_label": theme_label,
        "message": message,
        "reply_email": reply_email,
        "user_id": user_id,
        "user_email": user_email,
        "submitted_at": timezone.now().strftime("%Y-%m-%d %H:%M UTC"),
        "year": timezone.now().year,
    }

    html_message = render_to_string("support/support_feedback_email.html", context)
    plain_message = (
        f"Nuevo mensaje de ayuda — nabbi\n"
        f"Ticket: #{ticket_id}\n"
        f"Tema: {theme_label}\n"
        f"Correo de contacto: {reply_email}\n"
        f"Usuario ID: {user_id or 'N/A'}\n"
        f"Usuario email: {user_email or 'N/A'}\n"
        f"Fecha: {context['submitted_at']}\n\n"
        f"Mensaje:\n{message}\n"
    )

    email = EmailMultiAlternatives(
        subject=f"[Nabbi Soporte] {theme_label} — Ticket #{ticket_id}",
        body=plain_message,
        from_email=_from_email_display(),
        to=[inbox],
        reply_to=[reply_email],
    )
    email.attach_alternative(html_message, "text/html")

    if attachment is not None:
        name = getattr(attachment, "name", "screenshot.jpg") or "screenshot.jpg"
        content_type = getattr(attachment, "content_type", None) or "application/octet-stream"
        attachment.open("rb")
        try:
            email.attach(name, attachment.read(), content_type)
        finally:
            try:
                attachment.close()
            except Exception:
                pass

    try:
        email.send(fail_silently=False)
        logger.info("Support feedback email sent ticket=%s to=%s", ticket_id, inbox)
        return True
    except Exception as e:
        logger.error("Failed sending support feedback ticket=%s: %s", ticket_id, e, exc_info=True)
        return False
