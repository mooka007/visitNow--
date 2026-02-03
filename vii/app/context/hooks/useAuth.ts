// context/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../AuthProvider';
import { AuthContextType } from '../types/auth.types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Hook for checking authentication status
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

// Hook for getting user data
export const useUser = () => {
  const { user } = useAuth();
  return user;
};