import { useContext } from 'react';
import { BookingsContext } from '../BookingsProvider';
import { BookingsContextType } from '../types/bookings.types';

export const useBookings = (): BookingsContextType => {
  const context = useContext(BookingsContext);
  
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingsProvider');
  }
  
  return context;
};
