from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_add_break_time_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='GoogleAuthCredentials',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('google_id', models.CharField(max_length=255, unique=True)),
                ('email_verified', models.BooleanField(default=False)),
                ('picture_url', models.URLField(blank=True, null=True)),
                ('_access_token', models.TextField(db_column='access_token')),
                ('_refresh_token', models.TextField(db_column='refresh_token')),
                ('token_expiry', models.DateTimeField(help_text='When the access token expires')),
                ('is_active', models.BooleanField(default=True, help_text='Whether the Google auth connection is active')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='google_auth_credentials', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Google Auth Credentials',
                'verbose_name_plural': 'Google Auth Credentials',
            },
        ),
    ]
