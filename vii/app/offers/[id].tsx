
import MapView, { Marker } from 'react-native-maps';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, FlatList, Share, ActivityIndicator, Modal, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome5, MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useServices } from '../context/hooks/useServices';
import { useFavorites } from '../context/hooks/useFavorites';
import { useBookings } from '../context/hooks/useBookings';
import BookingModal, { BookingFormData } from '../../components/BookingModal';
import ReviewModal, { ReviewData } from '../../components/ReviewModal';
import { reviewsAPI, bookingAPI } from '../api/react_native_api';
import { useAuth } from '../context/hooks/useAuth';
import CheckoutModal from '../../components/CheckoutModal';


const { width: screenWidth } = Dimensions.get('window');

// Service type colors
const SERVICE_COLORS: Record<string, string> = {
  hotel: '#FF6B6B',
  car: '#4ECDC4',
  space: '#45B7D1',
  tour: '#96CEB4',
  event: '#FFEAA7',
  flight: '#DDA0DD',
  boat: '#87CEEB',
};

// Interfaces
interface Term {
  id: number;
  title: string;
  content?: string | null;
  image_id?: string | null;
  icon?: string | null;
  slug?: string;
}

interface TermCategory {
  parent: {
    id: number;
    title: string;
    slug: string;
    service: string;
    display_type?: string | null;
    hide_in_single?: number | null;
  };
  child: Term[];
}

interface BookingFee {
  name: string;
  desc: string;
  price: string | number;
  unit: string;
  type: string;
}

interface ExtraPrice {
  name: string;
  price: string;
  type: string;
}

interface Policy {
  title: string;
  content: string;
}

interface ItineraryItem {
  image_id: string;
  title: string;
  desc: string;
  content: string;
  image: string;
}

interface InclusionExclusion {
  title: string;
}

interface TicketType {
  code: string;
  name: string;
  price: string;
  number: string;
}

interface RelatedService {
  id: number;
  object_model: string;
  title: string;
  price: string | number;
  sale_price: string | number | null;
  image: string;
  location: { id: number; name: string };
  review_score?: {
    score_total: string;
    total_review: number;
    review_text?: string;
  };
  type?: string;
}

