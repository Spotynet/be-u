from django.db import models
from django.conf import settings
from django.utils import timezone
from services.models import Service
from reservations.models import Reservation
import uuid


CURRENCY_CHOICES = [
    ("MXN", "Peso Mexicano"),
    ("USD", "Dólar Estadounidense"),
    ("COP", "Peso Colombiano"),
    ("EUR", "Euro"),
]

PAYMENT_METHOD_CHOICES = [
    ("CASH",     "Efectivo"),
    ("CARD",     "Tarjeta"),
    ("TRANSFER", "Transferencia"),
    ("OTHER",    "Otro"),
]

STATUS_CHOICES = [
    ("DRAFT",           "Borrador"),
    ("PAID",            "Pagado"),
    ("PARTIALLY_PAID",  "Pago parcial"),
    ("CANCELLED",       "Cancelado"),
    ("REFUNDED",        "Reembolsado"),
]

ITEM_TYPE_CHOICES = [
    ("SERVICE", "Servicio"),
    ("PRODUCT", "Producto"),
]


def generate_sale_number():
    """Auto-increment sale number like VTA-00001."""
    last = Sale.objects.order_by("-id").first()
    next_id = (last.id + 1) if last else 1
    return f"VTA-{next_id:05d}"


class Sale(models.Model):
    # Who is selling
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sales",
        help_text="Professional or Place user who made the sale",
    )

    # Sale number (human-readable)
    sale_number = models.CharField(max_length=20, unique=True, blank=True)

    # Linked reservation (optional)
    reservation = models.OneToOneField(
        Reservation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sale",
    )

    # Client info (denormalized so it's kept even if client account changes)
    client_name  = models.CharField(max_length=200, blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)
    client_phone = models.CharField(max_length=30, blank=True, null=True)

    # Currency & amounts
    currency      = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="MXN")
    subtotal      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax           = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total         = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Payment
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    amount_paid    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    change_given   = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    notes    = models.TextField(blank=True, null=True)
    paid_at  = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"

    def __str__(self):
        return f"{self.sale_number} – {self.client_name or 'Sin cliente'} ({self.total} {self.currency})"

    def save(self, *args, **kwargs):
        if not self.sale_number:
            self.sale_number = generate_sale_number()
        self.recalculate_totals()
        if self.status == "PAID" and not self.paid_at:
            self.paid_at = timezone.now()
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        items_total = sum(item.total for item in self.items.all())
        self.subtotal = items_total
        self.total = max(items_total - self.discount + self.tax, 0)


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")

    item_type   = models.CharField(max_length=10, choices=ITEM_TYPE_CHOICES, default="SERVICE")
    service_ref = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sale_items",
    )

    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    quantity    = models.PositiveIntegerField(default=1)
    unit_price  = models.DecimalField(max_digits=10, decimal_places=2)
    discount    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total       = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Ítem de venta"
        verbose_name_plural = "Ítems de venta"

    def __str__(self):
        return f"{self.name} x{self.quantity} = {self.total}"

    def save(self, *args, **kwargs):
        self.total = max((self.unit_price * self.quantity) - self.discount, 0)
        super().save(*args, **kwargs)
