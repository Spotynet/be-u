from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("services", "0004_add_unified_service_model"),
        ("reservations", "0005_merge_20260126_2302"),
    ]

    operations = [
        migrations.CreateModel(
            name="GroupSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("provider_object_id", models.PositiveIntegerField()),
                ("service_instance_id", models.PositiveIntegerField(blank=True, null=True)),
                ("date", models.DateField()),
                ("time", models.TimeField()),
                ("duration", models.DurationField(help_text="Duration of the group session")),
                ("capacity", models.PositiveIntegerField(default=1)),
                ("booked_slots", models.PositiveIntegerField(default=0)),
                (
                    "status",
                    models.CharField(
                        choices=[("ACTIVE", "Active"), ("CANCELLED", "Cancelled"), ("COMPLETED", "Completed")],
                        default="ACTIVE",
                        max_length=20,
                    ),
                ),
                ("notes", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "provider_content_type",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="contenttypes.contenttype"),
                ),
                (
                    "service",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="group_sessions",
                        to="services.servicestype",
                    ),
                ),
                (
                    "service_instance_type",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="group_session_services",
                        to="contenttypes.contenttype",
                    ),
                ),
            ],
            options={"ordering": ["date", "time"]},
        ),
        migrations.AddIndex(
            model_name="groupsession",
            index=models.Index(fields=["date", "status"], name="reservation_date_0ef64a_idx"),
        ),
        migrations.AddIndex(
            model_name="groupsession",
            index=models.Index(
                fields=["provider_content_type", "provider_object_id"],
                name="reservation_provide_dcf00f_idx",
            ),
        ),
        migrations.AddField(
            model_name="reservation",
            name="group_session",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reservations",
                to="reservations.groupsession",
            ),
        ),
    ]