export default function OfferDetailScreen() {
  const { id, serviceType } = useLocalSearchParams<{ id: string; serviceType: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'features' | 'reviews' | 'location' | 'itinerary' | 'policies'>('overview');
  const flatListRef = useRef<FlatList>(null);
  const { services, loading, getServiceDetail } = useServices();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addBooking, completeCheckout  } = useBookings();
  const [service, setService] = useState<any>(null);
  const [relatedServices, setRelatedServices] = useState<RelatedService[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [expandedItineraryDay, setExpandedItineraryDay] = useState<number | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    bookingCode: string;
    bookingDetails: any;
  } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);


  // Fetch service detail
  useEffect(() => {
    const fetchServiceDetail = async () => {
      if (!id || !serviceType) return;

      try {
        setLoadingDetail(true);
        const detailData = await getServiceDetail(serviceType as any, parseInt(id));

        if (detailData) {
          setService(detailData);
          
          // Use API related services if available, otherwise filter from context
          if (detailData.related && Array.isArray(detailData.related)) {
            const formattedRelated = detailData.related.map((item: any) => ({
              ...item,
              type: item.object_model || serviceType
            }));
            setRelatedServices(formattedRelated);
          } else if (services && services.length > 0) {
            const related = services
              .filter((s) => s.type === serviceType && s.id !== parseInt(id))
              .slice(0, 4);
            setRelatedServices(related);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching service details:', error);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchServiceDetail();
  }, [id, serviceType, getServiceDetail]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!service || !service.id || !service.type) return;

      try {
        setLoadingReviews(true);
        
        // Check review_lists.data field first
        if (service.review_lists?.data && Array.isArray(service.review_lists.data)) {
          setReviews(service.review_lists.data);
          setLoadingReviews(false);
          return;
        }

        // If not, try fetching from API
        const response = await reviewsAPI.getReviews(service.type, service.id, { limit: 50 });
        
        if (response.success && response.data) {
          let reviewsData: any[] = [];
          if (Array.isArray(response.data)) {
            reviewsData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            reviewsData = response.data.data;
          }
          setReviews(reviewsData);
        } else {
          setReviews([]);
        }
      } catch (error: any) {
        console.error('❌ Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [service]);

  const handleFavoriteToggle = async () => {
    if (!service) return;
    await toggleFavorite(service.id, service.type);
  };

  const handleShare = async () => {
    if (!service) return;
    try {
      const message = `Check out this ${service.type}!\n\n${service.title}\n📍 ${getLocationName(service)}\n💰 ${getPriceDisplay(service)}\n\nView details: https://visitmorocconow.net/offers/${service.id}`;
      await Share.share({ message, title: `Check out this ${service.type}` });
    } catch (error: any) {
      console.error('Share error:', error);
    }
  };

  const handleBook = () => {
    setShowBookingModal(true);
  };

// Update handleConfirmBooking
const handleConfirmBooking = async (bookingData: BookingFormData) => {
  if (!service) return;

  try {
    const formatDateToYMD = (date?: Date): string | undefined => {
      if (!date) return undefined;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const basePrice = service.sale_price || service.price || '0';
    const priceNumber = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;
    
    let totalPrice = priceNumber * bookingData.adults;
    
    if (service.type === 'hotel' && bookingData.checkIn && bookingData.checkOut) {
      const nights = Math.ceil(
        (bookingData.checkOut.getTime() - bookingData.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalPrice = priceNumber * nights * bookingData.rooms;
    }

    const getLocationName = (service: any): string => {
      return service.location?.name || service.address || 'Unknown Location';
    };

    const getPricePeriod = (serviceType: string): string => {
      const periods: Record<string, string> = {
        hotel: 'per night',
        tour: 'per person',
        car: 'per day',
        boat: 'per day',
        event: 'per ticket',
        flight: 'per person',
        space: 'per day',
      };
      return periods[serviceType?.toLowerCase()] || 'per booking';
    };

    // ✅ Get room ID for hotels (you might need to get this from service detail)
    // const roomId = service.type === 'hotel' && service.rooms && service.rooms.length > 0 
    //   ? service.rooms[0].id 
    //   : undefined;

    const bookingCode = await addBooking({
      offerId: service.id,
      serviceType: service.object_model || service.type,
      offerTitle: service.title,
      offerImage: typeof service.image === 'string' ? service.image : '',
      offerLocation: getLocationName(service),
      price: basePrice.toString(),
      pricePeriod: getPricePeriod(service.object_model || service.type),
      totalPrice: totalPrice.toFixed(2),
      
      roomId: bookingData.selectedRoomId,
       // ✅ boat duration (needed by provider to build payload)
      boatDurationType: bookingData.boatDurationType,
      boatDurationValue: bookingData.boatDurationValue,
          guests: {
            adults: bookingData.adults,
            children: bookingData.children,
            rooms: bookingData.rooms,
          },
          dates: {
            checkIn: formatDateToYMD(bookingData.checkIn),
            checkOut: formatDateToYMD(bookingData.checkOut),
            date: formatDateToYMD(bookingData.date),
            time: bookingData.time,
            returnTime: bookingData.returnTime,
          },
          userDetails: {
            name: bookingData.name,
            email: bookingData.email,
            phone: bookingData.phone,
          },
          specialRequests: bookingData.specialRequests,
        });

    setShowBookingModal(false);
    
    let datesText = '';
    if (bookingData.checkIn && bookingData.checkOut) {
      datesText = `${bookingData.checkIn.toLocaleDateString()} - ${bookingData.checkOut.toLocaleDateString()}`;
    } else if (bookingData.date) {
      datesText = bookingData.date.toLocaleDateString();
    }

    setCheckoutData({
      bookingCode,
      bookingDetails: {
        title: service.title,
        price: totalPrice.toFixed(2),
        dates: datesText,
        guests: `${bookingData.adults} adult${bookingData.adults > 1 ? 's' : ''}${bookingData.children > 0 ? `, ${bookingData.children} child${bookingData.children > 1 ? 'ren' : ''}` : ''}`,
      },
    });
    
    setShowCheckoutModal(true);
    
  } catch (error) {
    console.error('Booking failed:', error);
    let errorMessage = 'Failed to create booking. Please try again.';
    if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
      errorMessage = (error as any).message;
    }
    Alert.alert('Error', errorMessage);
  }
};


// ✅ Add checkout handler
const handleCompleteCheckout = async (checkoutFormData: any) => {
  if (!checkoutData) return;

  try {
    // 1) show loading overlay inside CheckoutModal
    setCheckoutLoading(true);

    // 2) wait until API confirms
    await completeCheckout(checkoutData.bookingCode, checkoutFormData);

    // 3) hide loading overlay
    setCheckoutLoading(false);

    // 4) close modal + alert + navigate
    setShowCheckoutModal(false);

    // small delay so modal fully closes before alert (prevents “late” alert sometimes)
    setTimeout(() => {
      Alert.alert('Success', 'Your booking has been confirmed!');
      router.push('/(tabs)/mybooking');
    }, 200);
  } catch (error: any) {
    setCheckoutLoading(false);
    console.error('Checkout failed:', error);
    Alert.alert('Error', error.message || 'Failed to complete checkout');
  }
};


  const handleSubmitReview = async (reviewData: ReviewData) => {
    try {
      if (!isAuthenticated) {
        Alert.alert('Login Required', 'Please login to submit a review', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]);
        throw new Error('User not authenticated');
      }

      const response = await reviewsAPI.writeReview(
        reviewData.serviceType,
        reviewData.serviceId,
        { rate: reviewData.rating, content: reviewData.comment }
      );

      if (response.success && response.data) {
        const newReview = {
          id: response.data.id || Date.now(),
          rate: response.data.rate || reviewData.rating,
          content: response.data.content || reviewData.comment,
          title: user?.name || 'You',
          author: { name: user?.name || 'You', avatar: user?.avatar },
          created_at: response.data.created_at || new Date().toISOString(),
        };

        setReviews((prev) => [newReview, ...prev]);
        Alert.alert('Success', 'Your review has been submitted!');
      } else {
        throw new Error(response.message || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
      throw error;
    }
  };

  const handleOpenMaps = () => {
    if (!service?.map_lat || !service?.map_lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${service.map_lat},${service.map_lng}`;
    Linking.openURL(url);
  };

  // Helper functions
  const getPriceDisplay = (svc: any) => {
    if (!svc) return 'Contact for price';
    if (svc.sale_price && svc.sale_price != svc.price && svc.sale_price !== 0 && svc.sale_price !== '0.00') {
      return `DH ${svc.sale_price}`;
    }
    return svc.price ? `DH ${svc.price}` : 'Contact for price';
  };

  const getOriginalPrice = (svc: any) => {
    if (!svc || !svc.sale_price || svc.sale_price === svc.price || svc.sale_price === 0 || svc.sale_price === '0.00') return null;
    return `DH ${svc.price}`;
  };

  const getLocationName = (svc: any) => {
    if (!svc || !svc.location) return 'Location not specified';
    if (typeof svc.location === 'string') return svc.location;
    if (svc.location.name) return svc.location.name;
    return 'Location not specified';
  };

  const getReviewScore = (svc: any) => {
    if (!svc || !svc.review_score) return 0;
    if (typeof svc.review_score === 'object' && svc.review_score.score_total) {
      return parseFloat(svc.review_score.score_total);
    }
    return 0;
  };

  const getTotalReviews = (svc: any) => {
    if (!svc || !svc.review_score) return 0;
    if (typeof svc.review_score === 'object' && svc.review_score.total_review) {
      return svc.review_score.total_review;
    }
    return 0;
  };

  // FIXED: Added null check for service type
  const getServiceColor = (type: string | undefined) => {
    if (!type) return '#1014d7';
    return SERVICE_COLORS[type.toLowerCase()] || '#1014d7';
  };

  const getPricePeriod = (type: string | undefined) => {
    if (!type) return 'night';
    switch (type.toLowerCase()) {
      case 'hotel': return 'night';
      case 'tour': return 'person';
      case 'event': return 'ticket';
      case 'space': return 'night';
      case 'boat': return 'hour';
      case 'car': return 'day';
      case 'flight': return 'person';
      default: return 'night';
    }
  };

  const stripHtmlTags = (html: string) => {
    return html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  // ==================== RENDER SERVICE TYPE INFO ====================
  const renderServiceTypeInfo = () => {
    if (!service) return null;

    const typeFields: { [key: string]: Array<{ icon: string; label: string; value: any }> } = {
      hotel: [
        { icon: 'star', label: 'Star Rating', value: service.star_rate ? `${service.star_rate}★` : null },
        { icon: 'time-outline', label: 'Check-in', value: service.check_in_time },
        { icon: 'time-outline', label: 'Check-out', value: service.check_out_time },
      ],
      car: [
        { icon: 'people-outline', label: 'Passengers', value: service.passenger },
        { icon: 'settings-outline', label: 'Gear', value: service.gear },
        { icon: 'briefcase-outline', label: 'Baggage', value: service.baggage },
        { icon: 'car-outline', label: 'Doors', value: service.door },
      ],
      boat: [
        { icon: 'people-outline', label: 'Max Guests', value: service.max_guest },
        { icon: 'bed-outline', label: 'Cabins', value: service.cabin },
        { icon: 'resize-outline', label: 'Length', value: service.length },
        { icon: 'speedometer-outline', label: 'Speed', value: service.speed },
      ],
      tour: [
        { icon: 'time-outline', label: 'Duration', value: service.duration },
        { icon: 'people-outline', label: 'Min People', value: service.min_people },
        { icon: 'people-outline', label: 'Max People', value: service.max_people },
        { icon: 'grid-outline', label: 'Category', value: service.category?.name },
      ],
      space: [
        { icon: 'people-outline', label: 'Max Guests', value: service.max_guests },
        { icon: 'bed-outline', label: 'Beds', value: service.bed },
        { icon: 'water-outline', label: 'Bathrooms', value: service.bathroom },
        { icon: 'square-outline', label: 'Area', value: service.square ? `${service.square} m²` : null },
      ],
      event: [
        { icon: 'time-outline', label: 'Duration', value: service.duration },
        { icon: 'time-outline', label: 'Start Time', value: service.start_time },
      ],
    };

    const fields = typeFields[service.type?.toLowerCase()] || [];
    const validFields = fields.filter(field => field.value !== null && field.value !== undefined && field.value !== '');
    
    if (validFields.length === 0) return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>{service.type === 'hotel' ? 'Hotel Details' : 'Service Details'}</Text>
        <View style={styles.typeInfoGrid}>
          {validFields.map((field, index) => (
            <View key={index} style={styles.typeInfoItem}>
              <Ionicons name={field.icon as any} size={24} color={getServiceColor(service.type)} />
              <Text style={styles.typeInfoLabel}>{field.label}</Text>
              <Text style={styles.typeInfoValue}>{field.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ==================== RENDER EXTRA PRICES ====================
  const renderExtraPrices = () => {
    if (!service?.extra_price || !Array.isArray(service.extra_price) || service.extra_price.length === 0) return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Extra Services</Text>
        {service.extra_price.map((extra: ExtraPrice, index: number) => (
          <View key={index} style={styles.extraPriceItem}>
            <View style={styles.extraPriceHeader}>
              <Text style={styles.extraPriceName}>{extra.name}</Text>
              <Text style={styles.extraPriceValue}>DH {extra.price}</Text>
            </View>
            <Text style={styles.extraPriceType}>
              {extra.type === 'one_time' ? 'One-time fee' : 'Per day'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // ==================== RENDER TICKET TYPES (EVENTS) ====================
  const renderTicketTypes = () => {
    if (service?.type?.toLowerCase() !== 'event' || !service.ticket_types || service.ticket_types.length === 0) return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Ticket Options</Text>
        {service.ticket_types.map((ticket: TicketType, index: number) => (
          <View key={index} style={styles.ticketItem}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketName}>{ticket.name}</Text>
              <Text style={styles.ticketPrice}>DH {ticket.price}</Text>
            </View>
            <Text style={styles.ticketAvailable}>
              Available: {ticket.number} tickets
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // ==================== RENDER TOUR INCLUSIONS & EXCLUSIONS ====================
  const renderTourInclusionsExclusions = () => {
    if (service?.type?.toLowerCase() !== 'tour') return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>What is Included & Excluded</Text>
        
        {service.include && service.include.length > 0 && (
          <View style={styles.inclusionExclusionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.sectionSubtitle}>Included</Text>
            </View>
            <View style={styles.listContainer}>
              {service.include.map((item: InclusionExclusion, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                  <Text style={styles.listItemText}>{item.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {service.exclude && Object.keys(service.exclude).length > 0 && (
          <View style={styles.inclusionExclusionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              <Text style={styles.sectionSubtitle}>Excluded</Text>
            </View>
            <View style={styles.listContainer}>
              {Object.values(service.exclude).map((item: any, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="close" size={16} color="#FF6B6B" />
                  <Text style={styles.listItemText}>{item.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // ==================== RENDER TOUR ITINERARY ====================
  const renderTourItinerary = () => {
    if (service?.type?.toLowerCase() !== 'tour' || !service?.itinerary || !Array.isArray(service.itinerary) || service.itinerary.length === 0) {
      return null;
    }

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Tour Itinerary</Text>
        <Text style={styles.itineraryDescription}>
          Follow this day-by-day plan to make the most of your experience
        </Text>
        
        {service.itinerary.map((day: ItineraryItem, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.itineraryDay,
              expandedItineraryDay === index && styles.itineraryDayExpanded
            ]}
            onPress={() => setExpandedItineraryDay(expandedItineraryDay === index ? null : index)}
            activeOpacity={0.7}
          >
            <View style={styles.itineraryHeader}>
              <View style={styles.itineraryDayNumber}>
                <Text style={styles.itineraryDayNumberText}>Day {index + 1}</Text>
              </View>
              <View style={styles.itineraryHeaderContent}>
                <Text style={styles.itineraryDayTitle}>{day.title}</Text>
                <Text style={styles.itineraryDayDesc}>{day.desc}</Text>
              </View>
              <Ionicons 
                name={expandedItineraryDay === index ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </View>
            
            {expandedItineraryDay === index && (
              <View style={styles.itineraryContent}>
                {day.image && (
                  <Image 
                    source={{ uri: day.image }} 
                    style={styles.itineraryImage} 
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.itineraryContentText}>{day.content}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ==================== RENDER REVIEW STATS BREAKDOWN ====================
  const renderReviewStats = () => {
    if (!service?.review_score?.rate_score) return null;

    const rateScore = service.review_score.rate_score;
    const reviewStats = service.review_stats || ['Service', 'Organization', 'Friendliness', 'Area Expert', 'Safety'];

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Review Breakdown</Text>
        <View style={styles.reviewStatsContainer}>
          {Object.entries(rateScore).map(([rating, data]: [string, any], index) => {
            const statLabel = reviewStats[index] || data.title || `Rating ${rating}`;
            return (
              <View key={rating} style={styles.reviewStatItem}>
                <View style={styles.reviewStatHeader}>
                  <Text style={styles.reviewStatLabel}>{statLabel}</Text>
                  <Text style={styles.reviewStatValue}>{data.percent}%</Text>
                </View>
                <View style={styles.reviewStatBarContainer}>
                  <View 
                    style={[
                      styles.reviewStatBar, 
                      { width: `${data.percent}%`, backgroundColor: getServiceColor(service.type) }
                    ]} 
                  />
                </View>
                <Text style={styles.reviewStatCount}>{data.total} reviews</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ==================== RENDER FEATURES (TERMS) ====================
  const renderFeatures = () => {
    if (!service?.terms || Object.keys(service.terms).length === 0) {
      return (
        <View style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No features available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Features</Text>
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {Object.entries(service.terms).map(([key, termCategory]: [string, any]) => {
            const category = termCategory as TermCategory;
            return (
              <View key={key} style={styles.featureCategoryContainer}>
                <Text style={styles.featureCategoryTitle}>{category.parent.title}</Text>
                <View style={styles.featuresGrid}>
                  {category.child.map((term: Term) => (
                    <View key={term.id} style={styles.featureItem}>
                      {term.image_id ? (
                        <Image source={{ uri: term.image_id }} style={styles.featureIcon} />
                      ) : term.icon ? (
                        <FontAwesome5 name={term.icon.replace('icofont-', '')} size={20} color={getServiceColor(service.type)} />
                      ) : (
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      )}
                      <Text style={styles.featureText}>{term.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ==================== RENDER POLICIES ====================
  const renderPolicies = () => {
    if (!service) return null;

    const policies = [];
    
    // Hotel policies
    if (service.type?.toLowerCase() === 'hotel' && service.policy && Array.isArray(service.policy)) {
      service.policy.forEach((policy: Policy, index: number) => {
        policies.push(
          <View key={`policy-${index}`} style={styles.titleCard}>
            <Text style={styles.sectionTitle}>{policy.title}</Text>
            <Text style={styles.policyText}>{policy.content}</Text>
          </View>
        );
      });
    }

    // Boat cancellation policy
    if (service.type?.toLowerCase() === 'boat' && service.cancel_policy) {
      policies.push(
        <View key="cancel" style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>{service.cancel_policy}</Text>
        </View>
      );
    }

    // Terms information
    if (service.terms_information) {
      policies.push(
        <View key="terms" style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.policyText}>{stripHtmlTags(service.terms_information)}</Text>
        </View>
      );
    }

    return policies.length > 0 ? policies : null;
  };

  // ==================== RENDER BOOKING FEES ====================
  const renderBookingFees = () => {
    if (!service?.booking_fee || service.booking_fee.length === 0) return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Booking Fees</Text>
        {service.booking_fee.map((fee: BookingFee, index: number) => (
          <View key={index} style={styles.feeItem}>
            <View style={styles.feeHeader}>
              <Text style={styles.feeName}>{fee.name}</Text>
              <Text style={styles.feePrice}>
                DH {typeof fee.price === 'number' ? fee.price : parseFloat(fee.price as string).toFixed(0)}
              </Text>
            </View>
            {fee.desc && <Text style={styles.feeDesc}>{fee.desc}</Text>}
            <Text style={styles.feeType}>
              {fee.type === 'one_time' ? 'One-time fee' : 'Recurring'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // ==================== RENDER RELATED SERVICES ====================
  const renderRelatedServices = () => {
    if (!relatedServices || relatedServices.length === 0) return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Related Services</Text>
        <FlatList
          horizontal
          data={relatedServices}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const priceText = item.sale_price && item.sale_price !== 0 && item.sale_price !== '0.00' 
              ? `DH ${item.sale_price}` 
              : `DH ${item.price}`;
            
            const originalPriceText = item.sale_price && item.sale_price !== 0 && item.sale_price !== '0.00' && item.sale_price !== item.price
              ? `DH ${item.price}`
              : '';

            const reviewScore = item.review_score?.score_total ? parseFloat(item.review_score.score_total).toFixed(1) : '0.0';
            const totalReviews = item.review_score?.total_review || 0;

            return (
              <TouchableOpacity
                style={styles.relatedServiceCard}
                onPress={() => router.push(`/offers/${item.id}?serviceType=${item.type || service?.type}`)}
              >
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/200' }}
                  style={styles.relatedServiceImage}
                />
                <View style={styles.relatedServiceInfo}>
                  <Text style={styles.relatedServiceTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.relatedServiceLocation}>{item.location?.name || getLocationName(item)}</Text>
                  
                  <View style={styles.relatedServiceRating}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.relatedServiceRatingText}>{reviewScore}</Text>
                    <Text style={styles.relatedServiceReviews}>({totalReviews})</Text>
                  </View>
                  
                  <View style={styles.relatedServicePriceRow}>
                    {originalPriceText ? (
                      <Text style={styles.relatedServiceOriginalPrice}>{originalPriceText}</Text>
                    ) : null}
                    <Text style={styles.relatedServicePrice}>{priceText}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // ==================== RENDER FAQs ====================
  const renderFAQs = () => {
    if (!service?.faqs || service.faqs.length === 0) return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {service.faqs.map((faq: any, index: number) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{faq.title}</Text>
            <Text style={styles.faqAnswer}>{faq.content}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ==================== RENDER CONTENT (Description) ====================
  const renderContent = () => {
    if (!service?.content) return null;

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{stripHtmlTags(service.content)}</Text>
      </View>
    );
  };

  // ==================== RENDER ITINERARY TAB ====================
  const renderItineraryTab = () => {
    if (service?.type?.toLowerCase() !== 'tour') {
      return (
        <View style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Itinerary</Text>
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No itinerary available for this service type</Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {renderTourItinerary()}
        {renderTourInclusionsExclusions()}
      </ScrollView>
    );
  };

  // ==================== RENDER POLICIES TAB ====================
  const renderPoliciesTab = () => {
    const policies = renderPolicies();
    
    if (!policies) {
      return (
        <View style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Policies</Text>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No policies available</Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {policies}
      </ScrollView>
    );
  };

  // ==================== RENDER OVERVIEW TAB ====================
  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Content (Description) */}
      {renderContent()}

      {/* Service Type Info */}
      {renderServiceTypeInfo()}

      {/* Extra Prices */}
      {renderExtraPrices()}

      {/* Ticket Types (Events) */}
      {renderTicketTypes()}

      {/* Tour Inclusions & Exclusions */}
      {renderTourInclusionsExclusions()}

      {/* Tour Itinerary Preview */}
      {service?.type?.toLowerCase() === 'tour' && service?.itinerary && service.itinerary.length > 0 && (
        <View style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Itinerary Preview</Text>
          <Text style={styles.previewText}>
            {service.itinerary.length}-day tour with detailed daily activities
          </Text>
          <TouchableOpacity 
            style={styles.viewItineraryButton}
            onPress={() => setSelectedTab('itinerary')}
          >
            <Text style={styles.viewItineraryButtonText}>View Full Itinerary</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Booking Fees */}
      {renderBookingFees()}

      {/* Review Stats Breakdown */}
      {renderReviewStats()}

      {/* FAQs */}
      {renderFAQs()}

      {/* Related Services */}
      {renderRelatedServices()}

      {/* Policies (if not too many) */}
      {service?.type?.toLowerCase() !== 'hotel' && renderPolicies()}
    </ScrollView>
  );

  // ==================== RENDER LOCATION TAB ====================
 const renderLocationTab = () => {
  if (!service?.map_lat || !service?.map_lng) {
    return (
      <View style={styles.tabContentContainer}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>Location not available</Text>
        </View>
      </View>
    );
  }

  const latitude = parseFloat(service.map_lat);
  const longitude = parseFloat(service.map_lng);

  return (
    <View style={styles.tabContentContainer}>
      <Text style={styles.sectionTitle}>Location</Text>
      
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: latitude,
            longitude: longitude,
          }}
          title={service.title}
          description={service.address || getLocationName(service)}
        />
      </MapView>

      <View style={styles.addressContainer}>
        <Ionicons name="location-outline" size={24} color="#007AFF" />
        <Text style={styles.addressText}>
          {service.address || getLocationName(service)}
        </Text>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleOpenMaps}
        >
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  // ==================== RENDER REVIEWS TAB ====================
  const renderReviewsTab = () => {
    if (loadingReviews) {
      return (
        <View style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.loadingReviews}>
            <ActivityIndicator size="small" color={getServiceColor(service?.type)} />
            <Text style={styles.loadingTextSmall}>Loading reviews...</Text>
          </View>
        </View>
      );
    }

    if (reviews.length === 0) {
      return (
        <View style={styles.titleCard}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No reviews yet</Text>
            <TouchableOpacity 
              style={styles.addReviewButton}
              onPress={() => setShowAddReviewModal(true)}
            >
              <Text style={styles.addReviewButtonText}>Be the first to review</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.titleCard}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        
        {/* Review Stats Summary */}
        {renderReviewStats()}
        
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {/* Add Review Button */}
          <TouchableOpacity 
            style={styles.addReviewButton}
            onPress={() => setShowAddReviewModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addReviewButtonText}>Write a Review</Text>
          </TouchableOpacity>
          
          {/* Reviews List */}
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Image
                  source={{ uri: review.author?.avatar || 'https://via.placeholder.com/50' }}
                  style={styles.reviewAvatar}
                />
                <View style={styles.reviewHeaderText}>
                  <Text style={styles.reviewAuthor}>{review.author?.name || review.title || 'Anonymous'}</Text>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < (review.rate_number || review.rate || 5) ? 'star' : 'star-outline'}
                        size={16}
                        color="#FFB800"
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>
                  {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently'}
                </Text>
              </View>
              {review.title && review.title !== review.author?.name && <Text style={styles.reviewTitle}>{review.title}</Text>}
              <Text style={styles.reviewContent}>{review.content || review.comment || 'No content'}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Service-specific tabs
  const getAvailableTabs = () => {
    if (!service) return ['overview', 'features', 'reviews', 'location'];
    
    const baseTabs = ['overview', 'features', 'reviews', 'location'] as const;
    const additionalTabs = [];
    
    if (service.type?.toLowerCase() === 'tour' && service?.itinerary && service.itinerary.length > 0) {
      additionalTabs.push('itinerary');
    }
    
    if ((service.type?.toLowerCase() === 'hotel' && service?.policy) || 
        (service.type?.toLowerCase() === 'boat' && service?.cancel_policy) ||
        service?.terms_information) {
      additionalTabs.push('policies');
    }
    
    return [...baseTabs, ...additionalTabs];
  };

  const renderServiceSpecificDetails = () => {
    if (!service) return null;

    const availableTabs = getAvailableTabs();

    return (
      <>
        <View style={styles.tabBarCard}>
          <View style={styles.tabBar}>
            {availableTabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.tabActive]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.tabContentContainer}>
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'itinerary' && renderItineraryTab()}
          {selectedTab === 'features' && renderFeatures()}
          {selectedTab === 'reviews' && renderReviewsTab()}
          {selectedTab === 'location' && renderLocationTab()}
          {selectedTab === 'policies' && renderPoliciesTab()}
        </View>
      </>
    );
  };

  // Loading state
  if (loading || loadingDetail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1014d7" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  // Error state
  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorCard}>
          <Feather name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Service not found</Text>
          <TouchableOpacity style={styles.backToHomeButton} onPress={() => router.push('/')}>
            <Text style={styles.backToHomeText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const serviceColor = getServiceColor(service.type);
  const isFav = isFavorite(service.id);
  const images = service.gallery?.filter((img: string) => img) || (service.image ? [service.image] : []);
  const reviewScore = getReviewScore(service);
  const totalReviews = getTotalReviews(service);
  const originalPrice = getOriginalPrice(service);
  const pricePeriod = getPricePeriod(service.type);

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageSlide}>
      <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
      <View style={[styles.serviceBadge, { backgroundColor: serviceColor }]}>
        <Text style={styles.serviceBadgeText}>{service.type?.toUpperCase()}</Text>
      </View>
      {service.discount_percent && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{service.discount_percent} OFF</Text>
        </View>
      )}
    </View>
  );

  const renderDotIndicator = () => {
    if (images.length <= 1) return null;
    return (
      <View style={styles.dotContainer}>
        {images.map((_: any, index: number) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)' },
              index === activeIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{service.type?.toUpperCase()}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.favoriteButton, isFav && styles.favoriteButtonActive]}
              onPress={handleFavoriteToggle}
            >
              <Feather name="heart" size={20} color={isFav ? '#C41E3A' : '#666666'} fill={isFav ? '#C41E3A' : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Feather name="share-2" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Image Carousel */}
        <View style={styles.heroCard}>
          {images.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={renderImageItem}
                onScroll={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 28));
                  setActiveIndex(index);
                }}
                keyExtractor={(item, index) => index.toString()}
              />
              {renderDotIndicator()}
            </>
          ) : (
            <View style={[styles.noImagePlaceholder, { backgroundColor: serviceColor + '20' }]}>
              <Feather name="image" size={48} color={serviceColor} />
              <Text style={[styles.noImageText, { color: serviceColor }]}>{service.type?.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Title & Location */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>{service.title}</Text>
          <View style={styles.titleRow}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color="#666666" />
              <Text style={styles.locationText}>{getLocationName(service)}</Text>
            </View>
            {/* Rating Badge */}
            <TouchableOpacity style={[styles.ratingBadge, { backgroundColor: serviceColor }]} onPress={() => setSelectedTab('reviews')}>
              <View style={styles.ratingContent}>
                <Feather name="star" size={14} color="#FFFFFF" />
                <Text style={styles.ratingText}>{reviewScore > 0 ? reviewScore.toFixed(1) : '5.0'}</Text>
                <Text style={styles.ratingReviews}>({reviews.length > 0 ? reviews.length : totalReviews})</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Category Badge for Tours */}
          {service.category?.name && (
            <View style={styles.categoryBadge}>
              <Ionicons name="grid-outline" size={14} color="#FFFFFF" />
              <Text style={styles.categoryText}>{service.category.name}</Text>
            </View>
          )}
          
          {/* Star Rating for Hotels */}
          {service.type?.toLowerCase() === 'hotel' && service.star_rate && (
            <View style={styles.starRatingContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < service.star_rate ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFB800"
                />
              ))}
              <Text style={styles.starRatingText}>{service.star_rate}-star hotel</Text>
            </View>
          )}
          
          {/* Price Display with Discount */}
          <View style={styles.priceSection}>
            {originalPrice && <Text style={styles.originalPriceText}>{originalPrice}</Text>}
            <View style={styles.priceRow}>
              <Text style={[styles.mainPrice, { color: originalPrice ? '#FF6B6B' : serviceColor }]}>{getPriceDisplay(service)}</Text>
              <Text style={styles.pricePeriod}>/{pricePeriod}</Text>
            </View>
          </View>
        </View>

        {/* 🆕 SUPPLIER/AUTHOR INFORMATION SECTION */}
        {service.author && (
          <View style={styles.titleCard}>
            <Text style={styles.sectionTitle}>Offered by</Text>
            <TouchableOpacity
              style={styles.supplierContainer}
              onPress={() => {
                if (service.author_id) {
                  console.log('\n🔗 Navigating to profile:', service.author_id);
                  // router.push(`/profile/${service.author_id}`);
                }
              }}
            >
              <View style={styles.supplierHeader}>
                {service.author.avatar_id ? (
                  <Image source={{ uri: `https://visitmorocconow.net/uploads/${service.author.avatar_id}` }} style={styles.supplierAvatar} />
                ) : (
                  <View style={styles.supplierAvatarPlaceholder}>
                    <Text style={styles.supplierAvatarText}>{service.author.name?.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                )}
                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierName}>{service.author.name}</Text>
                  {service.author.business_name && <Text style={styles.supplierBusiness}>{service.author.business_name}</Text>}
                  <View style={styles.supplierStats}>
                    {service.author.services_count !== undefined && (
                      <Text style={styles.supplierStat}>{service.author.services_count} services</Text>
                    )}
                    {service.author.average_rating !== undefined && service.author.average_rating > 0 && (
                      <>
                        <Text style={styles.supplierStatDivider}>•</Text>
                        <Feather name="star" size={12} color="#FFB800" />
                        <Text style={styles.supplierStat}>{service.author.average_rating.toFixed(1)}</Text>
                      </>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#999999" />
              </View>
              {service.author.bio && (
                <Text style={styles.supplierBio} numberOfLines={2}>
                  {service.author.bio}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Service-Specific Details with Tabs */}
        {renderServiceSpecificDetails()}

      </ScrollView>

      {/* Booking Footer */}
      <View style={styles.bookingCard}>
        <TouchableOpacity style={[styles.bookButton, { backgroundColor: serviceColor }]} onPress={handleBook}>
          <Text style={styles.bookButtonText}>
            {service.type === 'car' ? 'Rent Now' : 
             service.type === 'flight' ? 'Book Flight' : 
             service.type === 'event' ? 'Get Tickets' : 
             service.type === 'tour' ? 'Book Tour' :
             service.type === 'boat' ? 'Rent Boat' :
             service.type === 'space' ? 'Book Space' : 'Book Now'}
          </Text>
          <View style={styles.bookButtonPrice}>
            <Text style={styles.bookPriceText}>{getPriceDisplay(service)}</Text>
            <Text style={styles.bookPeriodText}>/{pricePeriod}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={handleConfirmBooking}
        offer={{
          id: service.id,
          title: service.title,
          serviceType: service.type,
          price: service.price ? String(service.price) : '0',
          pricePeriod: pricePeriod,
          images: images,
          location: getLocationName(service),
        }}
      />

      {showCheckoutModal && checkoutData && (
  <CheckoutModal
  visible={showCheckoutModal}
  onClose={() => {
    if (!checkoutLoading) setShowCheckoutModal(false);
  }}
  onConfirm={handleCompleteCheckout}
  bookingCode={checkoutData.bookingCode}
  bookingDetails={checkoutData.bookingDetails}
  loading={checkoutLoading}
/>

)}

      {/* Add Review Modal */}
      <ReviewModal
        visible={showAddReviewModal}
        onClose={() => setShowAddReviewModal(false)}
        onSubmit={handleSubmitReview}
        serviceId={service?.id || 0}
        serviceType={service?.type || ''}
        serviceTitle={service?.title || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  map: {
  width: '100%',
  height: 300,
  borderRadius: 12,
  marginBottom: 16,
},
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: 10, fontSize: 13, color: '#666666' },
  loadingTextSmall: { marginTop: 8, fontSize: 12, color: '#666666' },
  headerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, margin: 14, marginBottom: 6,
    backgroundColor: '#FFFFFF', borderRadius: 14, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  backButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  favoriteButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  favoriteButtonActive: { backgroundColor: '#FFE5E5' },
  shareButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  heroCard: {
    marginTop: 10, height: 220, marginHorizontal: 14, marginBottom: 14, borderRadius: 16,
    overflow: 'hidden', backgroundColor: '#FFFFFF', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  imageSlide: { width: screenWidth - 28, height: 220, position: 'relative' },
  image: { width: '100%', height: '100%' },
  serviceBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  serviceBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  discountBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FF6B6B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  discountText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  noImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  dotContainer: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  activeDot: { width: 20 },
  titleCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 14, marginBottom: 14, padding: 16,
    borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  locationText: { fontSize: 14, color: '#666666' },
  ratingBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 10 },
  ratingContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  ratingReviews: { color: '#FFFFFF', fontSize: 11, opacity: 0.9 },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#6B7280', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginBottom: 12, gap: 4,
  },
  categoryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  starRatingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  starRatingText: { fontSize: 12, color: '#666666', marginLeft: 4 },
  priceSection: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 14 },
  originalPriceText: { fontSize: 13, color: '#999999', textDecorationLine: 'line-through', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  mainPrice: { fontSize: 24, fontWeight: 'bold' },
  pricePeriod: { fontSize: 14, color: '#666666' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 16 },
  sectionSubtitle: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 },
  tabBarCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 14, marginBottom: 14, padding: 16,
    borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E5E5', marginBottom: 16 },
  tab: { paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', minWidth: 80 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  tabContentContainer: { marginHorizontal: 14, marginBottom: 14 },
  tabContent: { flex: 1 },
  description: { fontSize: 14, lineHeight: 22, color: '#333' },
  typeInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  typeInfoItem: { width: '25%', padding: 12, alignItems: 'center' },
  typeInfoLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  typeInfoValue: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 2 },
  extraPriceItem: { padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 12 },
  extraPriceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  extraPriceName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  extraPriceValue: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  extraPriceType: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  ticketItem: { padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 12 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ticketName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  ticketPrice: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  ticketAvailable: { fontSize: 12, color: '#666' },
  inclusionExclusionContainer: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  listContainer: { marginLeft: 8 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  listItemText: { fontSize: 14, color: '#333', marginLeft: 8, flex: 1, lineHeight: 20 },
  itineraryDescription: { fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 20 },
  itineraryDay: { backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5' },
  itineraryDayExpanded: { borderColor: '#96CEB4', borderWidth: 1 },
  itineraryHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  itineraryDayNumber: { backgroundColor: '#96CEB4', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itineraryDayNumberText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  itineraryHeaderContent: { flex: 1 },
  itineraryDayTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  itineraryDayDesc: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  itineraryContent: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  itineraryImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 12 },
  itineraryContentText: { fontSize: 14, color: '#333', lineHeight: 22 },
  previewText: { fontSize: 14, color: '#666', marginBottom: 12 },
  viewItineraryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#96CEB4', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  viewItineraryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  reviewStatsContainer: { marginBottom: 20 },
  reviewStatItem: { marginBottom: 16 },
  reviewStatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewStatLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  reviewStatValue: { fontSize: 14, color: '#000', fontWeight: '600' },
  reviewStatBarContainer: { height: 6, backgroundColor: '#E5E5E5', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  reviewStatBar: { height: '100%', borderRadius: 3 },
  reviewStatCount: { fontSize: 12, color: '#666', textAlign: 'right' },
  featureCategoryContainer: { marginBottom: 24 },
  featureCategoryTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 12 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  featureItem: { width: '50%', flexDirection: 'row', alignItems: 'center', padding: 8 },
  featureIcon: { width: 24, height: 24, marginRight: 8 },
  featureText: { fontSize: 14, color: '#333', flex: 1 },
  policyText: { fontSize: 14, lineHeight: 22, color: '#666' },
  feeItem: { padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8, marginBottom: 12 },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  feeName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  feePrice: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  feeDesc: { fontSize: 12, color: '#666', marginBottom: 4 },
  feeType: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  relatedServiceCard: { width: 200, marginRight: 12, borderRadius: 12, backgroundColor: '#F8F9FA', overflow: 'hidden' },
  relatedServiceImage: { width: '100%', height: 120, backgroundColor: '#E5E5E5' },
  relatedServiceInfo: { padding: 12 },
  relatedServiceTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  relatedServiceLocation: { fontSize: 12, color: '#666666', marginBottom: 6 },
  relatedServiceRating: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  relatedServiceRatingText: { fontSize: 12, color: '#666666', fontWeight: '500' },
  relatedServiceReviews: { fontSize: 11, color: '#999999' },
  relatedServicePriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  relatedServiceOriginalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through', marginRight: 6 },
  relatedServicePrice: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  faqItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 6 },
  faqAnswer: { fontSize: 14, lineHeight: 20, color: '#666' },
  mapPlaceholder: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 16 },
  mapPlaceholderText: { fontSize: 16, fontWeight: '600', color: '#666' },
  mapNote: { fontSize: 12, color: '#999', marginTop: 8 },
  addressContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F8F9FA', borderRadius: 12, marginTop: 16 },
  addressText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#333' },
  directionsButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#007AFF', borderRadius: 6 },
  directionsButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { marginTop: 16, fontSize: 16, color: '#999' },
  reviewItem: { padding: 16, backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E5E5' },
  reviewHeaderText: { marginLeft: 12, flex: 1 },
  reviewAuthor: { fontSize: 14, fontWeight: '600', color: '#000' },
  reviewRating: { flexDirection: 'row', marginTop: 2 },
  reviewDate: { fontSize: 12, color: '#999' },
  reviewTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  reviewContent: { fontSize: 14, lineHeight: 20, color: '#333' },
  loadingReviews: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  addReviewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#96CEB4', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginBottom: 16, gap: 8 },
  addReviewButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  supplierContainer: { gap: 12 },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierAvatar: { width: 50, height: 50, borderRadius: 25 },
  supplierAvatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  supplierAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#666666' },
  supplierInfo: { flex: 1, gap: 4 },
  supplierName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  supplierBusiness: { fontSize: 13, color: '#666666' },
  supplierStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  supplierStat: { fontSize: 12, color: '#666666' },
  supplierStatDivider: { fontSize: 12, color: '#CCCCCC' },
  supplierBio: { fontSize: 14, lineHeight: 20, color: '#666666', marginTop: 4 },
  bookingCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E5E5E5',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05,
    shadowRadius: 6, elevation: 5,
  },
  bookButton: {
    paddingVertical: 8, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6,
    elevation: 4, marginBottom: 25,
  },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  bookButtonPrice: { alignItems: 'flex-end' },
  bookPriceText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  bookPeriodText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  errorCard: {
    backgroundColor: '#FFFFFF', margin: 14, padding: 32, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  errorText: { fontSize: 16, color: '#666666', fontWeight: '500' },
  backToHomeButton: { backgroundColor: '#1014d7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
  backToHomeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});


