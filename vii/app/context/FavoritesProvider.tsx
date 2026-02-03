// app/context/FavoritesProvider.tsx

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { FavoritesContextType, FavoriteItem, ServiceType } from './types/favorites.types';
import { userAPI } from '../api/react_native_api';

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'favorites_data';

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  // ✅ Load favorites from both API and local storage
 // ✅ Load favorites with detailed debugging
const loadFavorites = async () => {
  try {
    console.log('🔍 ========== LOADING FAVORITES ==========');
    setIsLoading(true);
    
    // Step 1: Check if SecureStore is available
    try {
      await SecureStore.setItemAsync('test_key', 'test_value');
      const testValue = await SecureStore.getItemAsync('test_key');
      console.log('✅ SecureStore is working. Test value:', testValue);
      await SecureStore.deleteItemAsync('test_key');
    } catch (error) {
      console.error('❌ SecureStore NOT working:', error);
      setIsLoading(false);
      return;
    }

    // Step 2: Try to load from SecureStore
    console.log('🔍 Attempting to load from SecureStore with key:', STORAGE_KEY);
    const storedFavorites = await SecureStore.getItemAsync(STORAGE_KEY);
    
    console.log('🔍 Raw data from SecureStore:', storedFavorites);
    console.log('🔍 Data type:', typeof storedFavorites);
    console.log('🔍 Data length:', storedFavorites ? storedFavorites.length : 0);
    
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        console.log('✅ Parsed favorites:', parsedFavorites);
        console.log('✅ Number of favorites:', parsedFavorites.length);
        
        const favoritesWithDates = parsedFavorites.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        
        setFavorites(favoritesWithDates);
        console.log('✅ Set favorites to state:', favoritesWithDates.length);
      } catch (parseError) {
        console.error('❌ Error parsing favorites:', parseError);
      }
    } else {
      console.log('⚠️ No data found in SecureStore');
      setFavorites([]);
    }

    // Step 3: Try to sync with API (optional)
    try {
      console.log('🔍 Attempting to sync with API...');
      const response = await userAPI.getWishlist();
      if (response.success && response.data) {
        console.log('✅ API sync successful:', response.data);
        const apiFavorites: FavoriteItem[] = response.data.data?.map((item: any) => ({
          id: item.object_id || item.id,
          serviceType: item.object_model || item.type,
          addedAt: new Date(item.create_at || item.created_at || Date.now()),
        })) || [];
        
        if (apiFavorites.length > 0) {
          setFavorites(apiFavorites);
          await saveFavoritesLocally(apiFavorites);
          console.log('✅ Synced with API:', apiFavorites.length);
        }
      }
    } catch (apiError) {
      console.log('⚠️ API sync failed (using local storage)');
    }
    
    console.log('🔍 ========== LOADING COMPLETE ==========');
  } catch (error) {
    console.error('❌ Fatal error loading favorites:', error);
  } finally {
    setIsLoading(false);
  }
};

  // ✅ Save favorites locally to SecureStore
  // ✅ Save favorites with detailed logging
