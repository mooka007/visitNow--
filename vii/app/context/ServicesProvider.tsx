import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { apiService, ServicesApiResponse, ApiService } from '../api/react_native_api';
import {
  ServicesContextType,
  Service,
  ServiceType,
  ServicesState
} from './types/services.types';

export const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

interface ServicesProviderProps {
  children: ReactNode;
}

export const ServicesProvider: React.FC<ServicesProviderProps> = ({ children }) => {
  const [state, setState] = useState<ServicesState>({
    services: [],
    featuredServices: [],
    searchResults: null,
    serviceDetail: null,
    loading: false,
    error: null,
    searchLoading: false,
    totalPages: 0,
    currentPage: 1,
    totalItems: 0,
  });

  // Transform ApiService to our Service type
  const transformApiService = (apiService: ApiService): Service => {
    let serviceType = 'other';

    if (serviceType === 'other') {
      serviceType = apiService.object_model || 'other';
    }

    return {
      ...apiService,
      type: serviceType as ServiceType,
      object_model: serviceType,
    };
  };

  // Transform array of ApiService
  const transformApiServices = (services: ApiService[]): Service[] => {
    return services.map(transformApiService);
  };

  // Fetch all services (WITH PAGINATION + DUPLICATE REMOVAL)
  const fetchServices = useCallback(async (params: any = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const firstResponse = await apiService.getAllServices({
        limit: 150,
        page: 1,
        ...params,
      });

      if (!firstResponse.success) {
        throw new Error(firstResponse.message || 'Failed to fetch services');
      }

      if (!firstResponse.data) {
        throw new Error('No data received');
      }

      const totalPages = firstResponse.data.total_pages || 1;
      const totalItems = firstResponse.data.total || 0;
      let allServices = transformApiServices(firstResponse.data.data);

      // If there are more pages, fetch them all
      if (totalPages > 1) {
        const pagePromises = [];

        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            apiService.getAllServices({
              limit: 20,
              page,
              ...params,
            })
          );
        }

        const responses = await Promise.all(pagePromises);

        responses.forEach((response) => {
          if (response.success && response.data) {
            const pageServices = transformApiServices(response.data.data);
            allServices = [...allServices, ...pageServices];
          }
        });
      }

      // Remove duplicates using Map
      const uniqueServicesMap = new Map();
      allServices.forEach(service => {
        uniqueServicesMap.set(service.id, service);
      });
      const uniqueServices = Array.from(uniqueServicesMap.values());

      setState(prev => ({
        ...prev,
        services: uniqueServices,
        totalPages,
        totalItems: uniqueServices.length,
        currentPage: totalPages,
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch services';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      console.error('❌ Error fetching services:', error);
    }
  }, []);

  // Fetch featured services
  const fetchFeaturedServices = useCallback(async (limit: number = 10) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await apiService.getFeaturedServices(limit);

      if (response.success && response.data) {
        const transformedServices = transformApiServices(response.data.data);
        setState(prev => ({
          ...prev,
          featuredServices: transformedServices,
          loading: false,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching featured services:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Search services
  const searchServices = useCallback(async (query: string, params: any = {}) => {
    try {
      setState(prev => ({ ...prev, searchLoading: true, error: null }));

      const response = await apiService.searchServices(query, {
        limit: 20,
        page: 1,
        ...params,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to search services');
      }

      if (response.data) {
        const transformedServices = transformApiServices(response.data.data);
        setState(prev => ({
          ...prev,
          services: transformedServices,
          searchResults: response.data ?? null,
          totalPages: response.data?.total_pages || 0,
          totalItems: response.data?.total || 0,
          currentPage: 1,
          searchLoading: false,
        }));
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to search services';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        searchLoading: false
      }));
      console.error('Error searching services:', error);
    }
  }, []);

  // 🔥 ENHANCED: Get service detail with detailed logging
  const getServiceDetail = useCallback(async (type: ServiceType, id: number): Promise<Service | null> => {
    try {
      console.log('\n╔════════════════════════════════════════════════════════════');
      console.log('║ 🔍 FETCHING SERVICE DETAIL FROM API');
      console.log('╠════════════════════════════════════════════════════════════');
      console.log('║ Type:', type);
      console.log('║ ID:', id);
      console.log('║ Endpoint:', `${type}/detail/${id}`);
      console.log('╚════════════════════════════════════════════════════════════\n');

      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await apiService.getServiceDetails(type, id);

      console.log('\n╔════════════════════════════════════════════════════════════');
      console.log('║ 📥 RAW API RESPONSE');
      console.log('╠════════════════════════════════════════════════════════════');
      console.log('║ Success:', response.success);
      console.log('║ Has Data:', !!response.data);
      console.log('╚════════════════════════════════════════════════════════════\n');

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch service details');
      }

      if (response.data) {
        console.log('\n╔════════════════════════════════════════════════════════════');
        console.log('║ 📦 COMPLETE API DATA STRUCTURE');
        console.log('╠════════════════════════════════════════════════════════════');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('╚════════════════════════════════════════════════════════════\n');

        console.log('\n╔════════════════════════════════════════════════════════════');
        console.log('║ 👤 CHECKING AUTHOR/SUPPLIER DATA');
        console.log('╠════════════════════════════════════════════════════════════');
        console.log('║ Has author field?:', 'author' in response.data);
        console.log('║ Has author_id field?:', 'author_id' in response.data);
        console.log('║ author value:', response.data.author);
        console.log('║ author_id value:', response.data.author_id);
        console.log('╚════════════════════════════════════════════════════════════\n');

        if (response.data.author) {
          console.log('\n╔════════════════════════════════════════════════════════════');
          console.log('║ ✅ AUTHOR DATA FOUND!');
          console.log('╠════════════════════════════════════════════════════════════');
          console.log('║ Author Object:');
          console.log(JSON.stringify(response.data.author, null, 2));
          console.log('╚════════════════════════════════════════════════════════════\n');
        } else {
          console.log('\n╔════════════════════════════════════════════════════════════');
          console.log('║ ⚠️  NO AUTHOR DATA IN RESPONSE');
          console.log('╠════════════════════════════════════════════════════════════');
          console.log('║ This means your backend is NOT including author data');
          console.log('║ in the detail endpoint response.');
          console.log('║ ');
          console.log('║ 🔧 BACKEND FIX NEEDED:');
          console.log('║ In your Laravel API, check the controller for:');
          console.log(`║   GET /api/${type}/detail/${id}`);
          console.log('║ ');
          console.log('║ Make sure it includes: ->with("author")');
          console.log('║ Example:');
          console.log('║   $service = Service::with("author")->find($id);');
          console.log('╚════════════════════════════════════════════════════════════\n');
        }

        const service = transformApiService(response.data);

        setState(prev => ({
          ...prev,
          serviceDetail: service,
          loading: false
        }));

        return service;
      }

      return null;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch service details';
      console.log('\n╔════════════════════════════════════════════════════════════');
      console.log('║ ❌ ERROR FETCHING SERVICE DETAIL');
      console.log('╠════════════════════════════════════════════════════════════');
      console.log('║ Error:', errorMessage);
      console.log('╚════════════════════════════════════════════════════════════\n');

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      console.error('Error fetching service details:', error);
      return null;
    }
  }, []);

  // Load more services (pagination)
  const loadMoreServices = useCallback(async () => {
    if (state.currentPage >= state.totalPages || state.loading) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const nextPage = state.currentPage + 1;
      const response = await apiService.getAllServices({
        page: nextPage,
        limit: 20,
      });

      if (response.success && response.data) {
        const newServices = transformApiServices(response.data.data);

        // Remove duplicates when adding new services
        const combinedServices = [...state.services, ...newServices];
        const uniqueServicesMap = new Map();
        combinedServices.forEach(service => {
          uniqueServicesMap.set(service.id, service);
        });
        const uniqueServices = Array.from(uniqueServicesMap.values());

        setState(prev => ({
          ...prev,
          services: uniqueServices,
          currentPage: nextPage,
          loading: false,
        }));
      }
    } catch (error: any) {
      console.error('Error loading more services:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.currentPage, state.totalPages, state.loading, state.services]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Refresh all services
  const refreshServices = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await Promise.all([
        fetchServices(),
        fetchFeaturedServices(),
      ]);
    } catch (error: any) {
      console.error('Error refreshing services:', error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchServices, fetchFeaturedServices]);

  // Auto-fetch on initial load
  useEffect(() => {
    refreshServices();
  }, []);

  const value: ServicesContextType = {
    ...state,
    fetchServices,
    fetchFeaturedServices,
    searchServices,
    getServiceDetail,
    loadMoreServices,
    clearError,
    refreshServices,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};



// import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
// import { apiService, ServicesApiResponse, ApiService } from '../api/react_native_api';
// import {
//   ServicesContextType,
//   Service,
//   ServiceType,
//   ServicesState
// } from './types/services.types';

// export const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

// interface ServicesProviderProps {
//   children: ReactNode;
// }

// export const ServicesProvider: React.FC<ServicesProviderProps> = ({ children }) => {
//   const [state, setState] = useState<ServicesState>({
//     services: [],
//     featuredServices: [],
//     searchResults: null,
//     serviceDetail: null,
//     loading: false,
//     error: null,
//     searchLoading: false,
//     totalPages: 0,
//     currentPage: 1,
//     totalItems: 0,
//   });

//   // Transform ApiService to our Service type
//   const transformApiService = (apiService: ApiService): Service => {
//     // Extract service type from terms structure
//     let serviceType = 'other';
    
//     // Check if terms exists and extract service type from first term's parent
//     // if (apiService.terms && typeof apiService.terms === 'object') {
//     //   const firstTermKey = Object.keys(apiService.terms)[0];
//     //   if (firstTermKey && apiService.terms[firstTermKey]?.parent?.service) {
//     //     serviceType = apiService.terms[firstTermKey].parent.service;
//     //   }
//     // }
    
//     // Fallback to other fields if terms doesn't exist
//     if (serviceType === 'other') {
//       serviceType = 
//         apiService.object_model || 
//         // apiService.type || 
//         // apiService.service_type || 
//         'other';
//     }

//     // ✅ Only log if it's a car, hotel, tour, or space
//     const importantTypes = ['car', 'hotel', 'tour', 'space', 'event'];
//     if (importantTypes.includes(serviceType.toLowerCase())) {
//       // console.log(`🎯 FOUND: ${serviceType} - "${apiService.title}" (ID: ${apiService.id})`);
//     }

//     return {
//       ...apiService,
//       type: serviceType as ServiceType,
//       object_model: serviceType,
//     };
//   };


//   // Transform array of ApiService
//   const transformApiServices = (services: ApiService[]): Service[] => {
//     return services.map(transformApiService);
//   };

//   // Fetch all services (WITH PAGINATION + DUPLICATE REMOVAL)
//   const fetchServices = useCallback(async (params: any = {}) => {
//     try {
//       setState(prev => ({ ...prev, loading: true, error: null }));
      
//       const firstResponse = await apiService.getAllServices({
//         limit: 150,
//         page: 1,
//         ...params,
//       });

//       if (!firstResponse.success) {
//         throw new Error(firstResponse.message || 'Failed to fetch services');
//       }

//       if (!firstResponse.data) {
//         throw new Error('No data received');
//       }

//       const totalPages = firstResponse.data.total_pages || 1;
//       const totalItems = firstResponse.data.total || 0;
//       let allServices = transformApiServices(firstResponse.data.data);

//       // console.log(`📊 Fetching ${totalPages} pages with ${totalItems} total services...`);

//       // If there are more pages, fetch them all
//       if (totalPages > 1) {
//         const pagePromises = [];
        
//         // Create promises for pages 2 to totalPages
//         for (let page = 2; page <= totalPages; page++) {
//           pagePromises.push(
//             apiService.getAllServices({
//               limit: 20,
//               page,
//               ...params,
//             })
//           );
//         }

//         // Fetch all pages in parallel
//         const responses = await Promise.all(pagePromises);

//         // Combine all services
//         responses.forEach((response) => {
//           if (response.success && response.data) {
//             const pageServices = transformApiServices(response.data.data);
//             allServices = [...allServices, ...pageServices];
//           }
//         });
//       }

//       // Remove duplicates using Map
//       // Remove duplicates using Map
//     const uniqueServicesMap = new Map();
//     allServices.forEach(service => {
//       uniqueServicesMap.set(service.id, service);
//     });
//     const uniqueServices = Array.from(uniqueServicesMap.values());

//     // ✅ COUNT BY TYPE FOR DEBUGGING
//     const typeCount: Record<string, number> = {};
//     uniqueServices.forEach(service => {
//       const type = service.type || 'unknown';
//       typeCount[type] = (typeCount[type] || 0) + 1;
//     });
//     console.log('\n📦 ALL SERVICES WITH COMPLETE DATA:');
// uniqueServices.forEach(service => {
//   console.log({
//     id: service.id,
//     object_model: service.object_model,
//     type: service.type,
//     title: service.title,
//     price: service.price,
//     sale_price: service.sale_price,
//     discount_percent: service.discount_percent,
//     image: service.image,
//     location: service.location,
//     is_featured: service.is_featured,
//     review_score: service.review_score,
//     // Car-specific fields
//     passenger: service.passenger,
//     gear: service.gear,
//     baggage: service.baggage,
//     door: service.door,
//     // Boat-specific fields
//     max_guest: service.max_guest,
//     cabin: service.cabin,
//     length: service.length,
//     speed: service.speed,
//     // Event-specific fields
//     duration: service.duration,
//     start_time: service.start_time,
//   });
// });
//     // console.log(`\n📈 SERVICE TYPE BREAKDOWN:`);
//     // Object.entries(typeCount)
//     //   .sort((a, b) => b[1] - a[1])
//     //   .forEach(([type, count]) => {
//     //     console.log(`   ${type}: ${count}`);
//     //   });
//     // console.log(`\n✅ TOTAL FETCHED: ${allServices.length}`);
//     // console.log(`✅ UNIQUE SERVICES: ${uniqueServices.length}`);
//     // console.log(`========================================\n`);

//     setState(prev => ({
//       ...prev,
//       services: uniqueServices,
//       totalPages,
//       totalItems: uniqueServices.length,
//       currentPage: totalPages,
//       loading: false,
//     }));

//   } catch (error: any) {
//     const errorMessage = error.message || 'Failed to fetch services';
//     setState(prev => ({
//       ...prev,
//       error: errorMessage,
//       loading: false
//     }));
//     console.error('❌ Error fetching services:', error);
//   }
// }, []);


//   // Fetch featured services
//   const fetchFeaturedServices = useCallback(async (limit: number = 10) => {
//     try {
//       setState(prev => ({ ...prev, loading: true }));

//       const response = await apiService.getFeaturedServices(limit);

//       if (response.success && response.data) {
//         const transformedServices = transformApiServices(response.data.data);
//         setState(prev => ({
//           ...prev,
//           featuredServices: transformedServices,
//           loading: false,
//         }));
//       }
//     } catch (error: any) {
//       console.error('Error fetching featured services:', error);
//       setState(prev => ({ ...prev, loading: false }));
//     }
//   }, []);

//   // Search services
//   const searchServices = useCallback(async (query: string, params: any = {}) => {
//     try {
//       setState(prev => ({ ...prev, searchLoading: true, error: null }));

//       const response = await apiService.searchServices(query, {
//         limit: 20,
//         page: 1,
//         ...params,
//       });

//       if (!response.success) {
//         throw new Error(response.message || 'Failed to search services');
//       }

//       if (response.data) {
//         const transformedServices = transformApiServices(response.data.data);
//         setState(prev => ({
//           ...prev,
//           services: transformedServices,
//           searchResults: response.data ?? null,
//           totalPages: response.data?.total_pages || 0,
//           totalItems: response.data?.total || 0,
//           currentPage: 1,
//           searchLoading: false,
//         }));
//       }
//     } catch (error: any) {
//       const errorMessage = error.message || 'Failed to search services';
//       setState(prev => ({
//         ...prev,
//         error: errorMessage,
//         searchLoading: false
//       }));
//       console.error('Error searching services:', error);
//     }
//   }, []);

//   // Get service detail
//   const getServiceDetail = useCallback(async (type: ServiceType, id: number): Promise<Service | null> => {
//     try {
//       setState(prev => ({ ...prev, loading: true, error: null }));

//       const response = await apiService.getServiceDetails(type, id);

//       if (!response.success) {
//         throw new Error(response.message || 'Failed to fetch service details');
//       }

//       if (response.data) {
//         const service = transformApiService(response.data);
//         setState(prev => ({
//           ...prev,
//           serviceDetail: service,
//           loading: false
//         }));
//         return service;
//       }

//       return null;
//     } catch (error: any) {
//       const errorMessage = error.message || 'Failed to fetch service details';
//       setState(prev => ({
//         ...prev,
//         error: errorMessage,
//         loading: false
//       }));
//       console.error('Error fetching service details:', error);
//       return null;
//     }
//   }, []);

//   // Load more services (pagination)
//   const loadMoreServices = useCallback(async () => {
//     if (state.currentPage >= state.totalPages || state.loading) return;

//     try {
//       setState(prev => ({ ...prev, loading: true }));

//       const nextPage = state.currentPage + 1;
//       const response = await apiService.getAllServices({
//         page: nextPage,
//         limit: 20,
//       });

//       if (response.success && response.data) {
//         const newServices = transformApiServices(response.data.data);
        
//         // Remove duplicates when adding new services
//         const combinedServices = [...state.services, ...newServices];
//         const uniqueServicesMap = new Map<number, Service>();
//         combinedServices.forEach(service => {
//           uniqueServicesMap.set(service.id, service);
//         });
//         const uniqueServices = Array.from(uniqueServicesMap.values());

//         setState(prev => ({
//           ...prev,
//           services: uniqueServices,
//           currentPage: nextPage,
//           loading: false,
//         }));
//       }
//     } catch (error: any) {
//       console.error('Error loading more services:', error);
//       setState(prev => ({ ...prev, loading: false }));
//     }
//   }, [state.currentPage, state.totalPages, state.loading, state.services]);

//   // Clear error
//   const clearError = useCallback(() => {
//     setState(prev => ({ ...prev, error: null }));
//   }, []);

//   // Refresh all services
//   const refreshServices = useCallback(async () => {
//     try {
//       setState(prev => ({ ...prev, loading: true, error: null }));
//       await Promise.all([
//         fetchServices(),
//         fetchFeaturedServices(),
//       ]);
//     } catch (error: any) {
//       console.error('Error refreshing services:', error);
//     } finally {
//       setState(prev => ({ ...prev, loading: false }));
//     }
//   }, [fetchServices, fetchFeaturedServices]);

//   // Auto-fetch on initial load
//   useEffect(() => {
//     refreshServices();
//   }, []);

//   const value: ServicesContextType = {
//     ...state,    
//     fetchServices,
//     fetchFeaturedServices,
//     searchServices,
//     getServiceDetail,
//     loadMoreServices,
//     clearError,
//     refreshServices,
    
//   };

//   return (
//     <ServicesContext.Provider value={value}>
//       {children}
//     </ServicesContext.Provider>
//   );
// };
