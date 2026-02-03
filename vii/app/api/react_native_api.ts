import axios, { 
  AxiosInstance, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';
import * as SecureStore from 'expo-secure-store';

// ==================== TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user: User;
}

export interface User {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar?: string;
  avatar_id?: number;
  phone?: string;
  email_verified_at?: string;
  bio?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  birthday?: string;
  business_name?: string;
  last_login_at?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  roles?: string[];
  wallet_balance?: number;
}

// ==================== SERVICE TYPES ====================
export interface Location {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  map_lat?: number;
  map_lng?: number;
  parent_id?: number | null;
  children?: Location[];
}

export interface ReviewScore {
  score_total: string | number;
  total_review: number;
  review_text: string;
}

export interface Review {
  id: number;
  author_id: number;
  author?: {
    id: number;
    name: string;
    avatar?: string;
  };
  title?: string;
  content: string;
  rate: number;
  created_at: string;
}

export interface Author {
  id: number;
  name: string;
  display_name?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  bio?: string;
  business_name?: string;
  vendor_commission_amount?: number;
  vendor_commission_type?: string;
  services_count?: number;
  average_rating?: number;
  total_reviews?: number;
}

export interface ApiService {
  id: number;
  object_model: string;
  title: string;
  slug?: string;
  price: number | string;
  sale_price?: number | string | null;
  discount_percent?: string | null;
  image: string | boolean;
  content: string | null;
  location: Location;
  is_featured: number;
  review_score: ReviewScore;
  author_id?: number;
  author?: Author;

  // Additional detail fields
  address?: string;
  map_lat?: number;
  map_lng?: number;
  map_zoom?: number;
  banner_image?: string;
  gallery?: string[];
  video?: string;
  enable_extra_price?: boolean;
  extra_price?: Array<{ name: string; price: number }>;
  review_stats?: {
    total: number;
    average: number;
    breakdown: Record<string, number>;
  };
  review_lists?: Review[];
  faqs?: Array<{ title: string; content: string }>;
  cancel_policy?: string;
  terms_information?: string;
  min_day_before_booking?: number;
  is_instant?: boolean;
  related?: ApiService[];
  terms?: Array<{ id: number; name: string }>;

  // Type-specific fields
  passenger?: number;
  gear?: string;
  baggage?: number;
  door?: number;
  max_guest?: number;
  cabin?: number;
  length?: string;
  speed?: string;
  duration?: string;
  start_time?: string;
  min_people?: number;
  max_people?: number;
  star_rate?: number;
  policy?: any;
  surrounding?: any;
  include?: any;
  exclude?: any;
  service_fee?: any;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServicesApiResponse {
  total: number;
  total_pages: number;
  data: ApiService[];
  status?: number;
  current_page?: number;
  per_page?: number;
}

export interface Booking {
  id: number;
  code: string;
  status: string;
  total: number;
  service_id: number;
  service_type: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  service?: ApiService;
  guest_details?: any;
  payment_gateway?: string;
}

export interface News {
  id: number;
  title: string;
  slug: string;
  content: string;
  image?: string;
  category_id?: number;
  category?: { id: number; name: string };
  author_id?: number;
  author?: Author;
  created_at: string;
  updated_at: string;
}

// ==================== CONFIG ====================
const API_BASE = "https://visitmorocconow.net/api";
const TIMEOUT = 30000; 
const REFRESH_ENDPOINT = "auth/refresh";

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  TOKEN_EXPIRY: 'token_expiry'
} as const;

// ==================== API INSTANCE ====================
const createApiInstance = (): AxiosInstance => {
  const api = axios.create({
    baseURL: API_BASE,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          
          if (refreshToken) {
            const refreshResponse = await axios.post(
              `${API_BASE}/${REFRESH_ENDPOINT}`,
              { refresh_token: refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );
            
            const { access_token, refresh_token } = refreshResponse.data;
            
            await Promise.all([
              SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access_token),
              SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh_token),
            ]);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            
            return api(originalRequest);
          }
        } catch (refreshError) {
          await clearAuthData();
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  return api;
};

const clearAuthData = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
    SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN_EXPIRY),
  ]);
};

