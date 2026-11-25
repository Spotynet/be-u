import type {ComponentType} from "react";
import type {AppNavRole} from "@/components/shell/nav-config";

export type AccountRole = AppNavRole;

export type AccountViewProps = {
  /** Optional className for the view root. */
  className?: string;
};

export type AccountViewComponent = ComponentType<AccountViewProps>;

export type AccountReservation = {
  id: number;
  code?: string;
  date: string;
  time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  status: string;
  status_display?: string;
  service_name?: string;
  service_details?: {
    name?: string;
    price?: number | string | null;
    currency?: string | null;
  } | null;
  provider_name?: string | null;
  provider_details?: {
    name?: string;
    last_name?: string;
    image?: string | null;
    avatar?: string | null;
    public_profile_id?: number | null;
  } | null;
  service_address?: string | null;
  created_at?: string;
};

export type AccountFavorite = {
  id: number;
  favorite_name: string;
  favorite_type: "PROFESSIONAL" | "PLACE";
  favorite_specialty?: string;
  favorite_rating?: number;
  content_object_id: number;
  public_profile_id?: number | null;
  created_at?: string;
};

export type ReservationFilterId =
  | "all"
  | "upcoming"
  | "past"
  | "month"
  | "cancelled";
