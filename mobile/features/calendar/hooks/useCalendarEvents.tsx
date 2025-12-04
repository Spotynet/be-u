/**
 * useCalendarEvents Hook
 * 
 * Fetches and manages Google Calendar events for the authenticated user.
 */

import { useState, useCallback } from 'react';
import { calendarApi, errorUtils } from '@/lib/api';

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  htmlLink: string;
  status: string;
  attendees: Array<{email: string; displayName?: string}>;
}

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  hasCalendar: boolean;
  fetchEvents: (start: string, end: string, maxResults?: number) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

interface UseCalendarEventsOptions {
  autoFetch?: boolean;
  defaultStart?: string;
  defaultEnd?: string;
}

export const useCalendarEvents = (options: UseCalendarEventsOptions = {}): UseCalendarEventsReturn => {
  const { autoFetch = false, defaultStart, defaultEnd } = options;
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCalendar, setHasCalendar] = useState(false);
  const [lastStart, setLastStart] = useState<string | null>(defaultStart || null);
  const [lastEnd, setLastEnd] = useState<string | null>(defaultEnd || null);

  const fetchEvents = useCallback(async (
    start: string,
    end: string,
    maxResults: number = 50
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await calendarApi.getEvents(start, end, maxResults);
      
      setEvents(response.data.events || []);
      setHasCalendar(response.data.has_calendar);
      setLastStart(start);
      setLastEnd(end);
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      setError(message);
      console.error('Failed to fetch calendar events:', err);
      
      // If calendar not connected, set hasCalendar to false
      if ((err as any)?.status === 404 || message.includes('not connected')) {
        setHasCalendar(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshEvents = useCallback(async (): Promise<void> => {
    if (lastStart && lastEnd) {
      await fetchEvents(lastStart, lastEnd);
    }
  }, [lastStart, lastEnd, fetchEvents]);

  return {
    events,
    isLoading,
    error,
    hasCalendar,
    fetchEvents,
    refreshEvents,
  };
};