// Create API instance
const api = createApiInstance();

// ==================== STORAGE UTILITIES ====================
export const storage = {
  async setAuthData(token: string, refreshToken?: string, user?: User): Promise<void> {
    const promises: Promise<void>[] = [
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token),
    ];
    
    if (refreshToken) {
      promises.push(SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken));
    }
    
    if (user) {
      promises.push(SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user)));
    }
    
    await Promise.all(promises);
  },
  
  async getAuthData(): Promise<{
    token: string | null;
    refreshToken: string | null;
    user: User | null;
  }> {
    const [token, refreshToken, userData] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA),
    ]);
    
    return {
      token,
      refreshToken,
      user: userData ? JSON.parse(userData) : null,
    };
  },
  
  async clearAuthData(): Promise<void> {
    await clearAuthData();
  },
  
  async updateUserData(user: User): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },
};

// ==================== API SERVICES ====================

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post('auth/login', { 
        email, 
        password, 
        device_name: 'mobile_app' 
      });
      
      const { access_token, user } = response.data;
      
      await storage.setAuthData(access_token, undefined, user);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        errors: error.response?.data?.errors,
      };
    }
  },
  
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post('auth/register', userData);
      
      const { access_token, user } = response.data;
      
      await storage.setAuthData(access_token, undefined, user);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors,
      };
    }
  },
  
  logout: async (): Promise<ApiResponse> => {
    try {
      await api.post('auth/logout');
      await storage.clearAuthData();
      
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      await storage.clearAuthData();
      
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed',
      };
    }
  },
  
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('auth/me');
      
      const user = response.data.data || response.data;
      await storage.updateUserData(user);
      
      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch profile',
      };
    }
  },
  
  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post('auth/me', userData);
      
      const user = response.data.data || response.data;
      await storage.updateUserData(user);
      
      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
        errors: error.response?.data?.errors,
      };
    }
  },
  
  changePassword: async (passwords: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse> => {
    try {
      const response = await api.post('auth/change-password', passwords);
      
      return {
        success: true,
        message: response.data?.message || 'Password changed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password',
        errors: error.response?.data?.errors,
      };
    }
  },

  refresh: async (): Promise<ApiResponse<{ access_token: string; refresh_token?: string }>> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(`${API_BASE}/${REFRESH_ENDPOINT}`, { refresh_token: refreshToken });
      
      const { access_token, refresh_token: new_refresh_token } = response.data;
      
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      if (new_refresh_token) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, new_refresh_token);
      }
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Token refresh failed',
      };
    }
  },
};

// Services API (FIXED)
export const servicesAPI = {
  // Get all services
  getAllServices: async (params: any = {}): Promise<ApiResponse<ServicesApiResponse>> => {
    try {
      const response = await api.get('services', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch services',
      };
    }
  },
  
  // Search services by type
  searchByType: async (type: string, params: any = {}): Promise<ApiResponse<ServicesApiResponse>> => {
    try {
      const response = await api.get(`${type}/search`, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || `Failed to search ${type}`,
      };
    }
  },
  
  // Get service detail
  getServiceDetail: async (type: string, id: number): Promise<ApiResponse<ApiService>> => {
    try {
      const response = await api.get(`${type}/detail/${id}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || `Failed to fetch ${type} details`,
      };
    }
  },
  
  // Check availability
  checkAvailability: async (type: string, id: number, params: any = {}): Promise<ApiResponse> => {
    try {
      const response = await api.get(`${type}/availability/${id}`, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check availability',
      };
    }
  },
  
  // Get filters
  getFilters: async (type: string): Promise<ApiResponse> => {
    try {
      const response = await api.get(`${type}/filters`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch filters',
      };
    }
  },

  // Get form search
  getFormSearch: async (type: string): Promise<ApiResponse> => {
    try {
      const response = await api.get(`${type}/form-search`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch form search',
      };
    }
  },
};

// User API
export const userAPI = {
  getBookingHistory: async (params: any = {}): Promise<ApiResponse<{ data: Booking[] }>> => {
    try {
      const response = await api.get('user/booking-history', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch booking history',
      };
    }
  },
  
  handleWishlist: async (serviceData: {
    service_id: number;
    service_type: string;
  }): Promise<ApiResponse> => {
    try {
      const response = await api.post('user/wishlist', serviceData);
      return {
        success: true,
        data: response.data,
        message: response.data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update wishlist',
      };
    }
  },
  
  getWishlist: async (params: any = {}): Promise<ApiResponse<{ data: ApiService[] }>> => {
    try {
      const response = await api.get('user/wishlist', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch wishlist',
      };
    }
  },

  // ✅ NEW: Get user's offered services
  getUserServices: async (userId: number, params: any = {}): Promise<ApiResponse<ServicesApiResponse>> => {
    try {
      const response = await api.get(`user/${userId}/services`, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user services',
      };
    }
  },

  // ✅ NEW: Get user profile by ID
  getUserProfile: async (userId: number): Promise<ApiResponse<Author>> => {
    try {
      const response = await api.get(`user/${userId}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user profile',
      };
    }
  },
};

