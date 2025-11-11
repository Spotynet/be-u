from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_add_category_to_profiles'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlaceProfessionalLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('INVITED', 'Invited'), ('ACCEPTED', 'Accepted'), ('REJECTED', 'Rejected'), ('REMOVED', 'Removed')], default='INVITED', max_length=10)),
                ('notes', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('invited_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='LinkedAvailabilitySchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day_of_week', models.IntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('is_available', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['day_of_week'],
            },
        ),
        migrations.CreateModel(
            name='LinkedTimeSlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('schedule', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='time_slots', to='users.linkedavailabilityschedule')),
            ],
            options={
                'ordering': ['start_time'],
            },
        ),
        migrations.AddField(
            model_name='linkedavailabilityschedule',
            name='link',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='schedules', to='users.placeprofessionallink'),
        ),
        migrations.AddField(
            model_name='placeprofessionallink',
            name='place',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='links', to='users.placeprofile'),
        ),
        migrations.AddField(
            model_name='placeprofessionallink',
            name='professional',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='place_links', to='users.professionalprofile'),
        ),
        migrations.AlterUniqueTogether(
            name='placeprofessionallink',
            unique_together={('place', 'professional')},
        ),
        migrations.AlterUniqueTogether(
            name='linkedavailabilityschedule',
            unique_together={('link', 'day_of_week')},
        ),
    ]


