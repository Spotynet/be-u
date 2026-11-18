"""
Delete expired/consumed email auth & verification codes older than N days.

Suggested cron (daily):
  15 3 * * * cd /path/to/backend && python manage.py purge_email_codes
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from users.models import EmailAuthCode, EmailVerificationCode


class Command(BaseCommand):
    help = "Purge expired/consumed email codes older than --days (default 7)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Delete codes with expires_at or consumed_at older than this many days.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only report counts; do not delete.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        dry_run = options["dry_run"]
        cutoff = timezone.now() - timedelta(days=days)
        filt = Q(expires_at__lt=cutoff) | Q(consumed_at__lt=cutoff)

        verify_qs = EmailVerificationCode.objects.filter(filt)
        auth_qs = EmailAuthCode.objects.filter(filt)
        v_count = verify_qs.count()
        a_count = auth_qs.count()

        if dry_run:
            self.stdout.write(
                f"Would delete {v_count} EmailVerificationCode and {a_count} EmailAuthCode "
                f"(cutoff={cutoff.isoformat()})"
            )
            return

        deleted_v, _ = verify_qs.delete()
        deleted_a, _ = auth_qs.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted verification={deleted_v}, login_auth={deleted_a}"
            )
        )
