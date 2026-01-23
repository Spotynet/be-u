from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0014_google_auth_credentials"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailAuthCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(db_index=True, max_length=254)),
                ("code_hash", models.CharField(max_length=128)),
                ("expires_at", models.DateTimeField()),
                ("consumed_at", models.DateTimeField(blank=True, null=True)),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["email", "expires_at"], name="users_email_expires_idx"),
                    models.Index(fields=["email", "consumed_at"], name="users_email_consumed_idx"),
                ],
            },
        ),
    ]

