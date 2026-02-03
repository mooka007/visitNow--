// app/search/results.tsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useServices } from '../context/hooks/useServices';
import { useFavorites } from '../context/hooks/useFavorites';

// ========== TYPES ==========
type SortOption = 'popular' | 'rating' | 'price_low' | 'price_high';

interface SearchParams {
  service?: string;
  query?: string;
  search?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
  rooms?: string;
  from?: string;
  to?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

type ServiceType = 'hotel' | 'car' | 'space' | 'tour' | 'event' | 'flight' | 'boat' | 'all';

// ========== UTILITY FUNCTIONS ==========
const serviceIdToType = (id: string | undefined): ServiceType => {
  if (!id) return 'all';
  if (['hotel', 'car', 'space', 'tour', 'event', 'flight', 'boat', 'all'].includes(id)) {
    return id as ServiceType;
  }
  
  const map: Record<string, ServiceType> = {
    'all': 'all',
    'hotels': 'hotel',
    'tours': 'tour',
    'cars': 'car',
    'flights': 'flight',
    'spaces': 'space',
    'events': 'event',
    'boats': 'boat',
  };
  return map[id] || 'all';
};

const serviceTypeToDisplayName = (type: ServiceType): string => {
  const map: Record<ServiceType, string> = {
    'all': 'Offers',
    'hotel': 'Hotels',
    'tour': 'Tours',
    'car': 'Cars',
    'flight': 'Flights',
    'space': 'Spaces',
    'event': 'Events',
    'boat': 'Boats',
  };
  return map[type];
};

const parsePrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    return parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
  }
  return 0;
};

const sortResults = (services: any[], sortType: SortOption): any[] => {
  const sorted = [...services];
  switch (sortType) {
    case 'rating':
      return sorted.sort((a, b) => {
        const aRating = getReviewScore(a);
        const bRating = getReviewScore(b);
        return bRating - aRating;
      });
    case 'price_low':
      return sorted.sort((a, b) => {
        const aPrice = parsePrice(a.sale_price || a.price);
        const bPrice = parsePrice(b.sale_price || b.price);
        return aPrice - bPrice;
      });
    case 'price_high':
      return sorted.sort((a, b) => {
        const aPrice = parsePrice(a.sale_price || a.price);
        const bPrice = parsePrice(b.sale_price || b.price);
        return bPrice - aPrice;
      });
    case 'popular':
    default:
      return sorted.sort((a, b) => {
        const aReviews = getTotalReviews(a);
        const bReviews = getTotalReviews(b);
        const aRating = getReviewScore(a);
        const bRating = getReviewScore(b);
        if (bRating !== aRating) return bRating - aRating;
        return bReviews - aReviews;
      });
  }
};

const getReviewScore = (service: any): number => {
  if (!service || !service.review_score) return 0;
  if (typeof service.review_score === 'object' && service.review_score.score_total) {
    return parseFloat(service.review_score.score_total) || 0;
  }
  return 0;
};

const getTotalReviews = (service: any): number => {
  if (!service || !service.review_score) return 0;
  if (typeof service.review_score === 'object' && service.review_score.total_review) {
    return service.review_score.total_review || 0;
  }
  return 0;
};

const getLocationName = (service: any): string => {
  if (!service || !service.location) return 'Morocco';
  if (typeof service.location === 'string') return service.location;
  if (service.location.name) return service.location.name;
  return 'Morocco';
};

const getPriceDisplay = (service: any): string => {
  if (!service) return 'Contact';
  const price = service.sale_price || service.price;
  if (!price) return 'Contact';
  return `$${parsePrice(price)}`;
};

// ========== REUSABLE COMPONENTS ==========
interface SearchHeaderProps {
  onBack: () => void;
  onFilter: () => void;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSearchSubmit: () => void;
}

