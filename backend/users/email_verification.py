"""
Email verification codes for registration (hashed, single-use, TTL + attempt limits).
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from dataclasses import dataclass
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailVerificationCode, User

logger = logging.getLogger(__name__)


class EmailVerificationError(Exception):
    """Base typed error for email verification flows."""

    code: str = "email_verification_error"
    http_status: int = 400

    def __init__(self, message: str = ""):
        self.message = message or self.code
        super().__init__(self.message)


class CooldownActive(EmailVerificationError):
    code = "cooldown_active"
    http_status = 429

    def __init__(self, seconds: int, message: str = ""):
        self.seconds = seconds
        super().__init__(message or f"Espera {seconds}s antes de reenviar.")


class HourlyLimitExceeded(EmailVerificationError):
    code = "hourly_limit"
    http_status = 429

    def __init__(self, seconds: int = 3600, message: str = ""):
        self.seconds = seconds
        super().__init__(message or "Has alcanzado el límite de envíos. Intenta más tarde.")


class CodeExpired(EmailVerificationError):
    code = "code_expired"
    http_status = 400

    def __init__(self, message: str = "El código ha expirado. Solicita uno nuevo."):
        super().__init__(message)


class CodeInvalid(EmailVerificationError):
    code = "invalid_code"
    http_status = 400

    def __init__(self, attempts_left: int, message: str = "Código inválido."):
        self.attempts_left = attempts_left
        super().__init__(message)


class TooManyAttempts(EmailVerificationError):
    code = "too_many_attempts"
    http_status = 429

    def __init__(self, message: str = "Demasiados intentos. Solicita un nuevo código."):
        super().__init__(message)


class NoActiveCode(EmailVerificationError):
    code = "no_active_code"
    http_status = 400

    def __init__(
        self,
        message: str = "No encontramos un código activo. Solicita uno nuevo.",
    ):
        super().__init__(message)


def _code_length() -> int:
    return int(getattr(settings, "EMAIL_VERIFICATION_CODE_LENGTH", 6))


def _ttl_minutes() -> int:
    return int(getattr(settings, "EMAIL_VERIFICATION_TTL_MINUTES", 10))


def _max_attempts() -> int:
    return int(getattr(settings, "EMAIL_VERIFICATION_MAX_ATTEMPTS", 5))


def _resend_cooldown_seconds() -> int:
    return int(getattr(settings, "EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS", 30))


def _max_sends_per_hour() -> int:
    return int(getattr(settings, "EMAIL_VERIFICATION_MAX_SENDS_PER_HOUR", 5))


def generate_code() -> str:
    """Return a zero-padded numeric code of configured length."""
    length = _code_length()
    upper = 10**length
    return f"{secrets.randbelow(upper):0{length}d}"


def hash_code(email: str, code: str) -> str:
    """HMAC-SHA256 of email:code with SECRET_KEY (never store plaintext)."""
    msg = f"{email.lower().strip()}:{code}".encode("utf-8")
    key = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def check_code(email: str, code: str, code_hash: str) -> bool:
    provided = hash_code(email, code)
    return hmac.compare_digest(provided, code_hash)


@dataclass
class IssuedCode:
    record: EmailVerificationCode
    resend_available_in: int


def _cooldown_remaining(last_sent_at) -> int:
    if not last_sent_at:
        return 0
    elapsed = (timezone.now() - last_sent_at).total_seconds()
    remaining = int(_resend_cooldown_seconds() - elapsed)
    return max(0, remaining)


def issue_code(
    user: User,
    email: str,
    purpose: str = EmailVerificationCode.Purpose.REGISTER,
) -> IssuedCode:
    """
    Invalidate prior unconsumed codes for user+email+purpose, create a new hashed code,
    and send the email after transaction commit.
    """
    email_norm = email.strip().lower()
    now = timezone.now()

    latest = (
        EmailVerificationCode.objects.filter(
            user=user,
            email=email_norm,
            purpose=purpose,
        )
        .order_by("-last_sent_at")
        .first()
    )
    if latest:
        wait = _cooldown_remaining(latest.last_sent_at)
        if wait > 0:
            raise CooldownActive(wait)

    hour_ago = now - timezone.timedelta(hours=1)
    sends_last_hour = EmailVerificationCode.objects.filter(
        user=user,
        email=email_norm,
        purpose=purpose,
        last_sent_at__gte=hour_ago,
    ).count()
    if sends_last_hour >= _max_sends_per_hour():
        raise HourlyLimitExceeded()

    plain = generate_code()
    code_hash = hash_code(email_norm, plain)
    expires_at = now + timezone.timedelta(minutes=_ttl_minutes())

    with transaction.atomic():
        EmailVerificationCode.objects.filter(
            user=user,
            email=email_norm,
            purpose=purpose,
            consumed_at__isnull=True,
        ).update(consumed_at=now)

        record = EmailVerificationCode.objects.create(
            user=user,
            email=email_norm,
            code_hash=code_hash,
            purpose=purpose,
            expires_at=expires_at,
            last_sent_at=now,
        )

    # Capture locals for on_commit (do not log the plain code with email in prod paths)
    first_name = user.first_name or ""

    def _send():
        try:
            send_verification_email(user=user, email=email_norm, code=plain, first_name=first_name)
        except Exception:
            logger.exception("Failed to send verification email (user_id=%s)", user.pk)

    # Locmem/console: send immediately (TestCase wraps DB in a transaction so on_commit
    # would not run until the test ends). SMTP: send after commit.
    backend = getattr(settings, "EMAIL_BACKEND", "") or ""
    if backend.endswith("locmem.EmailBackend") or backend.endswith("console.EmailBackend"):
        _send()
    else:
        transaction.on_commit(_send)

    return IssuedCode(record=record, resend_available_in=_resend_cooldown_seconds())


def verify_code(
    user: User,
    email: str,
    code: str,
    purpose: str = EmailVerificationCode.Purpose.REGISTER,
) -> User:
    """
    Verify the latest unconsumed unexpired code; mark user.email_verified on success.
    """
    email_norm = email.strip().lower()
    code = (code or "").strip()
    now = timezone.now()

    pending_error: Optional[EmailVerificationError] = None

    with transaction.atomic():
        record = (
            EmailVerificationCode.objects.select_for_update()
            .filter(
                user=user,
                email=email_norm,
                purpose=purpose,
                consumed_at__isnull=True,
            )
            .order_by("-created_at")
            .first()
        )
        if not record:
            pending_error = NoActiveCode()
        elif record.expires_at <= now:
            record.consumed_at = now
            record.save(update_fields=["consumed_at"])
            pending_error = CodeExpired()
        elif record.attempts >= _max_attempts():
            record.consumed_at = now
            record.save(update_fields=["consumed_at"])
            pending_error = TooManyAttempts()
        elif not check_code(email_norm, code, record.code_hash):
            record.attempts = record.attempts + 1
            update_fields = ["attempts"]
            if record.attempts >= _max_attempts():
                record.consumed_at = now
                update_fields.append("consumed_at")
                record.save(update_fields=update_fields)
                pending_error = TooManyAttempts()
            else:
                record.save(update_fields=update_fields)
                pending_error = CodeInvalid(
                    attempts_left=_max_attempts() - record.attempts
                )
        else:
            record.consumed_at = now
            record.save(update_fields=["consumed_at"])
            user.email_verified = True
            user.email_verified_at = now
            user.save(update_fields=["email_verified", "email_verified_at"])

    if pending_error:
        raise pending_error
    return user


def send_verification_email(
    user: User,
    email: str,
    code: str,
    first_name: Optional[str] = None,
) -> None:
    """Send Spanish verification email (text + HTML)."""
    ttl = _ttl_minutes()
    context = {
        "first_name": (first_name or user.first_name or "").strip(),
        "code": code,
        "ttl_minutes": ttl,
        "year": timezone.now().year,
    }
    subject = "Tu código de verificación de nabbi"
    text_body = render_to_string("emails/verify_email.txt", context)
    html_body = render_to_string("emails/verify_email.html", context)

    default_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@nabbi.app")
    if "<" in str(default_email) and ">" in str(default_email):
        email_addr = str(default_email)[
            str(default_email).index("<") + 1 : str(default_email).index(">")
        ]
    else:
        email_addr = str(default_email)
    from_email = f"nabbi <{email_addr}>"

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=[email],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


def mark_user_email_verified(user: User) -> None:
    """Set email_verified if not already (e.g. after passwordless login)."""
    if user.email_verified:
        return
    now = timezone.now()
    user.email_verified = True
    user.email_verified_at = now
    user.save(update_fields=["email_verified", "email_verified_at"])


def backfill_existing_users_verified(apps, schema_editor):
    """Data migration helper: mark all existing users as verified."""
    UserModel = apps.get_model("users", "User")
    now = timezone.now()
    updated = UserModel.objects.filter(email_verified=False).update(
        email_verified=True,
        email_verified_at=now,
    )
    logger.info("Backfilled email_verified=True for %s existing users", updated)
    return updated
