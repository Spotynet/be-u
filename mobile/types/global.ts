/**
 * Global type definitions for the Be-U mobile app
 */

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: number;
  userId: number;
  serviceId: number;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  service?: Service;
}

export interface Review {
  id: number;
  userId: number;
  serviceId: number;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  service?: Service;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
