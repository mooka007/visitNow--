// [file name]: hooks/useFavorites.ts
// [file content begin]
// app/context/hooks/useFavorites.ts
import { useContext, useEffect, useState } from 'react';
import { FavoritesContext } from '../FavoritesProvider';
import { FavoritesContextType, ServiceType } from '../types/favorites.types';

// Main hook
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  
  return context;
};

// Hook for checking if a specific offer is favorited (with auto-refresh)
export const useIsFavorite = (offerId: number): boolean => {
  const { isFavorite, favorites } = useFavorites();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(isFavorite(offerId));
  }, [favorites, offerId, isFavorite]);

  return isFav;
};

// Hook for getting favorites by type with filtering
export const useFavoritesByType = (serviceType?: ServiceType) => {
  const { favorites, isLoading } = useFavorites();
  
  const filteredFavorites = serviceType 
    ? favorites.filter(fav => fav.serviceType === serviceType)
    : favorites;
  
  const sortedFavorites = [...filteredFavorites].sort(
    (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
  );
  
  const countByType = serviceType 
    ? filteredFavorites.length
    : favorites.length;
  
  return {
    favorites: sortedFavorites,
    count: countByType,
    isLoading,
  };
};

// Hook for checking storage availability
export const useStorageCheck = () => {
  const { checkStorageAvailability } = useFavorites();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  const checkAvailability = async () => {
    const available = await checkStorageAvailability();
    setIsAvailable(available);
    return available;
  };
  
  return {
    isAvailable,
    checkAvailability,
  };
};
// [file content end]