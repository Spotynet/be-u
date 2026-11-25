from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from users.email_verification import backfill_existing_users_verified, generate_code, hash_code
from users.models import EmailAuthCode, EmailVerificationCode, User


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=30,
    EMAIL_VERIFICATION_MAX_ATTEMPTS=5,
    EMAIL_VERIFICATION_TTL_MINUTES=10,
    EMAIL_VERIFICATION_MAX_SENDS_PER_HOUR=5,
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ],
        "DEFAULT_PERMISSION_CLASSES": [
            "rest_framework.permissions.IsAuthenticated",
        ],
        "DEFAULT_THROTTLE_CLASSES": [],
        "DEFAULT_THROTTLE_RATES": {},
    },
)
class EmailVerificationAPITests(APITestCase):
    def setUp(self):
        mail.outbox.clear()

    def _register(self, email="nuevo@example.com", username="nuevo"):
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(
                "/api/auth/register/",
                {
                    "email": email,
                    "username": username,
                    "firstName": "Ana",
                    "lastName": "García",
                    "role": "client",
                },
                format="json",
            )

    def _code_from_outbox(self):
        self.assertTrue(mail.outbox, "expected a verification email")
        body = mail.outbox[-1].body
        # Extract 6 consecutive digits from the text body
        import re

        match = re.search(r"\b(\d{6})\b", body)
        self.assertIsNotNone(match, f"no 6-digit code in email body: {body!r}")
        return match.group(1)

    def test_register_creates_unverified_user_and_sends_one_email(self):
        res = self._register()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["verificationRequired"])
        self.assertFalse(res.data["emailVerified"])
        self.assertTrue(res.data.get("emailSent"))
        self.assertNotIn("access", res.data)
        self.assertNotIn("refresh", res.data)
        user = User.objects.get(email="nuevo@example.com")
        self.assertFalse(user.email_verified)
        self.assertEqual(len(mail.outbox), 1)
        code = self._code_from_outbox()
        self.assertEqual(len(code), 6)

    def test_register_rejects_invalid_email(self):
        res = self.client.post(
            "/api/auth/register/",
            {
                "email": "not-an-email",
                "username": "badmail",
                "firstName": "Bad",
                "role": "client",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="badmail").exists())
        self.assertEqual(len(mail.outbox), 0)

    def test_verify_success_sets_verified_and_returns_tokens(self):
        self._register()
        code = self._code_from_outbox()
        res = self.client.post(
            "/api/auth/verify-email/",
            {"email": "nuevo@example.com", "code": code},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertTrue(res.data["user"]["emailVerified"])
        user = User.objects.get(email="nuevo@example.com")
        self.assertTrue(user.email_verified)
        self.assertIsNotNone(user.email_verified_at)
        self.assertFalse(
            EmailVerificationCode.objects.filter(
                user=user, consumed_at__isnull=True
            ).exists()
        )

    def test_wrong_code_increments_attempts_and_returns_attempts_left(self):
        self._register()
        res = self.client.post(
            "/api/auth/verify-email/",
            {"email": "nuevo@example.com", "code": "000000"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["code"], "invalid_code")
        self.assertEqual(res.data["attemptsLeft"], 4)
        record = EmailVerificationCode.objects.get(email="nuevo@example.com", consumed_at__isnull=True)
        self.assertEqual(record.attempts, 1)

    def test_fifth_wrong_attempt_locks_code(self):
        self._register()
        for i in range(5):
            res = self.client.post(
                "/api/auth/verify-email/",
                {"email": "nuevo@example.com", "code": "000000"},
                format="json",
            )
            if i < 4:
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(res.data["code"], "invalid_code")
            else:
                self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
                self.assertEqual(res.data["code"], "too_many_attempts")
        self.assertFalse(
            EmailVerificationCode.objects.filter(
                email="nuevo@example.com", consumed_at__isnull=True
            ).exists()
        )

    def test_expired_code_rejected(self):
        self._register()
        record = EmailVerificationCode.objects.get(email="nuevo@example.com")
        record.expires_at = timezone.now() - timedelta(minutes=1)
        record.save(update_fields=["expires_at"])
        code = self._code_from_outbox()
        res = self.client.post(
            "/api/auth/verify-email/",
            {"email": "nuevo@example.com", "code": code},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["code"], "code_expired")

    def test_resend_respects_cooldown_and_invalidates_previous(self):
        self._register()
        old = EmailVerificationCode.objects.get(email="nuevo@example.com", consumed_at__isnull=True)
        old_id = old.id
        res = self.client.post(
            "/api/auth/resend-verification/",
            {"email": "nuevo@example.com"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(res.data["code"], "cooldown_active")
        self.assertIn("retryAfter", res.data)

        # Force cooldown elapsed
        EmailVerificationCode.objects.filter(id=old_id).update(
            last_sent_at=timezone.now() - timedelta(seconds=31)
        )
        with self.captureOnCommitCallbacks(execute=True):
            res2 = self.client.post(
                "/api/auth/resend-verification/",
                {"email": "nuevo@example.com"},
                format="json",
            )
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data["sent"])
        old.refresh_from_db()
        self.assertIsNotNone(old.consumed_at)
        self.assertEqual(len(mail.outbox), 2)

    def test_resend_generic_for_unknown_email(self):
        res = self.client.post(
            "/api/auth/resend-verification/",
            {"email": "nobody@example.com"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["sent"])
        self.assertEqual(len(mail.outbox), 0)

    def test_verified_user_cannot_reregister(self):
        self._register()
        code = self._code_from_outbox()
        self.client.post(
            "/api/auth/verify-email/",
            {"email": "nuevo@example.com", "code": code},
            format="json",
        )
        res = self._register(email="nuevo@example.com", username="otro")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_passwordless_login_marks_verified(self):
        user = User.objects.create_user(
            email="login@example.com",
            username="loginuser",
            password="unused",
            email_verified=False,
        )
        user.set_unusable_password()
        user.save()
        # Issue login code via existing endpoint
        self.client.post(
            "/api/auth/email/request-code/",
            {"email": "login@example.com"},
            format="json",
        )
        # Read code from EmailAuthCode by forging with hash — use print path:
        # Instead, create a known code
        plain = "654321"
        EmailAuthCode.objects.filter(email="login@example.com").update(consumed_at=timezone.now())
        EmailAuthCode.objects.create(
            email="login@example.com",
            code_hash=hash_code("login@example.com", plain),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        res = self.client.post(
            "/api/auth/email/verify-code/",
            {"email": "login@example.com", "code": plain},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)

    def test_email_verified_readonly_on_profile(self):
        user = User.objects.create_user(
            email="ro@example.com",
            username="rouser",
            password="Pass1234!",
            email_verified=True,
            email_verified_at=timezone.now(),
        )
        self.client.force_authenticate(user=user)
        res = self.client.put(
            "/api/auth/profile/",
            {"firstName": "Ro", "emailVerified": False},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)

    def test_password_login_blocks_unverified(self):
        User.objects.create_user(
            email="pwd@example.com",
            username="pwduser",
            password="Pass1234!",
            email_verified=False,
        )
        res = self.client.post(
            "/api/auth/login/",
            {"email": "pwd@example.com", "password": "Pass1234!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data["code"], "email_not_verified")

    def test_backfill_helper(self):
        User.objects.create_user(
            email="bf@example.com",
            username="bfuser",
            password="Pass1234!",
            email_verified=False,
        )
        # Simulate migration apps.get_model by using real model via RunPython helper
        class FakeApps:
            @staticmethod
            def get_model(app, model):
                from django.apps import apps
                return apps.get_model(app, model)

        updated = backfill_existing_users_verified(FakeApps(), None)
        self.assertGreaterEqual(updated, 1)
        self.assertTrue(User.objects.get(email="bf@example.com").email_verified)

    def test_generate_code_length(self):
        code = generate_code()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())
