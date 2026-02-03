// context/AuthProvider.tsx - REPLACE the entire file with this:

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  AuthContextType,
  AuthCredentials,
  RegisterData,
  User,
  AuthResponse,
  AuthState
} from './types/auth.types';
import { authAPI } from '../api/react_native_api';

const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_DATA: 'user_data',
} as const;

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // FIXED: Simple initialization useEffect
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // console.log('🔐 Initializing auth...');
        
        const token = await SecureStore.getItemAsync(AUTH_KEYS.ACCESS_TOKEN);
        // console.log('🔐 Token found:', !!token);
        
        if (!token) {
          console.log('🔐 No token found, user is not authenticated');
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }
        
        const userData = await SecureStore.getItemAsync(AUTH_KEYS.USER_DATA);
        
        if (userData) {
          try {
            const user = JSON.parse(userData);
            // console.log('🔐 User data loaded from storage');
            
            setAuthState({
              user,
              token,
              isLoading: false,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('🔐 Failed to parse user data:', error);
            await clearAuthData();
            setAuthState({
              user: null,
              token: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } else {
          console.log('🔐 Token exists but no user data, clearing');
          await clearAuthData();
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('🔐 Auth initialization error:', error);
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, []); // Empty dependency array

  // Clear auth data
  const clearAuthData = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(AUTH_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  // Save auth data
  const saveAuthData = async (token: string, user: User) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, token),
        SecureStore.setItemAsync(AUTH_KEYS.USER_DATA, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  // Login user
  const login = async (credentials: AuthCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authAPI.login(credentials.email, credentials.password);
      const { access_token, user } = response.data as AuthResponse;
      
      await saveAuthData(access_token, user);
      
      setAuthState({
        user,
        token: access_token,
        isLoading: false,
        isAuthenticated: true,
      });

      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      Alert.alert('Login Error', errorMessage);
      throw error;
    }
  };

  // Register user
  const register = async (data: RegisterData): Promise<void> => { 
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const registerData = {
        ...data,
        password_confirmation: data.password_confirmation || data.password
      };
      
      const response = await authAPI.register(registerData);
      const { access_token, user } = response.data as AuthResponse;
      
      await saveAuthData(access_token, user);
      
      setAuthState({
        user,
        token: access_token,
        isLoading: false,
        isAuthenticated: true,
      });

      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      Alert.alert('Registration Error', errorMessage);
      throw error;
    }
  };

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await clearAuthData();
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      
      Alert.alert('Logged Out', 'You have been logged out successfully.');
    }
  };

  // Update user profile
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data;
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser || null,
        isLoading: false,
      }));
      
      await SecureStore.setItemAsync(AUTH_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      Alert.alert('Update Error', errorMessage);
      throw error;
    }
  };

  // Get user profile
  const getUserProfile = async (): Promise<User> => {
    try {
      const response = await authAPI.getProfile();
      const user = response.data;

       if (!user) {
      throw new Error('User profile not found');
    }
      
      setAuthState(prev => ({ ...prev, user: user || null }));
      await SecureStore.setItemAsync(AUTH_KEYS.USER_DATA, JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  // Other functions...
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await authAPI.changePassword({ 
        current_password: currentPassword, 
        new_password: newPassword,
        new_password_confirmation: newPassword
      });
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
      Alert.alert('Error', errorMessage);
      throw error;
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      if (!authAPI.refresh) return null;
      
      const response = await authAPI.refresh();
      const { access_token } = response.data || {};
      
      if (access_token) {
        await SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, access_token);
        setAuthState(prev => ({ ...prev, token: access_token }));
        return access_token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return null;
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  };

  const clearAuth = async () => {
    await clearAuthData();
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    getUserProfile,
    refreshToken,
    checkAuth,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};