/**
 * Time and duration utility functions for calendar and reservations
 */

/**
 * Convert minutes to HH:MM:SS format for backend
 */
export const minutesToDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
};

/**
 * Convert HH:MM:SS duration to minutes
 */
export const durationToMinutes = (duration: string): number => {
  const [hours, minutes] = duration.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Format time string (HH:MM:SS or HH:MM) to display format
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":").slice(0, 2);
  const hour = parseInt(hours);
  const isPM = hour >= 12;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return `${displayHour}:${minutes} ${isPM ? "PM" : "AM"}`;
};

/**
 * Format date to display string
 */
export const formatDate = (
  dateString: string,
  options?: {
    weekday?: "short" | "long";
    month?: "short" | "long" | "numeric";
    day?: "numeric";
    year?: "numeric";
  }
): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...options,
  };

  return date.toLocaleDateString("es-MX", defaultOptions);
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Add days to a date
 */
export const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

/**
 * Get date range for calendar queries
 */
export const getMonthDateRange = (year: number, month: number) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
  };
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if a time is in the past for today
 */
export const isPastTime = (dateString: string, timeString: string): boolean => {
  const now = new Date();
  const dateTime = new Date(dateString);
  const [hours, minutes] = timeString.split(":").map(Number);
  dateTime.setHours(hours, minutes, 0, 0);

  return dateTime < now;
};

/**
 * Get day of week name
 */
export const getDayName = (dayOfWeek: number): string => {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  return days[dayOfWeek] || "";
};

/**
 * Get day of week short name
 */
export const getDayShortName = (dayOfWeek: number): string => {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  return days[dayOfWeek] || "";
};











