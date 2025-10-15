export interface ServiceFormData {
  service: number;
  description?: string;
  duration: number; // in minutes
  price: number;
  is_active?: boolean;
  professional?: number; // For place services only
}

export interface ServiceTypeOption {
  id: number;
  name: string;
  category: string;
}

export interface ServiceCategoryOption {
  id: number;
  name: string;
  description?: string;
}







