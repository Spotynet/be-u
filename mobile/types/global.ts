/**
 * Global type definitions for the Be-U mobile app
 */

export type UserRole = "CLIENT" | "PROFESSIONAL" | "PLACE";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
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
  category?: string;
  sub_categories?: string[];
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
  category?: string;
  sub_categories?: string[];
  rating?: number;
  services_count?: number;
}

export interface PublicProfile {
  id: number;
  user: number;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_phone: string;
  user_country: string;
  user_image?: string;
  profile_type: "PROFESSIONAL" | "PLACE";
  name: string;
  description?: string;
  category?: string;
  sub_categories: string[];
  images: string[];
  linked_pros_place: number[];
  has_calendar: boolean;
  street?: string;
  number_ext?: string;
  number_int?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  last_name?: string;
  bio?: string;
  rating: number;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory = "belleza" | "bienestar" | "mascotas";
export type ProviderType = "professional" | "place";
export type ServiceInstanceType = "place_service" | "professional_service";

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
  // Provider information
  provider_type?: ProviderType;
  provider_id?: number;
  provider_name?: string;
}

export interface PlaceService {
  id: number;
  type: "place_service";
  name: string;
  description?: string;
  category: string;
  price: number;
  duration: number; // in minutes
  is_active: boolean;
  professional_assigned?: string;
  created_at: string;
}

export interface ProfessionalService {
  id: number;
  type: "professional_service";
  name: string;
  description?: string;
  category: string;
  price: number;
  duration: number; // in minutes
  is_active: boolean;
  created_at: string;
}

export type UserService = PlaceService | ProfessionalService;

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED";

export interface Reservation {
  id: number;
  code: string;
  client: number;
  client_details?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  service: number;
  service_details?: {
    id: number;
    name: string;
    category: string;
  };
  provider_type: ProviderType;
  provider_name: string;
  provider_details?: any;
  date: string;
  time: string;
  duration?: number; // in minutes
  duration_minutes?: number;
  end_time?: string;
  status: ReservationStatus;
  status_display: string;
  notes?: string;
  cancellation_reason?: string;
  rejection_reason?: string;
  // Google Calendar integration
  calendar_event_created?: boolean;
  calendar_event_link?: string;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// AVAILABILITY & CALENDAR TYPES
// ============================================

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Monday, 6=Sunday

export interface ProviderAvailability {
  id: number;
  provider_type: ProviderType;
  provider_name: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklySchedule {
  [key: number]: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

export type BlockReason = "VACATION" | "BREAK" | "BOOKED" | "PERSONAL" | "OTHER";

export interface TimeSlotBlock {
  id: number;
  provider_type: ProviderType;
  provider_name: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: BlockReason;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string;
  end_time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  provider_type: ProviderType;
  provider_id: number;
  slots: TimeSlot[];
}

export interface CalendarEvent {
  id: number;
  code: string;
  service: string;
  time: string;
  status: ReservationStatus;
  client_name?: string;
  provider_name?: string;
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

// ============================================
// SERVICE CREATION TYPES
// ============================================

export interface ServiceType {
  id: number;
  name: string;
  category: number;
  category_name?: string;
  description?: string;
  photo?: string;
}

export interface ServiceCategoryData {
  id: number;
  name: string;
  description?: string;
}

export interface CreateServiceTypeData {
  name: string;
  category: number;
  description?: string;
  photo?: string;
}

export interface ServiceFormData {
  service: number; // ServiceType ID
  description?: string;
  duration: number; // in minutes
  price: number;
  is_active?: boolean;
  professional?: number; // For place services only
  photo?: string;
}

export interface ProfessionalOption {
  id: number;
  name: string;
  last_name: string;
  bio?: string;
  city?: string;
  rating: number;
}

// ============================================
// PROVIDER PROFILES FOR EXPLORE/BROWSE
// ============================================

export interface ProfessionalProfile {
  id: number;
  user_id: number;
  email: string;
  name: string;
  last_name: string;
  bio?: string;
  city?: string;
  rating: number;
  services_count: number;
  category?: string;
  sub_categories?: string[];
}

export interface PlaceProfile {
  id: number;
  user_id: number;
  email: string;
  name: string;
  street: string;
  number_ext?: string;
  number_int?: string;
  postal_code: string;
  city?: string;
  country?: string;
  owner: number;
  services_count: number;
  address: string;
  professionals?: ProfessionalProfile[];
  category?: string;
  sub_categories?: string[];
}
