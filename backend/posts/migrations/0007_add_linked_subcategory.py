from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0006_post_linked_provider_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="linked_subcategory",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
