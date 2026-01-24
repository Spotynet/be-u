from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0015_email_auth_code"),
    ]

    operations = [
        migrations.CreateModel(
            name="GoogleAuthPendingCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "state",
                    models.CharField(
                        db_index=True,
                        help_text="OAuth state parameter used to link authorization code",
                        max_length=255,
                        unique=True,
                    ),
                ),
                ("code", models.TextField(help_text="Authorization code from Google OAuth")),
                ("redirect_uri", models.URLField(help_text="Redirect URI used in the OAuth flow")),
                ("created_at", models.DateTimeField(auto_now_add=True, help_text="When this code was received")),
            ],
            options={
                "verbose_name": "Pending Google Auth Code",
                "verbose_name_plural": "Pending Google Auth Codes",
            },
        ),
        migrations.AddIndex(
            model_name="googleauthpendingcode",
            index=models.Index(fields=["state"], name="users_googlea_state_6aa9e3_idx"),
        ),
    ]

