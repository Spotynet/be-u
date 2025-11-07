from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reviews", "0003_add_unified_review_model"),
    ]

    operations = [
        migrations.AlterField(
            model_name="review",
            name="rating",
            field=models.PositiveSmallIntegerField(
                help_text="Rating from 1-5 stars",
                validators=[MinValueValidator(1), MaxValueValidator(5)],
            ),
        ),
        migrations.RemoveField(
            model_name="review",
            name="images",
        ),
        migrations.AlterUniqueTogether(
            name="review",
            unique_together=set(),
        ),
        migrations.CreateModel(
            name="ReviewImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="reviews/photos/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("review", models.ForeignKey(on_delete=models.CASCADE, related_name="images", to="reviews.review")),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
    ]