const saveFavoritesLocally = async (newFavorites: FavoriteItem[]) => {
  try {
    console.log('💾 ========== SAVING FAVORITES ==========');
    console.log('💾 Storage key:', STORAGE_KEY);
    console.log('💾 Number of favorites to save:', newFavorites.length);
    console.log('💾 Favorites data:', JSON.stringify(newFavorites, null, 2));
    
    const jsonString = JSON.stringify(newFavorites);
    console.log('💾 JSON string length:', jsonString.length);
    
    await SecureStore.setItemAsync(STORAGE_KEY, jsonString);
    console.log('✅ Successfully saved to SecureStore');
    
    // Verify it was saved
    const verification = await SecureStore.getItemAsync(STORAGE_KEY);
    console.log('🔍 Verification - Data was saved:', verification !== null);
    console.log('🔍 Verification - Data length:', verification?.length || 0);
    console.log('💾 ========== SAVE COMPLETE ==========');
  } catch (error) {
    console.error('❌ Error saving favorites to SecureStore:', error);
  }
};


  // ✅ Check if an offer is favorited
  const isFavorite = useCallback((offerId: number): boolean => {
    return favorites.some(fav => fav.id === offerId);
  }, [favorites]);

  // ✅ Add favorite (with optimistic update and proper rollback)
  const addFavorite = async (offerId: number, serviceType: ServiceType) => {
    // Create new favorite item
    const newFavorite: FavoriteItem = {
      id: offerId,
      serviceType,
      addedAt: new Date(),
    };

    // Save current state for potential rollback
    const previousFavorites = [...favorites];

    // Optimistic update: Add to UI immediately
    const optimisticFavorites = [...favorites, newFavorite];
    setFavorites(optimisticFavorites);
    await saveFavoritesLocally(optimisticFavorites);
    console.log('❤️ Added to favorites (optimistic):', offerId);

    try {
      // Then sync with API in background
      const response = await userAPI.handleWishlist({
        service_id: offerId,
        service_type: serviceType,
      });

      if (!response.success) {
        console.error('⚠️ API add failed, rolling back');
        setFavorites(previousFavorites);
        await saveFavoritesLocally(previousFavorites);
      } else {
        console.log('✅ Synced with API successfully');
      }
    } catch (error: any) {
      console.log('⚠️ Error syncing with API:', error.message);
      
      // Keep local favorite even if API fails (offline support)
      if (error.response?.status === 401 || error.message?.includes('Unauthenticated')) {
        console.log('⚠️ User not authenticated, kept locally only');
      }
      // Don't rollback on network errors - keep the favorite locally
    }
  };

  // ✅ Remove favorite (with optimistic update and proper rollback)
  const removeFavorite = async (offerId: number) => {
    // Find the favorite to remove
    const favorite = favorites.find(fav => fav.id === offerId);
    if (!favorite) {
      console.log('⚠️ Favorite not found:', offerId);
      return;
    }

    // Save current state for potential rollback
    const previousFavorites = [...favorites];

    // Optimistic update: Remove from UI immediately
    const optimisticFavorites = favorites.filter(fav => fav.id !== offerId);
    setFavorites(optimisticFavorites);
    await saveFavoritesLocally(optimisticFavorites);
    console.log('💔 Removed from favorites (optimistic):', offerId);

    try {
      // Then sync with API in background
      const response = await userAPI.handleWishlist({
        service_id: offerId,
        service_type: favorite.serviceType,
      });

      if (!response.success) {
        console.error('⚠️ API remove failed, rolling back');
        setFavorites(previousFavorites);
        await saveFavoritesLocally(previousFavorites);
      } else {
        console.log('✅ Removed from API successfully');
      }
    } catch (error: any) {
      console.log('⚠️ Error syncing with API:', error.message);
      
      // Keep local change even if API fails (offline support)
      if (error.response?.status === 401 || error.message?.includes('Unauthenticated')) {
        console.log('⚠️ User not authenticated, removed locally only');
      }
      // Don't rollback on network errors - keep the change locally
    }
  };

  // ✅ Toggle favorite status
  const toggleFavorite = async (offerId: number, serviceType: ServiceType): Promise<boolean> => {
    if (isFavorite(offerId)) {
      await removeFavorite(offerId);
      return false; // Removed
    } else {
      await addFavorite(offerId, serviceType);
      return true; // Added
    }
  };

  // Get all favorite IDs
  const getFavoriteIds = useCallback((): number[] => {
    return favorites.map(fav => fav.id);
  }, [favorites]);

  // Get favorites count by service type
  const getCountByType = useCallback((serviceType?: ServiceType): number => {
    if (!serviceType) return favorites.length;
    return favorites.filter(fav => fav.serviceType === serviceType).length;
  }, [favorites]);

  // Get favorites grouped by service type
  const getFavoritesByType = useCallback((): Record<ServiceType, FavoriteItem[]> => {
    const grouped: Record<string, FavoriteItem[]> = {};
    favorites.forEach(favorite => {
      if (!grouped[favorite.serviceType]) {
        grouped[favorite.serviceType] = [];
      }
      grouped[favorite.serviceType].push(favorite);
    });
    return grouped as Record<ServiceType, FavoriteItem[]>;
  }, [favorites]);

  // Get recently added favorites
  const getRecentFavorites = useCallback((limit: number = 10): FavoriteItem[] => {
    return [...favorites]
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, limit);
  }, [favorites]);

  // Get favorites sorted by date for display
  const getFavoritesForDisplay = useCallback((): FavoriteItem[] => {
    return [...favorites].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }, [favorites]);

  // Clear all favorites
  const clearFavorites = async () => {
    setFavorites([]);
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    console.log('🗑️ Cleared all favorites');
  };

  // Export favorites for backup
  const exportFavorites = useCallback((): string => {
    return JSON.stringify(favorites, null, 2);
  }, [favorites]);

  // Import favorites from backup
  const importFavorites = async (favoritesData: string): Promise<boolean> => {
    try {
      const importedFavorites = JSON.parse(favoritesData);
      if (Array.isArray(importedFavorites)) {
        const favoritesWithDates = importedFavorites.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt || new Date()),
        }));
        setFavorites(favoritesWithDates);
        await saveFavoritesLocally(favoritesWithDates);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing favorites:', error);
      return false;
    }
  };

  // Check storage availability
  const checkStorageAvailability = async (): Promise<boolean> => {
    try {
      await SecureStore.getItemAsync('test_key');
      return true;
    } catch (error) {
      console.error('SecureStore not available:', error);
      return false;
    }
  };

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoriteIds,
    getCountByType,
    getFavoritesByType,
    getRecentFavorites,
    getFavoritesForDisplay,
    clearFavorites,
    loadFavorites,
    exportFavorites,
    importFavorites,
    checkStorageAvailability,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};




