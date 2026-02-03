// // hooks/useOffers.ts
// import { useState, useEffect, useCallback } from 'react';
// import { servicesAPI } from '../../api/react_native_api';
// import { ApiResponse, PaginatedResponse, Service } from '../../api/react_native_api';

// export type ServiceType = 'hotel' | 'car' | 'space' | 'tour' | 'event' | 'flight';

// export interface Offer extends Service {
//   serviceType: ServiceType;
//   color?: string;
//   gradient?: string[];
// }

// export const useOffers = () => {
//   const [featuredOffers, setFeaturedOffers] = useState<Offer[]>([]);
//   const [recommendedOffers, setRecommendedOffers] = useState<Offer[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchOffers = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Fetch featured services
//       const featuredResponse: ApiResponse<PaginatedResponse<Service>> = 
//         await servicesAPI.searchAllServices({ 
//           featured: true,
//           limit: 10 
//         });

//       // Fetch recommended services
//       const recommendedResponse: ApiResponse<PaginatedResponse<Service>> = 
//         await servicesAPI.searchAllServices({ 
//           recommended: true,
//           limit: 15 
//         });

//       if (featuredResponse.success && featuredResponse.data) {
//         // Transform services to offers with serviceType
//         const offers: Offer[] = featuredResponse.data.data.map(service => ({
//           ...service,
//           serviceType: (service.type as ServiceType) || 'hotel',
//           color: getColorByServiceType(service.type as ServiceType),
//         }));
//         setFeaturedOffers(offers);
//       }

//       if (recommendedResponse.success && recommendedResponse.data) {
//         const offers: Offer[] = recommendedResponse.data.data.map(service => ({
//           ...service,
//           serviceType: (service.type as ServiceType) || 'hotel',
//           color: getColorByServiceType(service.type as ServiceType),
//         }));
//         setRecommendedOffers(offers);
//       }

//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch offers');
//       console.error('Error fetching offers:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const getColorByServiceType = (serviceType: ServiceType): string => {
//     const colorMap: Record<ServiceType, string> = {
//       hotel: '#FF6B6B',
//       car: '#4ECDC4',
//       space: '#45B7D1',
//       tour: '#96CEB4',
//       event: '#FFEAA7',
//       flight: '#DDA0DD',
//     };
//     return colorMap[serviceType] || '#1014d7';
//   };

//   useEffect(() => {
//     fetchOffers();
//   }, [fetchOffers]);

//   const refetch = () => {
//     fetchOffers();
//   };

//   return {
//     featuredOffers,
//     recommendedOffers,
//     loading,
//     error,
//     refetch
//   };
// };

// // Convenience hook for getting recommended properties
// export const useRecommendedProperties = () => {
//   const { recommendedOffers, loading, error, refetch } = useOffers();
  
//   const recommendedProperties = recommendedOffers.filter(offer => 
//     ['hotel', 'space', 'event'].includes(offer.serviceType)
//   ).slice(0, 8);

//   return {
//     recommendedProperties,
//     loading,
//     error,
//     refetch
//   };
// };