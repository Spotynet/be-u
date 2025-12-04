from django.urls import path
from .views import (
    CalendarAuthUrlView,
    calendar_callback,
    CalendarDisconnectView,
    CalendarStatusView,
    CalendarBusyTimesView,
    CalendarEventsView,
    CalendarSyncView,
    provider_busy_times,
)

app_name = 'calendar_integration'

urlpatterns = [
    # OAuth flow
    path('auth-url/', CalendarAuthUrlView.as_view(), name='auth-url'),
    path('callback/', calendar_callback, name='callback'),
    path('disconnect/', CalendarDisconnectView.as_view(), name='disconnect'),
    
    # Status and sync
    path('status/', CalendarStatusView.as_view(), name='status'),
    path('sync-availability/', CalendarSyncView.as_view(), name='sync'),
    
    # Busy times
    path('busy-times/', CalendarBusyTimesView.as_view(), name='busy-times'),
    path(
        'provider-busy-times/<str:provider_type>/<int:provider_id>/',
        provider_busy_times,
        name='provider-busy-times'
    ),
    
    # Events
    path('events/', CalendarEventsView.as_view(), name='events'),
]




