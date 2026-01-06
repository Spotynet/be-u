# Generated manually for BreakTime model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_change_category_to_jsonfield'),
    ]

    operations = [
        migrations.CreateModel(
            name='BreakTime',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('label', models.CharField(blank=True, help_text="Optional label (e.g., 'Almuerzo', 'Descanso')", max_length=100, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('schedule', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='breaks', to='users.availabilityschedule')),
            ],
            options={
                'ordering': ['start_time'],
            },
        ),
    ]






