# Generated manually for calendar system
#
# NOTE: This migration was originally intended to add calendar models, but services.0001_initial
# already creates ServiceInPlace (with professional, timestamps), ProfessionalService,
# ProviderAvailability, TimeSlotBlock, and unique_together. Running AddField/CreateModel here
# fails on fresh DBs with duplicate column / relation errors.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0002_initial"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("users", "0001_initial"),
    ]

    operations = []
