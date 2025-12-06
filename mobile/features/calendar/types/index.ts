/**
 * Calendar Integration Types
 */

export interface CalendarStatus {
  is_connected: boolean;
  calendar_id: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  is_active: boolean;
}

export interface BusyTime {
  start: string;
  end: string;
}

export interface CalendarBusyTimesResponse {
  has_calendar: boolean;
  busy_times: BusyTime[];
  count: number;
}

export interface CalendarAuthUrlResponse {
  auth_url: string;
  state: string;
}

export interface CalendarConnectResponse {
  message: string;
  is_connected: boolean;
  calendar_id: string;
}

export interface CalendarSyncResponse {
  message: string;
  last_sync_at: string;
}













