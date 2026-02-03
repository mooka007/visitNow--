

// context/types/services.types.ts
import { ApiService, ServicesApiResponse } from '../../api/react_native_api';

export type ServiceType = 'hotel' | 'car' | 'space' | 'tour' | 'event' | 'flight' | 'boat' | 'other';
// Use the actual ApiService from our fixed API file
export type Service = ApiService & {
  type: ServiceType;
};

export interface ServiceFilters {
  priceRange?: { min: number; max: number };
  locations?: string[];
  ratings?: number[];
  amenities?: string[];
  [key: string]: any;
}

export interface SearchParams {
  type?: ServiceType;
  query?: string;
  location?: string;
  page?: number;
  limit?: number;
  sort?: string;
  filters?: ServiceFilters;
}

export interface ServicesState {
  services: Service[];
  featuredServices: Service[];
  searchResults: ServicesApiResponse | null;
  serviceDetail: Service | null;
  loading: boolean;
  error: string | null;
  searchLoading: boolean;
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface ServicesContextType extends ServicesState {
  // Main actions
  fetchServices: (params?: any) => Promise<void>;
  fetchFeaturedServices: (limit?: number) => Promise<void>;
  searchServices: (query: string, params?: any) => Promise<void>;
  getServiceDetail: (type: ServiceType, id: number) => Promise<Service | null>;
  
  // Pagination
  loadMoreServices: () => Promise<void>;
  
  // Error handling
  clearError: () => void;
  
  // Refresh
  refreshServices: () => Promise<void>;
}