

// context/hooks/useServices.ts
import { useContext } from 'react';
import { ServicesContext } from '../ServicesProvider';
import { ServicesContextType } from '../types/services.types';

export const useServices = (): ServicesContextType => {
  const context = useContext(ServicesContext);
  
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  
  return context;
};

// Convenience hook for getting all services
export const useAllServices = () => {
  const { services, fetchServices, loading, error } = useServices();
  return { services, fetchServices, loading, error };
};

// Convenience hook for featured services
export const useFeaturedServices = () => {
  const { featuredServices, fetchFeaturedServices, loading, error } = useServices();
  return { featuredServices, fetchFeaturedServices, loading, error };
};

// Convenience hook for searching
export const useServiceSearch = () => {
  const { searchServices, services, searchLoading, error } = useServices();
  return { searchServices, searchResults: services, searchLoading, error };
};

// Convenience hook for service detail
export const useServiceDetail = () => {
  const { serviceDetail, getServiceDetail, loading, error } = useServices();
  return { serviceDetail, getServiceDetail, loading, error };
};

// Convenience hook for pagination
export const useServicesPagination = () => {
  const { loadMoreServices, currentPage, totalPages, loading } = useServices();
  return { loadMoreServices, currentPage, totalPages, loading, hasMore: currentPage < totalPages };
};