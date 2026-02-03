// context/types/auth.types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
  password_confirmation?: string;
  phone?: string;
  // Add other registration fields as needed
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  // Actions
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Getters
  getUserProfile: () => Promise<User>;
  refreshToken: () => Promise<string | null>;
  
  // Utility
  checkAuth: () => Promise<boolean>;
  clearAuth: () => void;
}