// // app/context/FavoritesProvider.tsx
// import React, { createContext, useState, useEffect, ReactNode } from 'react';
// import * as SecureStore from 'expo-secure-store';
// import { FavoritesContextType, FavoriteItem, ServiceType } from './types/favorites.types';
// import { userAPI } from '../api/react_native_api'; // Import API
// import { useAuth } from './hooks/useAuth'; // Import auth hook

// export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// const STORAGE_KEY = 'favorites_data';

// interface FavoritesProviderProps {
//   children: ReactNode;
// }

// export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
//   const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   // Load favorites on mount
//   useEffect(() => {
//     loadFavorites();
//   }, []);

//   // Load favorites from both API and local storage
//   const loadFavorites = async () => {
//     try {
//       setIsLoading(true);

//       // First, try to load from API (if user is authenticated)
//       try {
//         const response = await userAPI.getWishlist();
        
//         if (response.success && response.data) {
//           console.log('✅ Loaded favorites from API:', response.data);
          
//           // Map API response to FavoriteItem format
//           const apiFavorites: FavoriteItem[] = response.data.data?.map((item: any) => ({
//             id: item.object_id || item.id,
//             serviceType: item.object_model || item.type,
//             addedAt: new Date(item.create_at || item.created_at || Date.now()),
//           })) || [];

//           setFavorites(apiFavorites);
//           await saveFavoritesLocally(apiFavorites);
//           return;
//         }
//       } catch (apiError) {
//         console.log('⚠️ Could not load from API (user may not be logged in), loading from local storage');
//       }

//       // Fallback: Load from local storage
//       const storedFavorites = await SecureStore.getItemAsync(STORAGE_KEY);
//       if (storedFavorites) {
//         const parsedFavorites = JSON.parse(storedFavorites);
//         const favoritesWithDates = parsedFavorites.map((item: any) => ({
//           ...item,
//           addedAt: new Date(item.addedAt),
//         }));
//         setFavorites(favoritesWithDates);
//       }
//     } catch (error) {
//       console.error('Error loading favorites:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Save favorites locally
//   const saveFavoritesLocally = async (newFavorites: FavoriteItem[]) => {
//     try {
//       await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(newFavorites));
//     } catch (error) {
//       console.error('Error saving favorites locally:', error);
//     }
//   };

//   // Check if an offer is favorited
//   const isFavorite = (offerId: number): boolean => {
//     return favorites.some(fav => fav.id === offerId);
//   };

//   // Add favorite (sync with API)
//   // Add favorite (with optimistic update)
// const addFavorite = async (offerId: number, serviceType: ServiceType) => {
//   // ✅ OPTIMISTIC UPDATE: Add to UI immediately
//   const newFavorite: FavoriteItem = {
//     id: offerId,
//     serviceType,
//     addedAt: new Date(),
//   };
//   const optimisticFavorites = [...favorites, newFavorite];
//   setFavorites(optimisticFavorites);
//   await saveFavoritesLocally(optimisticFavorites);

//   try {
//     // Then sync with API in background
//     const response = await userAPI.handleWishlist({
//       service_id: offerId,
//       service_type: serviceType,
//     });

//     if (!response.success) {
//       // ❌ If API fails, rollback
//       console.error('Failed to add to API, rolling back');
//       setFavorites(favorites);
//       await saveFavoritesLocally(favorites);
//       throw new Error(response.message || 'Failed to add favorite');
//     } else {
//       console.log('✅ Synced with API successfully');
//     }
//   } catch (error: any) {
//     console.error('Error adding favorite:', error);
    
//     // If API fails (e.g., not logged in), keep it locally only
//     if (error.response?.status === 401 || error.message?.includes('Unauthenticated')) {
//       console.log('⚠️ User not authenticated, kept locally only');
//     } else {
//       // Rollback on other errors
//       setFavorites(favorites);
//       await saveFavoritesLocally(favorites);
//     }
//   }
// };

