export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingGuests {
  adults: number;
  children?: number;
  rooms?: number;
}

export interface BookingDates {
  checkIn?: string;
  checkOut?: string;
  date?: string;
  time?: string;
  startDate?: string;
  endDate?: string;
}

export interface Booking {
  bookingId: string;
  offerId: number;
  serviceType: string;
  offerTitle: string;
  offerImage: string;
  offerLocation: string;
  price: string;
  pricePeriod: string;
  totalPrice: string;
  bookingDate: string;
  status: BookingStatus;
  dates?: BookingDates;
  guests?: BookingGuests;
  userDetails?: BookingUserDetails;
  specialRequests?: string;
  roomId?: number; // ✅ Add this for hotels
}


export interface BookingUserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
}

export interface BookingsContextType {
  bookings: Booking[];
  loading: boolean;
  refreshBookings: () => Promise<void>;
  addBooking: (booking: Omit<Booking, 'bookingId' | 'bookingDate' | 'status'>) => Promise<string>;
  completeCheckout: (
    bookingCode: string,
    checkoutData: {
      paymentGateway: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      country: string;
      termsAccepted: boolean;
    }
  ) => Promise<boolean>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  getBookingById: (bookingId: string) => Booking | undefined;
  getBookingsByStatus: (status: BookingStatus) => Booking[];
  getBookingsByServiceType: (serviceType: string) => Booking[];
  clearAllBookings: () => Promise<void>;
}


