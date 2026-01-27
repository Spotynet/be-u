from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reservations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservation",
            name="service_latitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="reservation",
            name="service_longitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="reservation",
            name="service_address",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