// // Remove favorite (with optimistic update)
// const removeFavorite = async (offerId: number) => {
//   // Find the service type before removing
//   const favorite = favorites.find(fav => fav.id === offerId);
//   if (!favorite) return;

//   // ✅ OPTIMISTIC UPDATE: Remove from UI immediately
//   const optimisticFavorites = favorites.filter(fav => fav.id !== offerId);
//   setFavorites(optimisticFavorites);
//   await saveFavoritesLocally(optimisticFavorites);

//   try {
//     // Then sync with API in background
//     const response = await userAPI.handleWishlist({
//       service_id: offerId,
//       service_type: favorite.serviceType,
//     });

//     if (!response.success) {
//       // ❌ If API fails, rollback
//       console.error('Failed to remove from API, rolling back');
//       setFavorites(favorites);
//       await saveFavoritesLocally(favorites);
//       throw new Error(response.message || 'Failed to remove favorite');
//     } else {
//       console.log('✅ Removed from API successfully');
//     }
//   } catch (error: any) {
//     console.error('Error removing favorite:', error);
    
//     // If API fails, keep it locally
//     if (error.response?.status === 401 || error.message?.includes('Unauthenticated')) {
//       console.log('⚠️ User not authenticated, removed locally only');
//     } else {
//       // Rollback on other errors
//       setFavorites(favorites);
//       await saveFavoritesLocally(favorites);
//     }
//   }
// };


//   // Toggle favorite status
//   const toggleFavorite = async (offerId: number, serviceType: ServiceType): Promise<boolean> => {
//     if (isFavorite(offerId)) {
//       await removeFavorite(offerId);
//       return false; // Removed
//     } else {
//       await addFavorite(offerId, serviceType);
//       return true; // Added
//     }
//   };

//   // Get all favorite IDs
//   const getFavoriteIds = (): number[] => {
//     return favorites.map(fav => fav.id);
//   };

//   // Get favorites count by service type
//   const getCountByType = (serviceType?: ServiceType): number => {
//     if (!serviceType) return favorites.length;
//     return favorites.filter(fav => fav.serviceType === serviceType).length;
//   };

//   // Get favorites grouped by service type
//   const getFavoritesByType = (): Record<ServiceType, FavoriteItem[]> => {
//     const grouped: Record<string, FavoriteItem[]> = {};
//     favorites.forEach(favorite => {
//       if (!grouped[favorite.serviceType]) {
//         grouped[favorite.serviceType] = [];
//       }
//       grouped[favorite.serviceType].push(favorite);
//     });
//     return grouped;
//   };

//   // Get recently added favorites
//   const getRecentFavorites = (limit: number = 10): FavoriteItem[] => {
//     return [...favorites]
//       .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
//       .slice(0, limit);
//   };

//   // Get favorites sorted by date for display
//   const getFavoritesForDisplay = (): FavoriteItem[] => {
//     return [...favorites].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
//   };

//   // Clear all favorites
//   const clearFavorites = async () => {
//     setFavorites([]);
//     await SecureStore.deleteItemAsync(STORAGE_KEY);
//   };

//   // Export favorites for backup
//   const exportFavorites = (): string => {
//     return JSON.stringify(favorites, null, 2);
//   };

//   // Import favorites from backup
//   const importFavorites = async (favoritesData: string): Promise<boolean> => {
//     try {
//       const importedFavorites = JSON.parse(favoritesData);
//       if (Array.isArray(importedFavorites)) {
//         const favoritesWithDates = importedFavorites.map((item: any) => ({
//           ...item,
//           addedAt: new Date(item.addedAt || new Date()),
//         }));
//         setFavorites(favoritesWithDates);
//         await saveFavoritesLocally(favoritesWithDates);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error importing favorites:', error);
//       return false;
//     }
//   };

//   // Check storage availability
//   const checkStorageAvailability = async (): Promise<boolean> => {
//     try {
//       await SecureStore.getItemAsync('test_key');
//       return true;
//     } catch (error) {
//       console.error('SecureStore not available:', error);
//       return false;
//     }
//   };

//   const value: FavoritesContextType = {
//     favorites,
//     isLoading,
//     isFavorite,
//     addFavorite,
//     removeFavorite,
//     toggleFavorite,
//     getFavoriteIds,
//     getCountByType,
//     getFavoritesByType,
//     getRecentFavorites,
//     getFavoritesForDisplay,
//     clearFavorites,
//     loadFavorites,
//     exportFavorites,
//     importFavorites,
//     checkStorageAvailability,
//   };

//   return (
//     <FavoritesContext.Provider value={value}>
//       {children}
//     </FavoritesContext.Provider>
//   );
// };
