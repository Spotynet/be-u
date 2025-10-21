export type NotificationType = "reserva" | "reseña" | "sistema" | "mensaje";
export type NotificationStatus = "read" | "unread";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  status: NotificationStatus;
  relatedId?: number; // For linking to reservations, reviews, etc.
  metadata?: {
    // Additional data specific to notification type
    reservationCode?: string;
    serviceName?: string;
    providerName?: string;
    rating?: number;
    [key: string]: any;
  };
}

export interface NotificationFilters {
  type?: NotificationType;
  status?: NotificationStatus;
  dateFrom?: string;
  dateTo?: string;
}
