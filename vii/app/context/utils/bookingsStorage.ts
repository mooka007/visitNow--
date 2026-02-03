import * as SecureStore from 'expo-secure-store';
import { Booking } from '../types/bookings.types';

const BOOKINGS_KEY = 'user_bookings';

export const bookingsStorage = {
  async saveBookings(bookings: Booking[]): Promise<void> {
    try {
      await SecureStore.setItemAsync(BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (error) {
      console.error('Error saving bookings:', error);
      throw error;
    }
  },

  async loadBookings(): Promise<Booking[]> {
    try {
      const stored = await SecureStore.getItemAsync(BOOKINGS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading bookings:', error);
      return [];
    }
  },

  async clearBookings(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BOOKINGS_KEY);
    } catch (error) {
      console.error('Error clearing bookings:', error);
      throw error;
    }
  },

  // Generate unique booking ID
  generateBookingId(): string {
    return `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  },

  // Get current date/time in ISO format
  getCurrentDateTime(): string {
    return new Date().toISOString();
  },
};
