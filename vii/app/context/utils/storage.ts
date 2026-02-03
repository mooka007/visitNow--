// [file name]: utils/storage.ts
// [file content begin]
// app/context/utils/storage.ts
import * as SecureStore from 'expo-secure-store';
import { FavoriteItem } from '../types/favorites.types';

// Storage keys
export const STORAGE_KEYS = {
  FAVORITES: 'favorites_data',
  FAVORITES_BACKUP: 'favorites_backup',
  SETTINGS: 'favorites_settings',
} as const;

// Types for better type safety
export interface Settings {
  sortBy?: 'addedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  backupEnabled?: boolean;
  autoBackupFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  maxFavorites?: number;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
}

export interface BackupData {
  data: FavoriteItem[];
  timestamp: string;
  count: number;
  version?: string;
}

// SecureStore utility functions
export const storeFavorites = async (favorites: FavoriteItem[]): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Error storing favorites:', error);
    return false;
  }
};

export const retrieveFavorites = async (): Promise<FavoriteItem[] | null> => {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.FAVORITES);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt),
      }));
    }
    return null;
  } catch (error) {
    console.error('Error retrieving favorites:', error);
    return null;
  }
};

export const clearFavoritesStorage = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.FAVORITES);
    return true;
  } catch (error) {
    console.error('Error clearing favorites:', error);
    return false;
  }
};

// Single favorite item operations
export const addFavorite = async (favorite: FavoriteItem): Promise<boolean> => {
  try {
    const currentFavorites = await retrieveFavorites() || [];
    // Check for duplicates based on id or some unique identifier
    const exists = currentFavorites.some(item => item.id === favorite.id);
    if (exists) {
      console.warn('Favorite already exists');
      return false;
    }
    
    const updatedFavorites = [...currentFavorites, favorite];
    return await storeFavorites(updatedFavorites);
  } catch (error) {
    console.error('Error adding favorite:', error);
    return false;
  }
};

