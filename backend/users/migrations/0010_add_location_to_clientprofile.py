from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0009_add_coords_to_publicprofile"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="latitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="longitude",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
    ]
