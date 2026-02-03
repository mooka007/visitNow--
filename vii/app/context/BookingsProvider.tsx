import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';

import { Booking, BookingsContextType, BookingStatus } from './types/bookings.types';
import { bookingsStorage } from './utils/bookingsStorage';
import { bookingAPI, userAPI, Booking as ApiBooking, storage } from '../api/react_native_api';

export const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds
let lastFetchTime = 0;
let isCurrentlyFetching = false;

// ✅ Prevent duplicate checkout submits
let isCheckoutInProgress = false;
let checkoutInProgressCode: string | null = null;

// ✅ Helper function to format date to Y-m-d
const formatDateToYMD = (dateString?: string): string | undefined => {
  if (!dateString) return undefined;
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('❌ Date format error:', error);
    return undefined;
  }
};

interface BookingsProviderProps {
  children: ReactNode;
}

export const BookingsProvider: React.FC<BookingsProviderProps> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (forceRefresh: boolean = false) => {
    try {
      if (isCurrentlyFetching) {
        console.log('⏭️ Already fetching, skipping...');
        return;
      }

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;

      if (!forceRefresh && timeSinceLastFetch < CACHE_DURATION && bookings.length > 0) {
        console.log(
          '📦 Using cached bookings (',
          Math.round((CACHE_DURATION - timeSinceLastFetch) / 1000),
          's remaining)'
        );
        return;
      }

      if (!forceRefresh && timeSinceLastFetch < CACHE_DURATION) {
        console.log('📦 Loading from SecureStore (rate limit protection)');
        const localBookings = await bookingsStorage.loadBookings();
        setBookings(localBookings);
        setLoading(false);
        return;
      }

      setLoading(true);
      isCurrentlyFetching = true;

      const authData = await storage.getAuthData();
      console.log('🔐 Auth check:', { hasToken: !!authData.token, hasUser: !!authData.user });

      if (!authData.token) {
        console.log('⚠️ No auth token, loading from SecureStore only');
        const localBookings = await bookingsStorage.loadBookings();
        setBookings(localBookings);
        setLoading(false);
        isCurrentlyFetching = false;
        return;
      }

      console.log('🔄 Fetching bookings from API...');
      const response = await userAPI.getBookingHistory();

      console.log('📥 API Response:', {
        success: response.success,
        hasData: !!response.data,
        message: response.message,
      });

      if (response.success && response.data) {
        lastFetchTime = now;

        const apiBookings = transformApiBookingsToLocal(response.data);
        console.log('✅ Loaded', apiBookings.length, 'bookings from API');

        setBookings(apiBookings);
        await bookingsStorage.saveBookings(apiBookings);
      } else {
        console.log('📦 API returned no data, loading from SecureStore');
        const localBookings = await bookingsStorage.loadBookings();
        console.log('📦 Loaded', localBookings.length, 'bookings from SecureStore');
        setBookings(localBookings);
      }
    } catch (error: any) {
      console.error('❌ API Error:', error?.message || error);

      try {
        const localBookings = await bookingsStorage.loadBookings();
        console.log('📦 Loaded', localBookings.length, 'bookings from SecureStore (after error)');
        setBookings(localBookings);
      } catch (storageError) {
        console.error('❌ SecureStore Error:', storageError);
        setBookings([]);
      }
    } finally {
      setLoading(false);
      isCurrentlyFetching = false;
    }
  };

  const transformApiBookingsToLocal = (apiData: any): Booking[] => {
    let apiBookings: ApiBooking[] = [];

    if (Array.isArray(apiData)) {
      apiBookings = apiData;
    } else if (apiData.data && Array.isArray(apiData.data)) {
      apiBookings = apiData.data;
    } else if (apiData.bookings && Array.isArray(apiData.bookings)) {
      apiBookings = apiData.bookings;
    }

    console.log('🔄 Transforming', apiBookings.length, 'API bookings');

    return apiBookings.map((apiBooking: any) => ({
  bookingId: apiBooking.code || apiBooking.id?.toString() || 'unknown',

  // ✅ IMPORTANT: your API uses object_id + object_model
  offerId: apiBooking.object_id || apiBooking.service_id || 0,
  serviceType: apiBooking.object_model || apiBooking.service_type || 'unknown',

  // ✅ Service name
  offerTitle: apiBooking.service?.title || apiBooking.title || 'Unknown Service',

  // ✅ If API doesn’t provide image/location, keep them empty for now
  offerImage:
    (typeof apiBooking.service?.image === 'string' ? apiBooking.service.image : '') || '',
  offerLocation:
    apiBooking.service?.location?.name ||
    apiBooking.city || // fallback: booking billing city
    'Location not available',

  price: String(apiBooking.total ?? 0),
  pricePeriod: 'booking',
  totalPrice: String(apiBooking.total ?? 0),

  bookingDate: apiBooking.created_at || new Date().toISOString(),

  // NOTE: your API can return "processing"
  status: (apiBooking.status || 'pending') as any,

  dates: {
    startDate: apiBooking.start_date,
    endDate: apiBooking.end_date,
  },

  // Optional keep extra info if you want later UI
  // @ts-ignore
  gateway: apiBooking.gateway || apiBooking.payment_gateway,
}));

  };

  const saveBookings = async (updatedBookings: Booking[]) => {
    try {
      await bookingsStorage.saveBookings(updatedBookings);
      setBookings(updatedBookings);
    } catch (error) {
      console.error('❌ Failed to save bookings:', error);
      Alert.alert('Error', 'Failed to save booking');
      throw error;
    }
  };

  // ✅ ADD BOOKING - Returns booking code
  const addBooking = async (
    bookingData: Omit<Booking, 'bookingId' | 'bookingDate' | 'status'> & {
      boatDurationType?: 'hour' | 'day';
      boatDurationValue?: number;
      returnTime?: string;
    }
  ): Promise<string> => {
    try {
      const serviceType = bookingData.serviceType?.toLowerCase();

      console.log('📤 Adding to cart...');
      console.log('🔖 Service type:', serviceType);
      console.log('📦 Booking data:', bookingData);

      // Base payload
      const apiPayload: any = {
        service_id: bookingData.offerId,
        service_type: bookingData.serviceType,
        extra_price: [], // Always include empty array
      };

      // ✅ SERVICE-SPECIFIC FIELDS
      switch (serviceType) {
        case 'car':
          apiPayload.start_date = formatDateToYMD(bookingData.dates?.checkIn || bookingData.dates?.startDate);
          apiPayload.end_date = formatDateToYMD(bookingData.dates?.checkOut || bookingData.dates?.endDate);
          apiPayload.start_time = bookingData.dates?.time || '10:00:00';
          apiPayload.return_date = formatDateToYMD(bookingData.dates?.checkOut || bookingData.dates?.endDate);
          apiPayload.return_time =
            (bookingData.dates as any)?.returnTime || (bookingData.dates as any)?.return_time || '18:00';
          apiPayload.adults = bookingData.guests?.adults || 1;
          apiPayload.children = bookingData.guests?.children || 0;
          apiPayload.number = bookingData.guests?.adults || 1;
          break;

        case 'hotel':
          apiPayload.start_date = formatDateToYMD(bookingData.dates?.checkIn || bookingData.dates?.startDate);
          apiPayload.end_date = formatDateToYMD(bookingData.dates?.checkOut || bookingData.dates?.endDate);
          apiPayload.adults = bookingData.guests?.adults || 1;
          apiPayload.children = bookingData.guests?.children || 0;
          apiPayload.rooms = [
            {
              id: bookingData.roomId || 1,
              number_selected: bookingData.guests?.rooms || 1,
            },
          ];
          break;

        case 'event':
          apiPayload.start_date = formatDateToYMD(
            (bookingData.dates as any)?.date || bookingData.dates?.checkIn || bookingData.dates?.startDate
          );
          apiPayload.ticket_types = {
            '0': {
              number: bookingData.guests?.adults || 1,
            },
          };
          break;

        case 'space':
          apiPayload.start_date = formatDateToYMD(bookingData.dates?.checkIn || bookingData.dates?.startDate);
          apiPayload.end_date = formatDateToYMD(bookingData.dates?.checkOut || bookingData.dates?.endDate);
          apiPayload.adults = bookingData.guests?.adults || 1;
          apiPayload.children = bookingData.guests?.children || 0;
          break;

        case 'boat': {
          apiPayload.start_date = formatDateToYMD(bookingData.dates?.checkIn || bookingData.dates?.startDate);
          apiPayload.start_time = bookingData.dates?.time || '10:00:00';
          apiPayload.number = bookingData.guests?.adults || 1;

          if (bookingData.boatDurationType === 'hour') {
            apiPayload.hour = bookingData.boatDurationValue || 1;
          } else if (bookingData.boatDurationType === 'day') {
            apiPayload.day = String(bookingData.boatDurationValue || 1);
          }
          break;
        }

        case 'tour':
          apiPayload.start_date = formatDateToYMD(
            (bookingData.dates as any)?.date || bookingData.dates?.checkIn || bookingData.dates?.startDate
          );
          apiPayload.guests = bookingData.guests?.adults || 1;
          break;

        default:
          apiPayload.start_date = formatDateToYMD(
            bookingData.dates?.checkIn || (bookingData.dates as any)?.date || bookingData.dates?.startDate
          );
          apiPayload.adults = bookingData.guests?.adults || 1;
          apiPayload.children = bookingData.guests?.children || 0;
          break;
      }

      // Common fields
      apiPayload.guest_name = bookingData.userDetails?.firstName;
      apiPayload.guest_email = bookingData.userDetails?.email;
      apiPayload.guest_phone = bookingData.userDetails?.phone;
      apiPayload.special_requests = bookingData.specialRequests || '';
      apiPayload.total = parseFloat(bookingData.totalPrice);

      console.log('📤 Final Payload:', JSON.stringify(apiPayload, null, 2));

      const cartResponse = await bookingAPI.addToCart(apiPayload);
      console.log('📥 Cart Response:', JSON.stringify(cartResponse, null, 2));

      // Validation errors
      if (cartResponse.data && cartResponse.data.status === 0) {
        const errorMessage = cartResponse.data.message || 'Booking validation failed';

        if (cartResponse.data.errors) {
          const errorFields = Object.entries(cartResponse.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');

          throw new Error(`${errorMessage}\n\n${errorFields}`);
        }

        throw new Error(errorMessage);
      }

      if (cartResponse.success && cartResponse.data && cartResponse.data.status === 1 && cartResponse.data.booking_code) {
        const bookingCode = cartResponse.data.booking_code;
        console.log('✅ Added to cart successfully');
        console.log('📋 Booking code:', bookingCode);
        return bookingCode;
      }

      console.error('❌ Failed to add to cart');
      throw new Error(cartResponse.data?.message || cartResponse.message || 'Failed to create booking');
    } catch (error: any) {
      console.error('❌ Booking failed:', error);
      console.error('❌ Error details:', error?.response?.data);
      throw error;
    }
  };

  // ✅ COMPLETE CHECKOUT - With billing information
  const completeCheckout = async (
    bookingCode: string,
    checkoutData: {
      paymentGateway: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      country: string;
      termsAccepted: boolean;

      // Optional extra fields (if your CheckoutModal sends them)
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    }
  ): Promise<boolean> => {
    // ✅ Fix 2: prevent duplicate submits
    if (isCheckoutInProgress && checkoutInProgressCode === bookingCode) {
      console.log('⏭️ Checkout already in progress for this code, skipping duplicate submit:', bookingCode);
      return true;
    }

    isCheckoutInProgress = true;
    checkoutInProgressCode = bookingCode;

    try {
      console.log('📤 Completing checkout...');
      console.log('📋 Booking code:', bookingCode);

      const checkoutPayload: any = {
        code: bookingCode,
        payment_gateway: checkoutData.paymentGateway,
        first_name: checkoutData.firstName,
        last_name: checkoutData.lastName,
        email: checkoutData.email,
        phone: checkoutData.phone,
        country: checkoutData.country,
        term_conditions: checkoutData.termsAccepted ? 1 : 0,
      };

      // Send optional billing fields if present
      if (checkoutData.address) checkoutPayload.address = checkoutData.address;
      if (checkoutData.city) checkoutPayload.city = checkoutData.city;
      if (checkoutData.state) checkoutPayload.state = checkoutData.state;
      if (checkoutData.zipCode) checkoutPayload.zip_code = checkoutData.zipCode;

      console.log('📤 Checkout Payload:', JSON.stringify(checkoutPayload, null, 2));

      const checkoutResponse = await bookingAPI.doCheckout(checkoutPayload);
      console.log('📥 Checkout Response:', JSON.stringify(checkoutResponse, null, 2));

      // ✅ Fix 1: treat success + url (and even success without url) as success.
      const checkoutUrl = checkoutResponse?.data?.url;

      if (checkoutResponse.success && checkoutUrl) {
        console.log('✅ Checkout completed successfully');
        lastFetchTime = 0;

        await new Promise((resolve) => setTimeout(resolve, 2000));
        await loadBookings(true);

        return true;
      }

      if (checkoutResponse.success && checkoutResponse.data) {
        console.log('✅ Checkout completed successfully (no url returned)');
        lastFetchTime = 0;

        await new Promise((resolve) => setTimeout(resolve, 2000));
        await loadBookings(true);

        return true;
      }

      // Validation errors
      if (checkoutResponse.data && checkoutResponse.data.errors) {
        const errorMessages = Object.values(checkoutResponse.data.errors).flat().join(', ');
        throw new Error(errorMessages || 'Validation failed');
      }

      throw new Error(checkoutResponse.data?.message || checkoutResponse.message || 'Failed to complete checkout');
    } catch (error: any) {
      console.error('❌ Checkout failed:', error);
      console.error('❌ Error details:', error?.response?.data);
      throw error;
    } finally {
      isCheckoutInProgress = false;
      checkoutInProgressCode = null;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const booking = bookings.find((b) => b.bookingId === bookingId);
      if (!booking) {
        Alert.alert('Error', 'Booking not found');
        return;
      }

      Alert.alert(
        'Cancel Booking',
        `Are you sure you want to cancel this booking?\n\n${booking.offerTitle}`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                const updatedBookings = bookings.map((b) =>
                  b.bookingId === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b
                );
                await saveBookings(updatedBookings);
                Alert.alert('Cancelled', 'Your booking has been cancelled');
              } catch (error) {
                console.error('❌ Failed to cancel booking:', error);
                Alert.alert('Error', 'Failed to cancel booking');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Failed to cancel booking:', error);
      Alert.alert('Error', 'Failed to cancel booking');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const updatedBookings = bookings.map((b) => (b.bookingId === bookingId ? { ...b, status } : b));
      await saveBookings(updatedBookings);
    } catch (error) {
      console.error('❌ Failed to update booking status:', error);
      throw error;
    }
  };

  const getBookingById = (bookingId: string): Booking | undefined => {
    return bookings.find((b) => b.bookingId === bookingId);
  };

  const getBookingsByStatus = (status: BookingStatus): Booking[] => {
    return bookings.filter((b) => b.status === status);
  };

  const getBookingsByServiceType = (serviceType: any): Booking[] => {
    return bookings.filter((b) => b.serviceType === serviceType);
  };

  const clearAllBookings = async () => {
    try {
      Alert.alert(
        'Clear All Bookings',
        'Are you sure you want to delete all bookings? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              await bookingsStorage.clearBookings();
              setBookings([]);
              Alert.alert('Cleared', 'All bookings have been deleted');
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Failed to clear bookings:', error);
      Alert.alert('Error', 'Failed to clear bookings');
    }
  };

  const value: BookingsContextType = {
    bookings,
    loading,
    refreshBookings: () => loadBookings(true),
    addBooking,
    completeCheckout,
    cancelBooking,
    updateBookingStatus,
    getBookingById,
    getBookingsByStatus,
    getBookingsByServiceType,
    clearAllBookings,
  };

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

