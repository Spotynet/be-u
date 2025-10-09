/**
 * Global type definitions for the Be-U mobile app
 */

export type UserRole = "CLIENT" | "PROFESSIONAL" | "PLACE";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  dateJoined: string;
  lastLogin: string | null;
  isStaff: boolean;
  isSuperuser: boolean;
}

export interface ClientProfile {
  id: number;
  user: number;
  phone?: string;
  photo?: string;
}

export interface ProfessionalProfile {
  id: number;
  user: number;
  name: string;
  last_name: string;
  bio?: string;
  city?: string;
  rating: number;
}

export interface PlaceProfile {
  id: number;
  user: number;
  name: string;
  street: string;
  number_ext?: string;
  number_int?: string;
  postal_code: string;
  city?: string;
  country?: string;
  owner?: number;
}

export type ServiceCategory = "belleza" | "wellness" | "mascotas";

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: ServiceCategory;
  subCategory: string; // e.g., "peluqueria", "yoga", "grooming", "facial", etc.
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed" | "rejected";

export interface Reservation {
  id: number;
  user: number;
  service: number;
  date: string;
  time: string;
  status: ReservationStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Populated fields
  user_details?: User;
  service_details?: Service;
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

// ============================================
// POST TYPES
// ============================================

export type PostType = "photo" | "video" | "carousel" | "poll" | "review";

export interface BasePost {
  id: number;
  author: number;
  author_details?: User;
  type: PostType;
  caption?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface PhotoPost extends BasePost {
  type: "photo";
  image_url: string;
}

export interface VideoPost extends BasePost {
  type: "video";
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
}

export interface CarouselPost extends BasePost {
  type: "carousel";
  images: string[];
  current_index?: number;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
  percentage: number;
}

export interface PollPost extends BasePost {
  type: "poll";
  question: string;
  options: PollOption[];
  total_votes: number;
  user_voted: boolean;
  user_vote?: number;
  expires_at?: string;
}

export interface ReviewPost extends BasePost {
  type: "review";
  service: number;
  service_details?: Service;
  rating: number;
  images?: string[];
}

export type Post = PhotoPost | VideoPost | CarouselPost | PollPost | ReviewPost;

export interface Comment {
  id: number;
  post: number;
  author: number;
  author_details?: User;
  content: string;
  created_at: string;
  updated_at: string;
}
