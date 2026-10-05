from django.urls import path

from . import views

urlpatterns = [
    path("reports/", views.create_report, name="moderation-report"),
    path("blocks/", views.create_block, name="moderation-block"),
    path("blocks/<int:user_id>/", views.delete_block, name="moderation-unblock"),
]
