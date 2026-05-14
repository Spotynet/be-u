from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Q, Count
from decimal import Decimal

from .models import Sale, SaleItem
from .serializers import SaleSerializer, SaleListSerializer, SaleStatsSerializer


class SaleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "total", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Sale.objects.filter(seller=self.request.user).prefetch_related("items")

        # Filter by status
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        # Filter by currency
        currency = self.request.query_params.get("currency")
        if currency:
            qs = qs.filter(currency=currency)

        # Filter by date range
        date_from = self.request.query_params.get("date_from")
        date_to   = self.request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # Search by client name / sale number
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(client_name__icontains=search) |
                Q(sale_number__icontains=search) |
                Q(client_email__icontains=search)
            )

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return SaleListSerializer
        return SaleSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        sale = self.get_object()
        amount_paid    = Decimal(str(request.data.get("amount_paid", sale.total)))
        payment_method = request.data.get("payment_method", sale.payment_method or "CASH")
        change_given   = max(amount_paid - sale.total, Decimal("0"))

        sale.status         = "PAID"
        sale.payment_method = payment_method
        sale.amount_paid    = amount_paid
        sale.change_given   = change_given
        sale.paid_at        = timezone.now()
        sale.save()
        return Response(SaleSerializer(sale).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        sale = self.get_object()
        sale.status = "CANCELLED"
        sale.save()
        return Response(SaleSerializer(sale).data)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        qs = Sale.objects.filter(seller=request.user)

        today = timezone.localdate()
        today_qs = qs.filter(created_at__date=today)

        paid_qs    = qs.filter(status="PAID")
        pending_qs = qs.filter(status__in=["DRAFT", "PARTIALLY_PAID"])

        by_currency = {}
        for c in ["MXN", "USD", "COP", "EUR"]:
            agg = paid_qs.filter(currency=c).aggregate(total=Sum("total"))
            val = agg["total"] or Decimal("0")
            if val > 0:
                by_currency[c] = str(val)

        by_status = {}
        for s_val, s_label in Sale._meta.get_field("status").choices:
            cnt = qs.filter(status=s_val).count()
            if cnt > 0:
                by_status[s_val] = cnt

        data = {
            "total_sales":     qs.count(),
            "total_revenue":   qs.aggregate(t=Sum("total"))["t"] or Decimal("0"),
            "paid_revenue":    paid_qs.aggregate(t=Sum("total"))["t"] or Decimal("0"),
            "pending_revenue": pending_qs.aggregate(t=Sum("total"))["t"] or Decimal("0"),
            "today_revenue":   today_qs.filter(status="PAID").aggregate(t=Sum("total"))["t"] or Decimal("0"),
            "by_currency":     by_currency,
            "by_status":       by_status,
        }
        return Response(data)
