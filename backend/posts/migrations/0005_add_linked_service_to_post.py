# Migration adds linked service fields to Post. Idempotent: safe if columns already exist (e.g. after partial apply).

from django.db import migrations


def add_linked_service_columns_if_not_exists(apps, schema_editor):
    """Add columns only if they don't exist (PostgreSQL). Safe for re-run on server."""
    from django.db import connection
    columns = [
        ("linked_service_id", "integer NULL"),
        ("linked_service_type", "varchar(32) NULL"),
        ("linked_provider_id", "integer NULL"),
        ("linked_service_name", "varchar(200) NULL"),
        ("linked_service_price", "decimal(10,2) NULL"),
        ("linked_service_duration_minutes", "integer NULL"),
    ]
    with connection.cursor() as cursor:
        for name, col_type in columns:
            cursor.execute(
                "ALTER TABLE posts_post ADD COLUMN IF NOT EXISTS %s %s"
                % (name, col_type)
            )


def noop_reverse(apps, schema_editor):
    """Reverse not implemented; drop columns manually if needed."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0004_alter_post_post_type'),
    ]

    operations = [
        migrations.RunPython(add_linked_service_columns_if_not_exists, noop_reverse),
    ]
