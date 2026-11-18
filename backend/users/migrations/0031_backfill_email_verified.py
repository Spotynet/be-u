# Generated manually — backfill existing users as verified

from django.db import migrations
from django.utils import timezone


def forwards(apps, schema_editor):
    User = apps.get_model("users", "User")
    now = timezone.now()
    updated = User.objects.filter(email_verified=False).update(
        email_verified=True,
        email_verified_at=now,
    )
    print(f"Backfilled email_verified=True for {updated} existing users")


def backwards(apps, schema_editor):
    # Irreversible by design (would lock out pre-existing accounts)
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0030_email_verified_and_verification_code"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
