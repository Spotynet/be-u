# Generated manually for calendar system
#
# This migration adds the new calendar-related models without touching existing tables

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0002_initial'),
        ('contenttypes', '0002_remove_content_type_name'),
        ('users', '0001_initial'),
    ]

    operations = [
        # Add new fields to ServiceInPlace
        migrations.AddField(
            model_name='serviceinplace',
            name='professional',
            field=models.ForeignKey(
                blank=True,
                help_text='Professional assigned to this service at the place',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_services',
                to='users.professionalprofile'
            ),
        ),
        migrations.AddField(
            model_name='serviceinplace',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='serviceinplace',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Create ProfessionalService model
        migrations.CreateModel(
            name='ProfessionalService',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField(blank=True, null=True)),
                ('time', models.DurationField(help_text='Duración del servicio (hh:mm:ss)')),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('professional', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='independent_services', to='users.professionalprofile')),
                ('service', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='professionals_offering', to='services.servicestype')),
            ],
            options={
                'unique_together': {('professional', 'service')},
            },
        ),
        
        # Create ProviderAvailability model
        migrations.CreateModel(
            name='ProviderAvailability',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('object_id', models.PositiveIntegerField()),
                ('day_of_week', models.IntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
            ],
            options={
                'ordering': ['day_of_week', 'start_time'],
                'unique_together': {('content_type', 'object_id', 'day_of_week')},
            },
        ),
        
        # Create TimeSlotBlock model
        migrations.CreateModel(
            name='TimeSlotBlock',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('object_id', models.PositiveIntegerField()),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('reason', models.CharField(choices=[('VACATION', 'Vacation'), ('BREAK', 'Break'), ('BOOKED', 'Booked'), ('PERSONAL', 'Personal'), ('OTHER', 'Other')], default='BOOKED', max_length=20)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
            ],
            options={
                'ordering': ['date', 'start_time'],
            },
        ),
        
        # Add unique_together constraint to ServiceInPlace
        migrations.AlterUniqueTogether(
            name='serviceinplace',
            unique_together={('place', 'service')},
        ),
    ]






































