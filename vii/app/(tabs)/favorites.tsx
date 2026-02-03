// app/(tabs)/favorites.tsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFavorites } from '../context/hooks/useFavorites';
import { useServices } from '../context/hooks/useServices';

type ServiceType = 'hotel' | 'car' | 'space' | 'tour' | 'event' | 'flight' | 'boat';

interface Service {
  id: ServiceType | 'all';
  name: string;
  icon: string;
}

const SERVICES: Service[] = [
  { id: 'all', name: 'All Favorites', icon: 'grid' },
  { id: 'hotel', name: 'Hotels', icon: 'home' },
  { id: 'tour', name: 'Tours', icon: 'map' },
  { id: 'car', name: 'Cars', icon: 'car' },
  { id: 'space', name: 'Spaces', icon: 'briefcase' },
  { id: 'event', name: 'Events', icon: 'calendar' },
  { id: 'flight', name: 'Flights', icon: 'airplay' },
  { id: 'boat', name: 'Boats', icon: 'anchor' },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, getFavoriteIds, removeFavorite, getCountByType } = useFavorites();
  const { services, loading: servicesLoading } = useServices();
  const [activeService, setActiveService] = React.useState<ServiceType | 'all'>('all');

  // Get real services that are favorited
  const favoriteOffers = React.useMemo(() => {
    if (!services || services.length === 0) return [];
    const favoriteIds = getFavoriteIds();
    return services.filter((service) => favoriteIds.includes(service.id));
  }, [services, favorites]);

  // Filter by active service type
  const filteredOffers = React.useMemo(() => {
    if (activeService === 'all') return favoriteOffers;
    return favoriteOffers.filter((offer) => offer.type?.toLowerCase() === activeService.toLowerCase());
  }, [favoriteOffers, activeService]);

  // Only show service tabs that have favorites
  const visibleServices = SERVICES.filter((service) => {
    if (service.id === 'all') return true;
    return getCountByType(service.id as ServiceType) > 0;
  });

  const handleRemoveFavorite = async (offerId: number) => {
    await removeFavorite(offerId);
  };

  // Helper functions
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
    return `$${typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.-]+/g, '')) || 0}`;
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

  const renderServiceSpecificContent = (offer: any) => {
    const type = offer.type?.toLowerCase();
    switch (type) {
      case 'car':
        return (
          <View style={styles.tourDetails}>
            {offer.passenger && (
              <View style={styles.detailItem}>
                <Feather name="users" size={12} color="#666666" />
                <Text style={styles.detailText}>{offer.passenger} passengers</Text>
              </View>
            )}
            {offer.gear && (
              <View style={styles.detailItem}>
                <Feather name="settings" size={12} color="#666666" />
                <Text style={styles.detailText}>{offer.gear}</Text>
              </View>
            )}
          </View>
        );
      case 'boat':
        return (
          <View style={styles.tourDetails}>
            {offer.max_guest && (
              <View style={styles.detailItem}>
                <Feather name="users" size={12} color="#666666" />
                <Text style={styles.detailText}>Up to {offer.max_guest} guests</Text>
              </View>
            )}
            {offer.length && (
              <View style={styles.detailItem}>
                <Feather name="anchor" size={12} color="#666666" />
                <Text style={styles.detailText}>{offer.length}</Text>
              </View>
            )}
          </View>
        );
      case 'tour':
        return (
          <View style={styles.tourDetails}>
            {offer.duration && (
              <View style={styles.detailItem}>
                <Feather name="clock" size={12} color="#666666" />
                <Text style={styles.detailText}>{offer.duration}</Text>
              </View>
            )}
          </View>
        );
      case 'event':
        return (
          <View style={styles.eventDetails}>
            {offer.duration && (
              <View style={styles.detailItem}>
                <Feather name="clock" size={12} color="#666666" />
                <Text style={styles.detailText}>{offer.duration}</Text>
              </View>
            )}
            {offer.start_time && (
              <View style={styles.detailItem}>
                <Feather name="calendar" size={12} color="#666666" />
                <Text style={styles.detailText}>Starts at {offer.start_time}</Text>
              </View>
            )}
          </View>
        );
      case 'space':
        return (
          <View style={styles.tourDetails}>
            {offer.square && (
              <View style={styles.detailItem}>
                <Feather name="maximize" size={12} color="#666666" />
                <Text style={styles.detailText}>{offer.square}m²</Text>
              </View>
            )}
            {offer.max_guests && (
              <View style={styles.detailItem}>
                <Feather name="users" size={12} color="#666666" />
                <Text style={styles.detailText}>Up to {offer.max_guests} guests</Text>
              </View>
            )}
          </View>
        );
      case 'flight':
        return (
          <View style={styles.flightDetails}>
            {offer.airport_form && offer.airport_to && (
              <>
                <Text style={styles.detailText}>
                  {offer.airport_form.name} → {offer.airport_to.name}
                </Text>
                {offer.duration && (
                  <View style={styles.detailItem}>
                    <Feather name="clock" size={12} color="#666666" />
                    <Text style={styles.detailText}>{offer.duration}h</Text>
                  </View>
                )}
              </>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  // Empty state
  if (servicesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#1014d7" />
          <Text style={styles.emptyText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Favorites</Text>
          <View style={styles.shareButton} />
        </View>

        <View style={styles.emptyState}>
          <Feather name="heart" size={64} color="#CCCCCC" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Save hotels, tours, and experiences you love by tapping the heart icon
          </Text>
          <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/search')}>
            <Feather name="search" size={18} color="#FFFFFF" />
            <Text style={styles.exploreButtonText}>Explore Offers</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={styles.shareButton} />
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {new Set(favorites.map((f) => f.serviceType)).size}
          </Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Feather name="heart" size={24} color="#1014d7" />
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Service Tabs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesContainer}>
          {visibleServices.map((service) => {
            const count =
              service.id === 'all'
                ? favorites.length
                : getCountByType(service.id as ServiceType);

            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceTab,
                  activeService === service.id && styles.serviceTabActive,
                ]}
                onPress={() => setActiveService(service.id)}
              >
                <Feather
                  name={service.icon as any}
                  size={14}
                  color={activeService === service.id ? '#FFFFFF' : '#666666'}
                />
                <Text
                  style={[
                    styles.serviceTabText,
                    activeService === service.id && styles.serviceTabTextActive,
                  ]}
                >
                  {service.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Favorites List */}
      <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.resultsCount}>
            {filteredOffers.length}{' '}
            {activeService === 'all'
              ? 'Favorites'
              : `${activeService.charAt(0).toUpperCase() + activeService.slice(1)}s`}
          </Text>
        </View>

        {filteredOffers.map((offer) => {
          const reviewScore = getReviewScore(offer);
          const totalReviews = getTotalReviews(offer);

          return (
            <TouchableOpacity
              key={offer.id}
              style={styles.resultCard}
              onPress={() => router.push({
                pathname: '/offers/[id]',
                params: { id: offer.id.toString(), serviceType: offer.type }
              })}
            >
              {/* Image */}
              {offer.image ? (
                <Image source={{ uri: typeof offer.image === 'string' ? offer.image : '' }} style={styles.resultImage} resizeMode="cover" />
              ) : (
                <View style={styles.resultImage}>
                  <Feather name="image" size={40} color="#CCCCCC" />
                </View>
              )}

              <View style={styles.resultContent}>
                {/* Header with title and rating */}
                <View style={styles.resultHeader}>
                  <View style={styles.resultTitleContainer}>
                    <Text style={styles.resultName} numberOfLines={2}>
                      {offer.title}
                    </Text>
                    <Text style={styles.resultLocation}>
                      <Feather name="map-pin" size={12} color="#666666" />
                      {getLocationName(offer)}
                    </Text>
                  </View>

                  {reviewScore > 0 && (
                    <View style={styles.ratingBadge}>
                      <Feather name="star" size={10} color="#FFFFFF" />
                      <Text style={styles.ratingText}>{reviewScore.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                {/* Service-specific content */}
                {renderServiceSpecificContent(offer)}

                {/* Footer with price and action */}
                <View style={styles.resultFooter}>
                  <View>
                    <View style={styles.price}>
                      <Text style={styles.priceAmount}>{getPriceDisplay(offer)}</Text>
                      <Text style={styles.pricePeriod}>
                        {offer.type === 'flight' ? '/person' : offer.type === 'event' ? '/ticket' : '/night'}
                      </Text>
                    </View>
                    {totalReviews > 0 && (
                      <Text style={styles.reviews}>{totalReviews} reviews</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(offer.id);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#C41E3A" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Feather name="info" size={18} color="#1014d7" />
          <Text style={styles.tipsText}>
            Tip: Favorites sync across all your devices. Tap the heart icon on any offer to save it here!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES - Matching results.tsx card design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
     paddingHorizontal: 4,
      paddingBottom: 90
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 14,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1014d7',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginVertical: 12,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1014d7',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5E5',
  },
  section: {
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  servicesContainer: {
    paddingHorizontal: 0,
    paddingVertical: 3,
    gap: 6,
  },
  serviceTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 4,
  },
  serviceTabActive: {
    backgroundColor: '#1014d7',
    borderColor: '#1014d7',
  },
  serviceTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  serviceTabTextActive: {
    color: '#FFFFFF',
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    padding: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  resultTitleContainer: {
    flex: 1,
    marginRight: 6,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  resultLocation: {
    fontSize: 13,
    color: '#666666',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1014d7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tourDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  flightDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  eventDetails: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    color: '#666666',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  price: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1014d7',
  },
  pricePeriod: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 2,
  },
  reviews: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeButtonText: {
    color: '#C41E3A',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#1014d7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#E8F5F0',
    marginHorizontal: 0,
    marginBottom: 24,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipsText: {
    fontSize: 13,
    color: '#1014d7',
    flex: 1,
    lineHeight: 18,
  },
});

