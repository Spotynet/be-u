from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("reservations", "0006_group_sessions"),
        ("users", "0028_allow_blank_description_customservice"),
    ]

    operations = [
        migrations.CreateModel(
            name="TrackingRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("ACCEPTED", "Accepted"),
                            ("REJECTED", "Rejected"),
                            ("STOPPED", "Stopped"),
                            ("EXPIRED", "Expired"),
                        ],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                ("expires_at", models.DateTimeField()),
                ("latest_latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("latest_longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("latest_accuracy_meters", models.FloatField(blank=True, null=True)),
                ("latest_reported_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="received_trackings",
                        to="users.user",
                    ),
                ),
                (
                    "requester",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="requested_trackings",
                        to="users.user",
                    ),
                ),
                (
                    "reservation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tracking_requests",
                        to="reservations.reservation",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="trackingrequest",
            index=models.Index(fields=["status", "expires_at"], name="reservation_status_2288dc_idx"),
        ),
        migrations.AddIndex(
            model_name="trackingrequest",
            index=models.Index(fields=["recipient", "status"], name="reservation_recipie_4e0222_idx"),
        ),
    ]