const SearchHeader = React.memo(({
  onBack,
  onFilter,
  searchText,
  onSearchTextChange,
  onSearchSubmit,
}: SearchHeaderProps) => (
  <View style={styles.headerCard}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Feather name="arrow-left" size={20} color="#1A1A1A" />
    </TouchableOpacity>
    <View style={styles.searchBar}>
      <Feather name="search" size={18} color="#666666" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search in results..."
        value={searchText}
        onChangeText={onSearchTextChange}
        placeholderTextColor="#999999"
        onSubmitEditing={onSearchSubmit}
        returnKeyType="search"
      />
    </View>
    <TouchableOpacity style={styles.filterButton} onPress={onFilter}>
      <Feather name="filter" size={20} color="#1A1A1A" />
    </TouchableOpacity>
  </View>
));

SearchHeader.displayName = 'SearchHeader';

interface SortOptionsProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SortOptions = React.memo(({ sortBy, onSortChange }: SortOptionsProps) => {
  const sortOptions = [
    { id: 'popular' as SortOption, label: 'Most Popular' },
    { id: 'rating' as SortOption, label: 'Highest Rated' },
    { id: 'price_low' as SortOption, label: 'Price: Low to High' },
    { id: 'price_high' as SortOption, label: 'Price: High to Low' },
  ];

  return (
    <View style={styles.sortSection}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortOptions}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => onSortChange(option.id)}
            style={[
              styles.sortOption,
              sortBy === option.id && styles.sortOptionActive,
            ]}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === option.id && styles.sortOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

SortOptions.displayName = 'SortOptions';

interface OfferCardProps {
  service: any;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const OfferCard = React.memo(({ service, onPress, isFavorite, onToggleFavorite }: OfferCardProps) => {
  const renderServiceSpecificContent = useCallback(() => {
    const type = service.type?.toLowerCase();
    switch (type) {
      case 'car':
        return (
          <View style={styles.carType}>
            {service.passenger && (
              <View style={styles.detailItem}>
                <Feather name="users" size={14} color="#666666" />
                <Text style={styles.detailText}>{service.passenger} passengers</Text>
              </View>
            )}
            {service.gear && (
              <View style={styles.detailItem}>
                <Feather name="settings" size={14} color="#666666" />
                <Text style={styles.detailText}>{service.gear}</Text>
              </View>
            )}
          </View>
        );
      case 'boat':
        return (
          <View style={styles.tourDetails}>
            {service.max_guest && (
              <View style={styles.detailItem}>
                <Feather name="users" size={14} color="#666666" />
                <Text style={styles.detailText}>Up to {service.max_guest} guests</Text>
              </View>
            )}
            {service.length && (
              <View style={styles.detailItem}>
                <Feather name="anchor" size={14} color="#666666" />
                <Text style={styles.detailText}>{service.length}</Text>
              </View>
            )}
          </View>
        );
      case 'event':
        return (
          <View style={styles.eventDetails}>
            {service.duration && (
              <View style={styles.detailItem}>
                <Feather name="clock" size={14} color="#666666" />
                <Text style={styles.detailText}>{service.duration}</Text>
              </View>
            )}
            {service.start_time && (
              <View style={styles.detailItem}>
                <Feather name="calendar" size={14} color="#666666" />
                <Text style={styles.detailText}>Starts at {service.start_time}</Text>
              </View>
            )}
          </View>
        );
      case 'tour':
        return (
          <View style={styles.tourDetails}>
            {service.duration && (
              <View style={styles.detailItem}>
                <Feather name="clock" size={14} color="#666666" />
                <Text style={styles.detailText}>{service.duration}</Text>
              </View>
            )}
          </View>
        );
      case 'space':
        return (
          <View style={styles.tourDetails}>
            {service.square && (
              <View style={styles.detailItem}>
                <Feather name="maximize" size={14} color="#666666" />
                <Text style={styles.detailText}>{service.square}m²</Text>
              </View>
            )}
            {service.max_guests && (
              <View style={styles.detailItem}>
                <Feather name="users" size={14} color="#666666" />
                <Text style={styles.detailText}>Up to {service.max_guests} guests</Text>
              </View>
            )}
          </View>
        );
      case 'flight':
        return (
          <View style={styles.flightDetails}>
            {service.airport_form && service.airport_to && (
              <>
                <Text style={styles.detailText}>
                  {service.airport_form.name} → {service.airport_to.name}
                </Text>
                {service.duration && (
                  <View style={styles.detailItem}>
                    <Feather name="clock" size={14} color="#666666" />
                    <Text style={styles.detailText}>{service.duration}h</Text>
                  </View>
                )}
              </>
            )}
          </View>
        );
      default:
        return null;
    }
  }, [service]);

  const reviewScore = getReviewScore(service);
  const totalReviews = getTotalReviews(service);

  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.8}>
      {/* Image with Favorite Button */}
      <View style={styles.resultImageContainer}>
        {service.image && (
          <Image
            source={{ uri: service.image }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        )}
        
        {/* Favorite Button - Top Right */}
        <TouchableOpacity
          style={styles.resultFavoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Feather
            name="heart"
            size={20}
            color={isFavorite ? '#FF6B6B' : '#FFFFFF'}
            fill={isFavorite ? '#FF6B6B' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <View style={styles.resultTitleContainer}>
            <Text style={styles.resultName} numberOfLines={2}>
              {service.title}
            </Text>
            <Text style={styles.resultLocation}>
              <Feather name="map-pin" size={14} color="#666666" />
              {getLocationName(service)}
            </Text>
          </View>

          {reviewScore > 0 && (
            <View style={styles.ratingBadge}>
              <Feather name="star" size={12} color="#FFFFFF" />
              <Text style={styles.ratingText}>{reviewScore.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Service-specific content */}
        {renderServiceSpecificContent()}

        <View style={styles.resultFooter}>
          <View>
            <View style={styles.price}>
              <Text style={styles.priceAmount}>{getPriceDisplay(service)}</Text>
              <Text style={styles.pricePeriod}>
                {service.type === 'flight' ? '/person' : service.type === 'event' ? '/ticket' : '/night'}
              </Text>
            </View>
            {totalReviews > 0 && (
              <Text style={styles.reviews}>{totalReviews} reviews</Text>
            )}
          </View>

          <TouchableOpacity style={styles.bookButton} onPress={onPress}>
            <Text style={styles.bookButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

OfferCard.displayName = 'OfferCard';

interface EmptyStateProps {
  onNewSearch: () => void;
}

const EmptyState = React.memo(({ onNewSearch }: EmptyStateProps) => (
  <View style={styles.emptyContainer}>
    <Feather name="search" size={64} color="#CCCCCC" />
    <Text style={styles.emptyTitle}>No results found</Text>
    <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onNewSearch}>
      <Text style={styles.emptyButtonText}>New Search</Text>
    </TouchableOpacity>
  </View>
));

EmptyState.displayName = 'EmptyState';

// ========== MAIN COMPONENT ==========
export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as SearchParams;

  // Use real services and favorites from context
  const { services, loading: servicesLoading } = useServices();
  const { toggleFavorite, isFavorite } = useFavorites();

  // State
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Get service parameter from URL
  const serviceFromParams = params.service || 'all';

  // Memoized parsed parameters
const searchParams = useMemo(() => ({
  service: serviceFromParams,
  query: params.query || params.search || '', // ✅ Handle both 'query' and 'search'
  location: params.location || '',
  maxPrice: params.maxPrice ? parseInt(params.maxPrice) : 999999,
  minRating: params.rating ? parseInt(params.rating) : 0, // ✅ Changed from params.rating
  checkIn: params.checkIn,
  checkOut: params.checkOut,
  startDate: params.startDate || params.checkIn,
  endDate: params.endDate || params.checkOut,
  date: params.date,
  from: params.from,
  to: params.to,
  adults: params.adults ? parseInt(params.adults) : undefined,
  children: params.children ? parseInt(params.children) : undefined,
  rooms: params.rooms ? parseInt(params.rooms) : undefined,
}), [params, serviceFromParams]);


  // Convert service parameter to ServiceType
  const serviceType = useMemo(() => {
    return serviceIdToType(searchParams.service);
  }, [searchParams.service]);

  // Initialize search text with original query
  useEffect(() => {
    if (searchParams.query) {
      setSearchText(searchParams.query);
    }
  }, [searchParams.query]);

  // Update loading state
  useEffect(() => {
    setIsLoading(servicesLoading);
  }, [servicesLoading]);

// ✅ Enhanced Memoized filtered results with detailed debugging
const filteredResults = useMemo(() => {
  if (!services || services.length === 0) {
    console.log('❌ No services available');
    return [];
  }

  let filtered = [...services];
  console.log('🔍 Step 0 - Total services:', filtered.length);

  // Debug: Log service types in the data
  const serviceTypes = new Set(filtered.map(s => (s.type || s.object_model || 'unknown').toLowerCase()));
  console.log('📊 Available service types:', Array.from(serviceTypes));

  // 1️⃣ Filter by service type FIRST
  if (serviceType !== 'all') {
    console.log('🔍 Step 1 - Filtering by service type:', serviceType);
    
    filtered = filtered.filter(service => {
      const type = (service.type || service.object_model || '').toLowerCase();
      const matches = type === serviceType.toLowerCase() || 
                     type.includes(serviceType.toLowerCase());
      
      // Debug first 3 non-matching services
      if (!matches && filtered.length < 63) {
        console.log(`  ❌ Rejected: type="${type}" (looking for "${serviceType}")`);
      }
      
      return matches;
    });
    
    console.log('🔍 Step 1 - After service type filter:', filtered.length);
    
    // If no results, show what types are available
    if (filtered.length === 0) {
      console.log('⚠️ No services match type:', serviceType);
      console.log('💡 Try one of these types:', Array.from(serviceTypes));
      return [];
    }
  }

  // 2️⃣ Filter by search text (searches in title, content, AND location)
if (searchText.trim() !== '') {
  const query = searchText.toLowerCase().trim();
  console.log('🔍 Step 2 - Filtering by search text:', query);
  
  const beforeCount = filtered.length;
  filtered = filtered.filter(service => {
    const title = (service.title || '').toLowerCase();
    const content = (service.content || '').toLowerCase();
    const location = getLocationName(service).toLowerCase();
    
    const matches = title.includes(query) || 
                   content.includes(query) || 
                   location.includes(query);
    
    // ✅ Debug ALL matches to show where they're located
    if (matches) {
      console.log(`  ✅ Found: "${service.title}" in ${getLocationName(service)}`);
    }
    
    return matches;
  });
  
  console.log('🔍 Step 2 - After search text filter:', filtered.length, `(removed ${beforeCount - filtered.length})`);
}

// 3️⃣ Filter by location (from URL params - city selection)
if (searchParams.location && searchParams.location.trim() !== '') {
  const locationQuery = searchParams.location.toLowerCase().trim();
  console.log('🔍 Step 3 - Filtering by location:', locationQuery);
  
  const beforeCount = filtered.length;
  
  // ✅ Show what locations are available before filtering
  console.log('📍 Available locations before filter:');
  filtered.forEach(service => {
    console.log(`  - "${service.title}": ${getLocationName(service)}`);
  });
  
  filtered = filtered.filter(service => {
    const location = getLocationName(service).toLowerCase();
    const matches = location.includes(locationQuery);
    
    if (!matches) {
      console.log(`  ❌ Removed: "${service.title}" (${location} doesn't match ${locationQuery})`);
    }
    
    return matches;
  });
  
  console.log('🔍 Step 3 - After location filter:', filtered.length, `(removed ${beforeCount - filtered.length})`);
  
  // ✅ If no results, suggest available locations
  if (filtered.length === 0 && beforeCount > 0) {
    console.log('💡 Suggestion: The service exists but not in this location');
  }
}


  // 3️⃣ Filter by location (from URL params - city selection)
  if (searchParams.location && searchParams.location.trim() !== '') {
    const locationQuery = searchParams.location.toLowerCase().trim();
    console.log('🔍 Step 3 - Filtering by location:', locationQuery);
    
    const beforeCount = filtered.length;
    filtered = filtered.filter(service => {
      const location = getLocationName(service).toLowerCase();
      return location.includes(locationQuery);
    });
    
    console.log('🔍 Step 3 - After location filter:', filtered.length, `(removed ${beforeCount - filtered.length})`);
  }

  // 4️⃣ Filter by price (max price from slider)
  if (searchParams.maxPrice && searchParams.maxPrice < 999999) {
    console.log('🔍 Step 4 - Filtering by max price:', searchParams.maxPrice);
    
    const beforeCount = filtered.length;
    filtered = filtered.filter(service => {
      const price = parsePrice(service.sale_price || service.price);
      return price <= searchParams.maxPrice;
    });
    
    console.log('🔍 Step 4 - After price filter:', filtered.length, `(removed ${beforeCount - filtered.length})`);
  }

  // 5️⃣ Filter by rating (minimum rating from slider) - ONLY if service has rating
if (searchParams.minRating && searchParams.minRating > 0) {
  console.log('🔍 Step 5 - Filtering by min rating:', searchParams.minRating);
  
  const beforeCount = filtered.length;
  filtered = filtered.filter(service => {
    const rating = getReviewScore(service);
    
    // ✅ OPTION 1: Include unrated services
    if (!rating || rating === 0) return true;
    
    // ✅ OPTION 2: Only apply filter if rating exists
    return rating >= searchParams.minRating;
  });
  
  console.log('🔍 Step 5 - After rating filter:', filtered.length, `(removed ${beforeCount - filtered.length})`);
}


  // 6️⃣ Filter by date availability
  if (searchParams.checkIn && searchParams.checkOut) {
    console.log('🔍 Step 6 - Date filters active:', {
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut
    });
  }

  // 7️⃣ Filter by flight routes (from/to)
  if (searchParams.from || searchParams.to) {
    console.log('🔍 Step 7 - Filtering by flight routes:', {
      from: searchParams.from,
      to: searchParams.to
    });
    
    filtered = filtered.filter(service => {
      if (service.type?.toLowerCase() !== 'flight') return true;
      
      const fromMatch = !searchParams.from || 
        service.airport_form?.name?.toLowerCase().includes(searchParams.from.toLowerCase());
      const toMatch = !searchParams.to || 
        service.airport_to?.name?.toLowerCase().includes(searchParams.to.toLowerCase());
      
      return fromMatch && toMatch;
    });
  }

  // 8️⃣ Filter by guest capacity (for hotels)
  if (searchParams.adults || searchParams.children) {
    const totalGuests = (searchParams.adults || 0) + (searchParams.children || 0);
    console.log('🔍 Step 8 - Filtering by guest capacity:', totalGuests);
    
    filtered = filtered.filter(service => {
      if (service.type?.toLowerCase() !== 'hotel') return true;
      
      const maxGuests = service.max_guest || 999;
      return maxGuests >= totalGuests;
    });
  }

  // 9️⃣ Filter by rooms (for hotels)
  if (searchParams.rooms && searchParams.rooms > 0) {
    console.log('🔍 Step 9 - Filtering by rooms:', searchParams.rooms);
    
    filtered = filtered.filter(service => {
      if (service.type?.toLowerCase() !== 'hotel') return true;
      
      const availableRooms = service.number || service.rooms || 999;
      return availableRooms >= searchParams.rooms;
    });
  }

  console.log('✅ FINAL RESULTS:', filtered.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return filtered;
}, [
  services,
  serviceType,
  searchText,
  searchParams.location,
  searchParams.maxPrice,
  searchParams.minRating,
  searchParams.checkIn,
  searchParams.checkOut,
  searchParams.from,
  searchParams.to,
  searchParams.adults,
  searchParams.children,
  searchParams.rooms
]);
  // Memoized sorted results
  const sortedResults = useMemo(() => {
    return sortResults(filteredResults, sortBy);
  }, [filteredResults, sortBy]);

  // Handle search in results
  const handleSearchInResults = useCallback(() => {
    console.log('Searching for:', searchText);
  }, [searchText]);

  // Handle back to search
  const handleBackToSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  const navigateToOfferDetail = useCallback((service: any) => {
    router.push({
      pathname: '/offers/[id]',
      params: {
        id: service.id.toString(),
        serviceType: service.type || service.object_model
      },
    });
  }, [router]);

  // Memoized results summary
  const resultsSummary = useMemo(() => {
    const locationText = searchParams.location ? ` in ${searchParams.location}` : '';
    const queryText = searchText ? ` for "${searchText}"` : '';
    const displayServiceName = serviceTypeToDisplayName(serviceType);

    return (
      <View style={styles.summary}>
        <View style={styles.resultsHeader}>
          {isLoading ? (
            <Text style={styles.resultsCount}>Loading results...</Text>
          ) : (
            <>
              <Text style={styles.resultsCount}>
                {sortedResults.length} {displayServiceName} found{queryText}{locationText}
              </Text>
              {serviceType !== 'all' && (
                <View style={styles.serviceBadgeInline}>
                  <Text style={styles.serviceBadgeText}>
                    {serviceTypeToDisplayName(serviceType)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        <TouchableOpacity onPress={handleBackToSearch}>
          <Text style={styles.modifySearch}>Modify Search</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, sortedResults.length, serviceType, searchParams.location, searchText, handleBackToSearch]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search Bar */}
      <SearchHeader
        onBack={() => router.back()}
        onFilter={handleBackToSearch}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onSearchSubmit={handleSearchInResults}
      />

      {/* Results Summary */}
      {resultsSummary}

      {/* Sort Options */}
      {!isLoading && sortedResults.length > 0 && (
        <SortOptions sortBy={sortBy} onSortChange={setSortBy} />
      )}

      {/* Results List */}
      <ScrollView style={styles.resultsList}  showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#1014d7" />
            <Text style={styles.emptyText}>Loading Results...</Text>
          </View>
        ) : sortedResults.length === 0 ? (
          <EmptyState onNewSearch={() => router.push('/search')} />
        ) : (
          sortedResults.map((service) => (
            <OfferCard
              key={service.id}
              service={service}
              onPress={() => navigateToOfferDetail(service)}
              isFavorite={isFavorite(service.id)}
              onToggleFavorite={() => toggleFavorite(service.id, service.type)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
     paddingBottom: 80,
    
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    marginHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    height: '100%',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF'
  },
  resultsHeader: {
    flex: 1
  },
  resultsCount: {
    fontSize: 14,
    color: '#666666',
    flex: 1
  },
  modifySearch: {
    fontSize: 14,
    color: '#1014d7',
    fontWeight: '600'
  },
  serviceBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4
  },
  serviceBadgeText: {
    fontSize: 12,
    color: '#1014d7',
    fontWeight: '600'
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  sortLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 12
  },
  sortOptions: {
    gap: 8
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 8
  },
  sortOptionActive: {
    backgroundColor: '#E8F5F0',
    borderColor: '#1014d7'
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666'
  },
  sortOptionTextActive: {
    color: '#1014d7'
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 20,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 24,
    textAlign: 'center'
  },
  emptyButton: {
    backgroundColor: '#1014d7',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden'
  },
  resultImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0E0E0'
  },
  resultFavoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resultContent: {
    padding: 16
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  resultTitleContainer: {
    flex: 1,
    marginRight: 8
  },
  resultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4
  },
  resultLocation: {
    fontSize: 14,
    color: '#666666',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1014d7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  tourDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12
  },
  flightDetails: {
    marginBottom: 12
  },
  eventDetails: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12
  },
  carType: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  detailText: {
    fontSize: 12,
    color: '#666666'
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  price: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1014d7'
  },
  pricePeriod: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 2
  },
  reviews: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2
  },
  bookButton: {
    backgroundColor: '#1014d7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
});
