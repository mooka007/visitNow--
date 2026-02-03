// context/index.ts
export { FavoritesProvider } from './FavoritesProvider';
export { 
  useFavorites, 
  useIsFavorite, 
  useFavoritesByType,
  useStorageCheck 
} from './hooks/useFavorites';
export type { 
  FavoriteItem, 
  FavoritesContextType, 
  ServiceType as FavoritesServiceType 
} from './types/favorites.types';

// Export Bookings
export { BookingsProvider } from './BookingsProvider';
export { useBookings } from './hooks/useBookings';
export type { Booking, BookingsContextType } from './types/bookings.types';

// Export Auth - FIXED: Only export what exists
export { AuthProvider } from './AuthProvider';
export { useAuth } from './hooks/useAuth'; // ✅ Only useAuth exists
export type { 
  User, 
  AuthContextType,
  AuthCredentials,
  RegisterData 
} from './types/auth.types';

// Export Storage utilities
export { 
  storeFavorites,
  retrieveFavorites,
  clearFavoritesStorage,
  createBackup,
  restoreFromBackup,
  getSettings,
  updateSettings,
  STORAGE_KEYS
} from './utils/storage';

// Export Services
export { ServicesProvider } from './ServicesProvider';
export { 
  useServices, 
  useServiceSearch, 
  useFeaturedServices, 
  // useRecommendedServices,
  useServiceDetail,
  // useServiceFilters 
} from './hooks/useServices';
export type { 
  Service, 
  ServiceType, 
  SearchParams, 
  ServiceFilters,
  ServicesContextType 
} from './types/services.types';
// export { FavoritesProvider } from './FavoritesProvider';
// export { 
//   useFavorites, 
//   useIsFavorite, 
//   useFavoritesByType,
//   useStorageCheck 
// } from './hooks/useFavorites';
// export type { 
//   FavoriteItem, 
//   FavoritesContextType, 
//   ServiceType as FavoritesServiceType 
// } from './types/favorites.types';

// // Export Bookings
// export { BookingsProvider } from './BookingsProvider';
// export { useBookings } from './hooks/useBookings';
// export type { Booking, BookingsContextType } from './types/bookings.types';

// // Export Auth
// export { AuthProvider } from './AuthProvider';
// export { useAuth, useAuthStatus, useUser } from './hooks/useAuth';
// export type { 
//   User, 
//   AuthContextType,
//   AuthCredentials,
//   RegisterData 
// } from './types/auth.types';

// // Export Storage utilities
// export { 
//   storeFavorites,
//   retrieveFavorites,
//   clearFavoritesStorage,
//   createBackup,
//   restoreFromBackup,
//   getSettings,
//   updateSettings,
//   STORAGE_KEYS
// } from './utils/storage';