// Booking API
export const bookingAPI = {
  addToCart: async (bookingData: any): Promise<ApiResponse<any>> => {
    try {
      console.log('🌐 POST /booking/addToCart');
      console.log('📤 Payload:', JSON.stringify(bookingData, null, 2));
      
      const response = await api.post('booking/addToCart', bookingData);
      
      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('❌ addToCart error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add to cart',
        errors: error.response?.data?.errors,
      };
    }
  },
  doCheckout: async (checkoutData: any) => {
  try {
    console.log('🌐 POST /booking/doCheckout');
    console.log('📤 Payload:', JSON.stringify(checkoutData, null, 2));

    const response = await api.post('booking/doCheckout', checkoutData);

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ doCheckout error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    // ✅ return the backend response so UI can show it
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to checkout',
      errors: error?.response?.data?.errors,
      data: error?.response?.data, // ✅ keep full payload
    };
  }
},
};


// Reviews API
export const reviewsAPI = {
  writeReview: async (type: string, id: number, reviewData: {
    title?: string;
    content: string;
    rate: number;
  }): Promise<ApiResponse<Review>> => {
    try {
      const response = await api.post(`${type}/write-review/${id}`, reviewData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit review',
        errors: error.response?.data?.errors,
      };
    }
  },
  
  getReviews: async (type: string, id: number, params: any = {}): Promise<ApiResponse<{ data: Review[] }>> => {
    try {
      const response = await api.get(`${type}/reviews/${id}`, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch reviews',
      };
    }
  },
};

// Media API
export const mediaAPI = {
  uploadMedia: async (formData: FormData): Promise<ApiResponse<{ url: string; path: string }>> => {
    try {
      const response = await api.post('media/store', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload media',
      };
    }
  },
};

// Locations API
export const locationsAPI = {
  searchLocations: async (params: any = {}): Promise<ApiResponse<{ data: Location[] }>> => {
    try {
      const response = await api.get('locations', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search locations',
      };
    }
  },
  
  getLocationDetail: async (id: number): Promise<ApiResponse<Location>> => {
    try {
      const response = await api.get(`location/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch location details',
      };
    }
  },
};

// News API
export const newsAPI = {
  searchNews: async (params: any = {}): Promise<ApiResponse<{ data: News[] }>> => {
    try {
      const response = await api.get('news', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch news',
      };
    }
  },
  
  getNewsDetail: async (id: number): Promise<ApiResponse<News>> => {
    try {
      const response = await api.get(`news/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch news details',
      };
    }
  },

  getNewsCategory: async (): Promise<ApiResponse> => {
    try {
      const response = await api.get('news/category');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch news categories',
      };
    }
  },
};

// Configuration and Layout API
export const configAPI = {
  getConfigs: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('configs');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch configs',
      };
    }
  },
  
  getHomeLayout: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('home-page');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch home layout',
      };
    }
  },
};

