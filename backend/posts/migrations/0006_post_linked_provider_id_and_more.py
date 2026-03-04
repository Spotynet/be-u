# Idempotent: safe if columns were already added by 0005 (raw SQL) or manually.

from django.db import migrations, models


def add_columns_if_not_exists(apps, schema_editor):
    """Add columns only if they don't exist (PostgreSQL)."""
    from django.db import connection
    columns = [
        ("linked_provider_id", "integer NULL"),
        ("linked_service_duration_minutes", "integer NULL"),
        ("linked_service_id", "integer NULL"),
        ("linked_service_name", "varchar(200) NULL"),
        ("linked_service_price", "decimal(10,2) NULL"),
        ("linked_service_type", "varchar(32) NULL"),
    ]
    with connection.cursor() as cursor:
        for name, col_type in columns:
            cursor.execute(
                "ALTER TABLE posts_post ADD COLUMN IF NOT EXISTS %s %s"
                % (name, col_type),
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0005_add_linked_service_to_post"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="post",
                    name="linked_provider_id",
                    field=models.PositiveIntegerField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name="post",
                    name="linked_service_duration_minutes",
                    field=models.PositiveIntegerField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name="post",
                    name="linked_service_id",
                    field=models.PositiveIntegerField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name="post",
                    name="linked_service_name",
                    field=models.CharField(blank=True, max_length=200, null=True),
                ),
                migrations.AddField(
                    model_name="post",
                    name="linked_service_price",
                    field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
                ),
                migrations.AddField(
                    model_name="post",
                    name="linked_service_type",
                    field=models.CharField(blank=True, max_length=32, null=True),
                ),
            ],
            database_operations=[
                migrations.RunPython(add_columns_if_not_exists, noop_reverse),
            ],
        ),
    ]