export const removeFavorite = async (favoriteId: FavoriteItem['id']): Promise<boolean> => {
  try {
    const currentFavorites = await retrieveFavorites() || [];
    const updatedFavorites = currentFavorites.filter(item => item.id !== favoriteId);
    
    if (updatedFavorites.length === currentFavorites.length) {
      console.warn('Favorite not found');
      return false;
    }
    
    return await storeFavorites(updatedFavorites);
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

// export const updateFavorite = async (
//   favoriteId: string, 
//   updates: Partial<FavoriteItem>
// ): Promise<boolean> => {
//   try {
//     const currentFavorites = await retrieveFavorites() || [];
//     const index = currentFavorites.findIndex(item => item.id === favoriteId);
    
//     if (index === -1) {
//       console.warn('Favorite not found');
//       return false;
//     }
    
//     const updatedFavorites = [...currentFavorites];
//     updatedFavorites[index] = { ...updatedFavorites[index], ...updates };
    
//     return await storeFavorites(updatedFavorites);
//   } catch (error) {
//     console.error('Error updating favorite:', error);
//     return false;
//   }
// };

// Backup functions
export const createBackup = async (): Promise<BackupData | null> => {
  try {
    const favorites = await retrieveFavorites();
    if (favorites) {
      const backup: BackupData = {
        data: favorites,
        timestamp: new Date().toISOString(),
        count: favorites.length,
        version: '1.0' // Add versioning for future compatibility
      };
      const backupString = JSON.stringify(backup, null, 2);
      await SecureStore.setItemAsync(STORAGE_KEYS.FAVORITES_BACKUP, backupString);
      return backup;
    }
    return null;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
};

export const getBackup = async (): Promise<BackupData | null> => {
  try {
    const backup = await SecureStore.getItemAsync(STORAGE_KEYS.FAVORITES_BACKUP);
    if (backup) {
      return JSON.parse(backup);
    }
    return null;
  } catch (error) {
    console.error('Error getting backup:', error);
    return null;
  }
};

export const restoreFromBackup = async (): Promise<boolean> => {
  try {
    const backup = await SecureStore.getItemAsync(STORAGE_KEYS.FAVORITES_BACKUP);
    if (backup) {
      const backupData: BackupData = JSON.parse(backup);
      // Store only the favorites data, not the entire backup structure
      await SecureStore.setItemAsync(STORAGE_KEYS.FAVORITES, JSON.stringify(backupData.data));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
};

export const clearBackup = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.FAVORITES_BACKUP);
    return true;
  } catch (error) {
    console.error('Error clearing backup:', error);
    return false;
  }
};

// Settings management
export const getSettings = async (): Promise<Settings> => {
  try {
    const settings = await SecureStore.getItemAsync(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.error('Error getting settings:', error);
    return {};
  }
};

export const updateSettings = async (settings: Partial<Settings>): Promise<boolean> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await SecureStore.setItemAsync(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
};

// Export/Import functions
export const exportFavorites = async (): Promise<string | null> => {
  try {
    const favorites = await retrieveFavorites();
    if (favorites) {
      const exportData = {
        favorites,
        exportDate: new Date().toISOString(),
        version: '1.0',
        appName: 'FavoritesApp'
      };
      return JSON.stringify(exportData, null, 2);
    }
    return null;
  } catch (error) {
    console.error('Error exporting favorites:', error);
    return null;
  }
};

export const importFavorites = async (importData: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(importData);
    
    // Validate import data structure
    if (!parsed.favorites || !Array.isArray(parsed.favorites)) {
      throw new Error('Invalid import data format');
    }
    
    // Convert date strings to Date objects if needed
    const favorites = parsed.favorites.map((item: any) => ({
      ...item,
      addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
    }));
    
    return await storeFavorites(favorites);
  } catch (error) {
    console.error('Error importing favorites:', error);
    return false;
  }
};

// Storage utilities
export const getStorageInfo = async (): Promise<{
  favoritesCount: number;
  lastBackup: string | null;
  hasBackup: boolean;
}> => {
  try {
    const favorites = await retrieveFavorites();
    const backup = await getBackup();
    
    return {
      favoritesCount: favorites?.length || 0,
      lastBackup: backup?.timestamp || null,
      hasBackup: !!backup,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      favoritesCount: 0,
      lastBackup: null,
      hasBackup: false,
    };
  }
};

// Data validation helper
export const validateFavoritesData = (data: any): data is FavoriteItem[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every((item: any) => {
    return (
      item &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      item.addedAt &&
      !isNaN(new Date(item.addedAt).getTime())
    );
  });
};

// Migration helper (for future updates)
export const migrateDataIfNeeded = async (): Promise<boolean> => {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.FAVORITES);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Example migration: Add missing fields or fix data structure
      const migratedData = parsed.map((item: any) => {
        // Ensure all items have required fields
        return {
          ...item,
          // Add any missing fields with default values
          lastAccessed: item.lastAccessed || new Date().toISOString(),
        };
      });
      
      await storeFavorites(migratedData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error during data migration:', error);
    return false;
  }
};
// [file content end]

// // [file name]: utils/storage.ts
// // [file content begin]
// // app/context/utils/storage.ts
// import * as SecureStore from 'expo-secure-store';
// import { FavoriteItem } from '../types/favorites.types';

// // Storage keys
// export const STORAGE_KEYS = {
//   FAVORITES: 'favorites_data',
//   FAVORITES_BACKUP: 'favorites_backup',
//   SETTINGS: 'favorites_settings',
// } as const;

// // SecureStore utility functions
// export const storeFavorites = async (favorites: FavoriteItem[]): Promise<boolean> => {
//   try {
//     await SecureStore.setItemAsync(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
//     return true;
//   } catch (error) {
//     console.error('Error storing favorites:', error);
//     return false;
//   }
// };

// export const retrieveFavorites = async (): Promise<FavoriteItem[] | null> => {
//   try {
//     const stored = await SecureStore.getItemAsync(STORAGE_KEYS.FAVORITES);
//     if (stored) {
//       const parsed = JSON.parse(stored);
//       // Convert date strings back to Date objects
//       return parsed.map((item: any) => ({
//         ...item,
//         addedAt: new Date(item.addedAt),
//       }));
//     }
//     return null;
//   } catch (error) {
//     console.error('Error retrieving favorites:', error);
//     return null;
//   }
// };

// export const clearFavoritesStorage = async (): Promise<boolean> => {
//   try {
//     await SecureStore.deleteItemAsync(STORAGE_KEYS.FAVORITES);
//     return true;
//   } catch (error) {
//     console.error('Error clearing favorites:', error);
//     return false;
//   }
// };

// // Backup functions
// export const createBackup = async (): Promise<string | null> => {
//   try {
//     const favorites = await retrieveFavorites();
//     if (favorites) {
//       const backup = {
//         data: favorites,
//         timestamp: new Date().toISOString(),
//         count: favorites.length,
//       };
//       const backupString = JSON.stringify(backup, null, 2);
//       await SecureStore.setItemAsync(STORAGE_KEYS.FAVORITES_BACKUP, backupString);
//       return backupString;
//     }
//     return null;
//   } catch (error) {
//     console.error('Error creating backup:', error);
//     return null;
//   }
// };

// export const restoreFromBackup = async (): Promise<boolean> => {
//   try {
//     const backup = await SecureStore.getItemAsync(STORAGE_KEYS.FAVORITES_BACKUP);
//     if (backup) {
//       await SecureStore.setItemAsync(STORAGE_KEYS.FAVORITES, backup);
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error restoring from backup:', error);
//     return false;
//   }
// };

// // Settings management
// export const getSettings = async () => {
//   try {
//     const settings = await SecureStore.getItemAsync(STORAGE_KEYS.SETTINGS);
//     return settings ? JSON.parse(settings) : {};
//   } catch (error) {
//     return {};
//   }
// };

// export const updateSettings = async (settings: any) => {
//   try {
//     await SecureStore.setItemAsync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
//     return true;
//   } catch (error) {
//     return false;
//   }
// };
// // [file content end]