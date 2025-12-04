/**
 * Calendar Integration Feature
 * 
 * Provides Google Calendar integration for professionals and places
 * to manage their availability and sync reservations.
 */

// Hooks
export { useCalendarIntegration } from './hooks/useCalendarIntegration';
export { useCalendarEvents } from './hooks/useCalendarEvents';

// Components
export { CalendarConnectionCard } from './components/CalendarConnectionCard';
export { CalendarStatusBadge } from './components/CalendarStatusBadge';
export { CalendarAgendaView } from './components/CalendarAgendaView';

// Types
export type {
  CalendarStatus,
  BusyTime,
  CalendarBusyTimesResponse,
  CalendarAuthUrlResponse,
  CalendarConnectResponse,
  CalendarSyncResponse,
} from './types';

