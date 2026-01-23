from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_alter_notification_type_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('reservations', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PushDeviceToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=255, unique=True)),
                ('platform', models.CharField(choices=[('ios', 'iOS'), ('android', 'Android'), ('web', 'Web'), ('unknown', 'Unknown')], default='unknown', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('last_seen_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='push_tokens', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'indexes': [models.Index(fields=['user', 'is_active'], name='notificatio_user_id_2f85f2_idx'), models.Index(fields=['token'], name='notificatio_token_f7b1b9_idx')],
            },
        ),
        migrations.CreateModel(
            name='ReservationReminder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reminder_type', models.CharField(choices=[('24h', '24 horas'), ('12h', '12 horas'), ('4h', '4 horas'), ('30m', '30 minutos')], max_length=5)),
                ('send_at', models.DateTimeField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('sent', 'Sent'), ('failed', 'Failed'), ('cancelled', 'Cancelled')], default='pending', max_length=12)),
                ('last_error', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('reservation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reminders', to='reservations.reservation')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reservation_reminders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'indexes': [models.Index(fields=['send_at', 'status'], name='notificatio_send_at_85c3c1_idx'), models.Index(fields=['reservation', 'user'], name='notificatio_reserva_b4a5c0_idx')],
                'unique_together': {('reservation', 'user', 'reminder_type')},
            },
        ),
    ]
