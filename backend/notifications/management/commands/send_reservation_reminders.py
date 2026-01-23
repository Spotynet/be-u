import logging
from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.models import ReservationReminder, Notification, PushDeviceToken
from notifications.push import send_push_notifications

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send scheduled reservation reminder push notifications"

    def handle(self, *args, **options):
        now = timezone.now()
        reminders = ReservationReminder.objects.select_related("reservation", "user").filter(
            status=ReservationReminder.Status.PENDING,
            send_at__lte=now,
        )

        if not reminders.exists():
            self.stdout.write("No reminders to send.")
            return

        for reminder in reminders:
            reservation = reminder.reservation
            user = reminder.user

            try:
                title = "Recordatorio de cita"
                time_str = reservation.time.strftime("%H:%M")
                date_str = reservation.date.strftime("%d/%m/%Y")
                message = f"Tu cita es el {date_str} a las {time_str}."

                metadata = {
                    "reservation_id": reservation.id,
                    "reservation_code": reservation.code,
                    "reminder_type": reminder.reminder_type,
                    "date": str(reservation.date),
                    "time": str(reservation.time),
                }

                tokens = PushDeviceToken.objects.filter(user=user, is_active=True)
                send_ok = send_push_notifications(list(tokens), title, message, metadata)

                Notification.objects.create(
                    user=user,
                    type=Notification.NotificationType.RESERVATION,
                    title=title,
                    message=message,
                    metadata=metadata,
                )

                reminder.status = ReservationReminder.Status.SENT if send_ok else ReservationReminder.Status.FAILED
                reminder.last_error = None if send_ok else "Push send failed"
                reminder.save(update_fields=["status", "last_error", "updated_at"])
            except Exception as exc:
                reminder.status = ReservationReminder.Status.FAILED
                reminder.last_error = str(exc)
                reminder.save(update_fields=["status", "last_error", "updated_at"])
                logger.error(f"Failed sending reminder {reminder.id}: {exc}", exc_info=True)
                continue
