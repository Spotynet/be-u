# Generated migration for calendar_integration app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('reservations', '0004_add_missing_columns'),
    ]

    operations = [
        migrations.CreateModel(
            name='GoogleCalendarCredentials',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('_access_token', models.TextField(db_column='access_token')),
                ('_refresh_token', models.TextField(db_column='refresh_token')),
                ('token_expiry', models.DateTimeField(help_text='When the access token expires')),
                ('calendar_id', models.CharField(default='primary', help_text='Google Calendar ID to use (default: primary)', max_length=255)),
                ('is_active', models.BooleanField(default=True, help_text='Whether the calendar connection is active')),
                ('last_sync_at', models.DateTimeField(blank=True, help_text='Last time availability was synced from Google Calendar', null=True)),
                ('sync_error', models.TextField(blank=True, help_text='Last sync error message, if any', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='google_calendar_credentials', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Google Calendar Credentials',
                'verbose_name_plural': 'Google Calendar Credentials',
            },
        ),
        migrations.CreateModel(
            name='CalendarEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('google_event_id', models.CharField(help_text='Google Calendar event ID', max_length=255)),
                ('calendar_id', models.CharField(default='primary', help_text='Google Calendar ID where event was created', max_length=255)),
                ('event_link', models.URLField(blank=True, help_text='Link to view the event in Google Calendar', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('calendar_owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calendar_events', to=settings.AUTH_USER_MODEL)),
                ('reservation', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='calendar_event', to='reservations.reservation')),
            ],
            options={
                'verbose_name': 'Calendar Event',
                'verbose_name_plural': 'Calendar Events',
            },
        ),
        migrations.AddIndex(
            model_name='calendarevent',
            index=models.Index(fields=['google_event_id'], name='calendar_in_google__e2d7e5_idx'),
        ),
        migrations.AddIndex(
            model_name='calendarevent',
            index=models.Index(fields=['calendar_owner'], name='calendar_in_calenda_7c8a68_idx'),
        ),
    ]













