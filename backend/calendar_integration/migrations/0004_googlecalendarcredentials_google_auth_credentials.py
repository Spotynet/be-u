from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0014_google_auth_credentials'),
        ('calendar_integration', '0003_googleoauthpendingcode'),
    ]

    operations = [
        migrations.AddField(
            model_name='googlecalendarcredentials',
            name='google_auth_credentials',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='calendar_credentials', to='users.googleauthcredentials'),
        ),
    ]
