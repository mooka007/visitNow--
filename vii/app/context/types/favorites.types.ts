// [file name]: types/favorites.types.ts
// [file content begin]
// app/context/types/favorites.types.ts

export type ServiceType = 'hotel' | 'car' | 'space' | 'tour' | 'event' | 'flight';

export interface FavoriteItem {
  id: number;           // Offer ID
  serviceType: ServiceType;
  addedAt: Date;        // When it was favorited
}

export interface FavoritesContextType {
  favorites: FavoriteItem[];
  isLoading: boolean;
  
  // Core actions
  isFavorite: (offerId: number) => boolean;
  addFavorite: (offerId: number, serviceType: ServiceType) => Promise<void>;
  removeFavorite: (offerId: number) => Promise<void>;
  toggleFavorite: (offerId: number, serviceType: ServiceType) => Promise<boolean>;
  
  // Getters
  getFavoriteIds: () => number[];
  getCountByType: (serviceType?: ServiceType) => number;
  getFavoritesByType: () => Record<string, FavoriteItem[]>;
  getRecentFavorites: (limit?: number) => FavoriteItem[];
  getFavoritesForDisplay: () => FavoriteItem[];
  
  // Management
  clearFavorites: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  
  // Import/Export
  exportFavorites: () => string;
  importFavorites: (favoritesData: string) => Promise<boolean>;
  
  // Utility
  checkStorageAvailability: () => Promise<boolean>;
}
// [file content end]