// Contact API
export const contactAPI = {
  sendContactForm: async (contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<ApiResponse> => {
    try {
      const response = await api.post('contact', contactData);
      return {
        success: true,
        message: response.data?.message || 'Message sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send message',
        errors: error.response?.data?.errors,
      };
    }
  },
};

// ==================== CONVENIENCE FUNCTIONS ====================
// ==================== CONVENIENCE FUNCTIONS ====================
export const apiService = {

async getHotelRooms(hotelId: number) {
  try {
    const response = await api.get(`/hotel/rooms/${hotelId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch hotel rooms',
      errors: error.response?.data?.errors,
    };
  }
},

  // Auth
  async login(email: string, password: string) {
    return authAPI.login(email, password);
  },
  
  async register(userData: any) {
    return authAPI.register(userData);
  },
  
  async logout() {
    return authAPI.logout();
  },
  
  async getProfile() {
    return authAPI.getProfile();
  },
  
  async updateProfile(userData: Partial<User>) {
    return authAPI.updateProfile(userData);
  },
  
  async changePassword(passwords: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return authAPI.changePassword(passwords);
  },
  
  // Services
  async getAllServices(params: any = {}) {
    return servicesAPI.getAllServices(params);
  },
  
  async getServicesByType(type: string, params: any = {}) {
    return servicesAPI.searchByType(type, params);
  },
  
  async getServiceDetails(type: string, id: number) {
    return servicesAPI.getServiceDetail(type, id);
  },
  
  async checkAvailability(type: string, id: number, params: any = {}) {
    return servicesAPI.checkAvailability(type, id, params);
  },
  
  // ✅ ADDED: Get featured services
  async getFeaturedServices(limit: number = 10) {
    return servicesAPI.getAllServices({ 
      limit, 
      is_featured: 1, 
      sort: 'featured' 
    });
  },
  
  // ✅ ADDED: Search services
  async searchServices(query: string, params: any = {}) {
    return servicesAPI.getAllServices({
      ...params,
      search: query
    });
  },
  
  // Booking
  async addToCart(bookingData: any) {
    return bookingAPI.addToCart(bookingData);
  },
  
  async checkoutBooking(checkoutData: any) {
    return bookingAPI.doCheckout(checkoutData);
  },
  
  async getBookingHistory(params: any = {}) {
    return userAPI.getBookingHistory(params);
  },
  
  // User
  async toggleWishlist(serviceId: number, serviceType: string) {
    return userAPI.handleWishlist({
      service_id: serviceId,
      service_type: serviceType,
    });
  },
  
  async getWishlist(params: any = {}) {
    return userAPI.getWishlist(params);
  },

  async getUserServices(userId: number, params: any = {}) {
    return userAPI.getUserServices(userId, params);
  },

  async getUserProfile(userId: number) {
    return userAPI.getUserProfile(userId);
  },
  
  // Reviews
  async submitReview(type: string, id: number, rating: number, comment: string, title?: string) {
    return reviewsAPI.writeReview(type, id, { rate: rating, content: comment, title });
  },
  
  async getReviews(type: string, id: number, params: any = {}) {
    return reviewsAPI.getReviews(type, id, params);
  },
  
  // Media
  async uploadImage(imageUri: string, fileName?: string): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      
      formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: fileName || `image_${Date.now()}.${fileExtension}`,
      } as any);
      
      const response = await mediaAPI.uploadMedia(formData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to upload image',
      };
    }
  },
  
  // Helpers
  async isAuthenticated(): Promise<boolean> {
    const authData = await storage.getAuthData();
    return !!authData.token;
  },
  
  async getCurrentUser(): Promise<User | null> {
    const authData = await storage.getAuthData();
    return authData.user;
  },
  
  async clearAllData(): Promise<void> {
    await clearAuthData();
  },
  
  // ✅ ADDED: Transform ApiService to legacy format
  transformApiServiceToLegacy(apiService: ApiService) {
    return {
      id: apiService.id,
      title: apiService.title,
      type: apiService.object_model,
      price: typeof apiService.price === 'number' ? apiService.price.toString() : apiService.price,
      location: apiService.location.name,
      rating: typeof apiService.review_score.score_total === 'string' 
        ? parseFloat(apiService.review_score.score_total) 
        : apiService.review_score.score_total,
      image: typeof apiService.image === 'string' ? apiService.image : '',
    };
  },
};

export default apiService;

// Export everything
export {
  api,
  storage as authStorage,
};