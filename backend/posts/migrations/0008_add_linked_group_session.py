# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0007_add_linked_subcategory"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="linked_group_session_id",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
