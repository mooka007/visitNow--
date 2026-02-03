// app/data/mockServices.ts

export type ServiceType = 'hotel' | 'car' | 'space' | 'tour' | 'event' | 'flight';

export interface Review {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpfulCount?: number;
}

// Base Offer Interface
export interface BaseOffer {
  id: number;
  title: string;
  serviceType: ServiceType;
  location: string;
  address: string;
  price: string;
  pricePeriod: string;
  description: string;
  images: string[]; // Using string paths instead of require for flexibility
  rating: number;
  reviews: Review[];
  host?: string;
  hostSince?: string;
  isFeatured?: boolean;
  isAvailable?: boolean;
  createdAt?: string;
}

// Service-specific interfaces
export interface HotelOffer extends BaseOffer {
  serviceType: 'hotel';
  area: string;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  propertyType: 'villa' | 'apartment' | 'house' | 'room' | 'resort';
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
  rules?: string[];
  nearbyAttractions?: string[];
}

export interface CarOffer extends BaseOffer {
  serviceType: 'car';
  carType: 'sedan' | 'suv' | 'luxury' | 'sports' | 'van' | 'convertible';
  brand: string;
  model: string;
  year: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  seats: number;
  features: string[];
  pickupLocation: string;
  dropoffLocation?: string;
  mileagePolicy: 'limited' | 'unlimited';
  insuranceIncluded: boolean;
}

export interface SpaceOffer extends BaseOffer {
  serviceType: 'space';
  spaceType: 'office' | 'meeting-room' | 'event-space' | 'co-working' | 'studio';
  capacity: number;
  area: string;
  amenities: string[];
  availableFrom: string;
  availableTo: string;
  facilities: string[];
  minBookingHours: number;
  equipment?: string[];
}

export interface TourOffer extends BaseOffer {
  serviceType: 'tour';
  duration: string;
  groupSize: number;
  languages: string[];
  includes: string[];
  excludes?: string[];
  meetingPoint: string;
  difficulty: 'easy' | 'moderate' | 'difficult';
  highlights: string[];
  itinerary: Array<{ time: string; activity: string }>;
  requirements?: string[];
  guideIncluded: boolean;
}

export interface EventOffer extends BaseOffer {
  serviceType: 'event';
  eventType: 'concert' | 'conference' | 'workshop' | 'exhibition' | 'festival' | 'sports';
  date: string;
  time: string;
  venue: string;
  organizer: string;
  capacity: number;
  duration: string;
  performers?: string[];
  speakers?: string[];
  schedule: Array<{ time: string; activity: string }>;
  ageRestriction?: string;
}

export interface FlightOffer extends BaseOffer {
  serviceType: 'flight';
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    airportCode: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  class: 'economy' | 'premium-economy' | 'business' | 'first';
  baggage: string;
  aircraft: string;
  refundable: boolean;
  mealIncluded: boolean;
}

export type Offer = HotelOffer | CarOffer | SpaceOffer | TourOffer | EventOffer | FlightOffer;

// Sample reviews data
const sampleReviews: Review[] = [
  {
    id: 1,
    userId: 'user1',
    userName: 'Alex Johnson',
    rating: 5,
    comment: 'Amazing experience! Everything was perfect. The staff was incredibly helpful and the location was stunning.',
    date: '2024-01-15',
    helpfulCount: 12
  },
  {
    id: 2,
    userId: 'user2',
    userName: 'Sarah Miller',
    rating: 4,
    comment: 'Great service overall, but could use some improvements in timing. The facilities were excellent though!',
    date: '2024-01-10',
    helpfulCount: 5
  },
  {
    id: 3,
    userId: 'user3',
    userName: 'Mike Chen',
    rating: 5,
    comment: 'Exceeded all expectations. Will definitely book again! Highly recommended for anyone visiting the area.',
    date: '2024-01-05',
    helpfulCount: 8
  },
  {
    id: 4,
    userId: 'user4',
    userName: 'Emma Wilson',
    rating: 3,
    comment: 'Decent experience but there were some issues with communication. The place itself was nice though.',
    date: '2024-01-02',
    helpfulCount: 2
  },
  {
    id: 5,
    userId: 'user5',
    userName: 'David Park',
    rating: 5,
    comment: 'Absolutely fantastic! The attention to detail was impressive. Perfect for our family vacation.',
    date: '2023-12-28',
    helpfulCount: 15
  },
  {
    id: 6,
    userId: 'user6',
    userName: 'Lisa Rodriguez',
    rating: 4,
    comment: 'Very good value for money. Clean, comfortable, and well-located. Would stay here again.',
    date: '2023-12-20',
    helpfulCount: 7
  },
  {
    id: 7,
    userId: 'user7',
    userName: 'Thomas Anderson',
    rating: 2,
    comment: 'Had some issues with cleanliness and amenities. Expected better based on the photos.',
    date: '2023-12-15',
    helpfulCount: 3
  },
  {
    id: 8,
    userId: 'user8',
    userName: 'Sophia Williams',
    rating: 5,
    comment: 'Perfect in every way! The service was exceptional and the location was breathtaking.',
    date: '2023-12-10',
    helpfulCount: 10
  }
];

export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

// Helper function to get rating summary
export const getRatingSummary = (reviews: Review[]) => {
  const summary = {
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  };
  
  reviews.forEach(review => {
    summary[review.rating as keyof typeof summary]++;
  });
  
  return summary;
};
const getRandomReviews = (count: number): Review[] => {
  const shuffled = [...sampleReviews].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Service type configurations
export const serviceConfig = {
  hotel: {
    icon: 'home' as const,
    color: '#66f500', // Neon Lime Green
    gradient: ['#B6F500', '#8CE500'], // Electric green gradient
    label: 'Hotels & Stays',
  },
  car: {
    icon: 'truck' as const,
    color: '#0026ff', // Electric Cyan
    gradient: ['#00F5FF', '#0026ff'], // Cyan to blue gradient
    label: 'Car Rentals',
  },
  flight: {
    icon: 'airplane' as const,
    color: '#FF00F5', // Electric Red-Pink FF00F5
    gradient: ['#FF00F5', '#E5003D'], // Red gradient
    label: 'Flights',
  },
  space: {
    icon: 'briefcase' as const,
    color: '#FF0055', // Hot Pink/Magenta
    gradient: ['#FF0055', '#E500D4'], // Magenta gradient
    label: 'Spaces',
  },
  tour: {
    icon: 'map' as const,
    color: '#FFB800', // Electric Yellow
    gradient: ['#FFB800', '#FF9A00'], // Yellow to orange gradient
    label: 'Tours',
  },
  event: {
    icon: 'calendar' as const,
    color: '#B800FF', // Electric Purple
    gradient: ['#B800FF', '#9A00FF'], // Purple gradient
    label: 'Events',
  }
};

// Mock data for all services
export const mockOffers: Offer[] = [
  // ==================== HOTELS ====================
  {
    id: 1,
    serviceType: 'hotel',
    title: 'Luxury Villa with Pool',
    location: 'Marrakech',
    address: '58420 Lee Stoner, Marrakech',
    price: '$250',
    pricePeriod: '/night',
    area: '450 m²',
    bedrooms: 4,
    bathrooms: 3,
    description: 'Experience traditional Moroccan luxury in this stunning villa featuring a private pool, beautiful garden, and authentic architecture.',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.8, // This will be calculated from reviews
    reviews: getRandomReviews(8), // Actual review objects
    host: 'Mohammed Alami',
    hostSince: '2018',
    propertyType: 'villa',
    maxGuests: 8,
    amenities: ['Swimming Pool', 'Garden', 'Free WiFi', 'Air Conditioning', 'Private Parking', 'Full Kitchen', 'Terrace', 'BBQ Area'],
    checkInTime: '2:00 PM',
    checkOutTime: '11:00 AM',
    isFeatured: true,
    isAvailable: true,
    createdAt: '2023-01-15',
  },
  {
    id: 2,
    serviceType: 'hotel',
    title: 'Modern Beachfront Apartment',
    location: 'Agadir',
    address: '123 Beach Road, Agadir',
    price: '$180',
    pricePeriod: '/night',
    area: '120 m²',
    bedrooms: 2,
    bathrooms: 2,
    description: 'Stunning beachfront apartment with panoramic ocean views. Modern amenities combined with easy beach access.',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.6,
    reviews: getRandomReviews(6),
    host: 'Fatima Zahra',
    hostSince: '2020',
    propertyType: 'apartment',
    maxGuests: 4,
    amenities: ['Beach View', 'Balcony', 'Free WiFi', 'Air Conditioning', 'Parking', 'Kitchenette', 'TV'],
    checkInTime: '3:00 PM',
    checkOutTime: '12:00 PM',
    isFeatured: false,
    isAvailable: true,
    createdAt: '2023-03-20',
  },
  {
    id: 12,
    serviceType: 'hotel',
    title: 'Riad in Old Medina',
    location: 'Fez',
    address: 'Medina Quarter, Fez',
    price: '$140',
    pricePeriod: '/night',
    area: '180 m²',
    bedrooms: 3,
    bathrooms: 2,
    description: 'Authentic riad located in the heart of the old Medina with traditional Moroccan decor.',
    images: ['https://images.unsplash.com/photo-1582719478185-219f3b6b5c91'],
    rating: 4.6,
    reviews: getRandomReviews(5),
    host: 'Abdel Karim',
    hostSince: '2017',
    propertyType: 'house',
    maxGuests: 6,
    amenities: ['WiFi', 'Patio', 'Breakfast Included'],
    checkInTime: '1:00 PM',
    checkOutTime: '11:00 AM',
    isAvailable: true,
  },
  {
    id: 18,
    serviceType: 'hotel',
    title: 'Mountain Lodge Retreat',
    location: 'Ifrane',
    address: 'Atlas Mountains',
    price: '$160',
    pricePeriod: '/night',
    area: '220 m²',
    bedrooms: 3,
    bathrooms: 2,
    description: 'Peaceful lodge surrounded by cedar forests.',
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511'],
    rating: 4.8,
    reviews: getRandomReviews(7),
    propertyType: 'house',
    maxGuests: 6,
    amenities: ['Fireplace', 'WiFi', 'Mountain View'],
    checkInTime: '2:00 PM',
    checkOutTime: '11:00 AM',
  },
  {
    id: 24,
    serviceType: 'hotel',
    title: 'City Center Boutique Hotel',
    location: 'Tangier',
    address: 'Grand Boulevard',
    price: '$110',
    pricePeriod: '/night',
    area: '90 m²',
    bedrooms: 1,
    bathrooms: 1,
    description: 'Stylish boutique hotel near the city center.',
    images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'],
    rating: 4.5,
    reviews: getRandomReviews(6),
    propertyType: 'room',
    maxGuests: 2,
    amenities: ['WiFi', 'Breakfast'],
    checkInTime: '2:00 PM',
    checkOutTime: '12:00 PM',
  },
  {
    id: 30,
    serviceType: 'hotel',
    title: 'Desert Luxury Camp',
    location: 'Zagora',
    address: 'Desert Camp Area',
    price: '$210',
    pricePeriod: '/night',
    area: 'Private Tent',
    bedrooms: 1,
    bathrooms: 1,
    description: 'Luxury desert camp with private tents and stargazing.',
    images: ['https://images.unsplash.com/photo-1518684079-3c830dcef090'],
    rating: 4.9,
    reviews: getRandomReviews(8),
    propertyType: 'resort',
    maxGuests: 2,
    amenities: ['Dinner Included', 'Camel Ride', 'Fire Camp'],
    checkInTime: '4:00 PM',
    checkOutTime: '10:00 AM',
  },

  // ==================== CARS ====================
  {
    id: 3,
    serviceType: 'car',
    title: 'BMW X5 Luxury SUV',
    location: 'Casablanca',
    address: 'Airport Pickup Available',
    price: '$120',
    pricePeriod: '/day',
    carType: 'suv',
    brand: 'BMW',
    model: 'X5',
    year: 2023,
    fuelType: 'hybrid',
    transmission: 'automatic',
    seats: 5,
    features: ['GPS Navigation', 'Bluetooth', 'Leather Seats', 'Sunroof', 'Backup Camera', 'Apple CarPlay', 'Heated Seats', 'Premium Sound'],
    pickupLocation: 'Casablanca Airport',
    dropoffLocation: 'Same Location',
    mileagePolicy: 'unlimited',
    insuranceIncluded: true,
    description: 'Luxury SUV with premium features for comfortable travel.',
    images: [
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.7,
    reviews: getRandomReviews(7),
    isFeatured: true,
    isAvailable: true,
    createdAt: '2023-02-10',
  },
  {
    id: 4,
    serviceType: 'car',
    title: 'Mercedes C-Class Sedan',
    location: 'Marrakech',
    address: 'City Center Office',
    price: '$85',
    pricePeriod: '/day',
    carType: 'sedan',
    brand: 'Mercedes',
    model: 'C-Class',
    year: 2022,
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 5,
    features: ['GPS', 'Bluetooth', 'Leather Interior', 'Climate Control', 'Cruise Control'],
    pickupLocation: 'Marrakech City Center',
    mileagePolicy: 'limited',
    insuranceIncluded: true,
    description: 'Elegant sedan perfect for city driving and business meetings.',
    images: [
      'https://images.unsplash.com/photo-1555212697-194d092e3b8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.5,
    reviews: getRandomReviews(5),
    isFeatured: false,
    isAvailable: true,
    createdAt: '2023-04-05',
  },
  {
    id: 13,
    serviceType: 'car',
    title: 'Toyota Corolla Economy',
    location: 'Tangier',
    address: 'Port Area',
    price: '$45',
    pricePeriod: '/day',
    carType: 'sedan',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2021,
    fuelType: 'gasoline',
    transmission: 'automatic',
    seats: 5,
    features: ['Bluetooth', 'AC'],
    pickupLocation: 'Tangier Port',
    mileagePolicy: 'limited',
    insuranceIncluded: true,
    description: 'Reliable and fuel-efficient car for city travel.',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2'],
    rating: 4.4,
    reviews: getRandomReviews(6),
  },
  {
    id: 19,
    serviceType: 'car',
    title: 'Range Rover Sport',
    location: 'Rabat',
    address: 'Downtown',
    price: '$150',
    pricePeriod: '/day',
    carType: 'luxury',
    brand: 'Land Rover',
    model: 'Range Rover Sport',
    year: 2023,
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 5,
    features: ['4x4', 'Leather Seats', 'GPS'],
    pickupLocation: 'City Center',
    mileagePolicy: 'unlimited',
    insuranceIncluded: true,
    description: 'Luxury SUV for premium travel.',
    images: ['https://images.unsplash.com/photo-1617814076668-9a1e5e7cdb1b'],
    rating: 4.9,
    reviews: getRandomReviews(5),
  },
  {
    id: 25,
    serviceType: 'car',
    title: 'Hyundai Tucson SUV',
    location: 'Agadir',
    address: 'Airport',
    price: '$70',
    pricePeriod: '/day',
    carType: 'suv',
    brand: 'Hyundai',
    model: 'Tucson',
    year: 2022,
    fuelType: 'gasoline',
    transmission: 'automatic',
    seats: 5,
    features: ['Bluetooth', 'Camera'],
    pickupLocation: 'Agadir Airport',
    mileagePolicy: 'limited',
    insuranceIncluded: true,
    description: 'Comfortable SUV for family trips.',
    images: ['https://images.unsplash.com/photo-1618843479313-40f8b32c21dd'],
    rating: 4.4,
    reviews: getRandomReviews(4),
  },

  // ==================== SPACES ====================
  {
    id: 5,
    serviceType: 'space',
    title: 'Modern Office Space - Business District',
    location: 'Rabat',
    address: '123 Business Avenue, Rabat',
    price: '$450',
    pricePeriod: '/month',
    spaceType: 'office',
    capacity: 10,
    area: '120 m²',
    amenities: ['High-speed WiFi', 'Printing Facilities', 'Kitchen', 'Meeting Room', 'Reception'],
    availableFrom: '9:00 AM',
    availableTo: '6:00 PM',
    facilities: ['Parking', 'Security', 'Cleaning Service', 'Mail Handling'],
    minBookingHours: 1,
    equipment: ['Projector', 'Whiteboard', 'Conference Phone'],
    description: 'Modern office space in central business district with all amenities.',
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.7,
    reviews: getRandomReviews(6),
    host: 'Office Solutions Inc.',
    hostSince: '2019',
    isFeatured: true,
    isAvailable: true,
    createdAt: '2023-01-30',
  },
  {
    id: 6,
    serviceType: 'space',
    title: 'Creative Studio for Photoshoots',
    location: 'Casablanca',
    address: '45 Art Street, Casablanca',
    price: '$75',
    pricePeriod: '/hour',
    spaceType: 'studio',
    capacity: 15,
    area: '80 m²',
    amenities: ['Natural Light', 'Changing Room', 'WiFi', 'Kitchenette'],
    availableFrom: '8:00 AM',
    availableTo: '10:00 PM',
    facilities: ['Parking', 'Equipment Rental', 'Makeup Station'],
    minBookingHours: 2,
    equipment: ['Lighting Equipment', 'Backdrops', 'Props'],
    description: 'Bright and spacious studio perfect for photoshoots.',
    images: [
      'https://images.unsplash.com/photo-1494891848038-7bd202a2afeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.9,
    reviews: getRandomReviews(4),
    host: 'Creative Studios Co.',
    isFeatured: false,
    isAvailable: true,
    createdAt: '2023-03-15',
  },
  {
    id: 14,
    serviceType: 'space',
    title: 'Coworking Space Downtown',
    location: 'Casablanca',
    address: 'Maarif District',
    price: '$20',
    pricePeriod: '/hour',
    spaceType: 'co-working',
    capacity: 20,
    area: '200 m²',
    amenities: ['WiFi', 'Coffee', 'AC'],
    availableFrom: '8:00 AM',
    availableTo: '8:00 PM',
    facilities: ['Security', 'Reception'],
    minBookingHours: 1,
    description: 'Modern coworking space ideal for freelancers and startups.',
    images: ['https://images.unsplash.com/photo-1521737604893-d14cc237f11d'],
    rating: 4.7,
    reviews: getRandomReviews(5),
  },
  {
    id: 21,
    serviceType: 'space',
    title: 'Event Hall for Weddings',
    location: 'Agadir',
    address: 'Palm Avenue',
    price: '$900',
    pricePeriod: '/day',
    spaceType: 'event-space',
    capacity: 300,
    area: '500 m²',
    amenities: ['Stage', 'Sound System', 'Lighting'],
    availableFrom: '10:00 AM',
    availableTo: '2:00 AM',
    facilities: ['Parking', 'Security'],
    minBookingHours: 6,
    description: 'Elegant hall perfect for weddings and large events.',
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3'],
    rating: 4.7,
    reviews: getRandomReviews(5),
  },
  {
    id: 26,
    serviceType: 'space',
    title: 'Meeting Room for Teams',
    location: 'Marrakech',
    address: 'Business Plaza',
    price: '$40',
    pricePeriod: '/hour',
    spaceType: 'meeting-room',
    capacity: 12,
    area: '60 m²',
    amenities: ['Projector', 'WiFi'],
    availableFrom: '9:00 AM',
    availableTo: '6:00 PM',
    facilities: ['Reception'],
    minBookingHours: 1,
    description: 'Professional meeting space.',
    images: ['https://images.unsplash.com/photo-1517502166878-35c93a0072bb'],
    rating: 4.6,
    reviews: getRandomReviews(3),
  },

  // ==================== TOURS ====================
  {
    id: 7,
    serviceType: 'tour',
    title: 'Atlas Mountains Day Trek',
    location: 'Marrakech',
    address: 'Meeting at Jemaa el-Fnaa Square',
    price: '$85',
    pricePeriod: '/person',
    duration: '8 hours',
    groupSize: 12,
    languages: ['English', 'French', 'Arabic'],
    includes: ['Professional Guide', 'Traditional Lunch', 'Transportation', 'Trekking Equipment', 'Water'],
    excludes: ['Personal Expenses', 'Tips'],
    meetingPoint: 'Main Square, Marrakech',
    difficulty: 'moderate',
    highlights: ['Berber Villages Visit', 'Waterfall Discovery', 'Panoramic Mountain Views', 'Traditional Berber Lunch', 'Local Culture Experience'],
    itinerary: [
      { time: '8:00 AM', activity: 'Pickup from meeting point' },
      { time: '9:30 AM', activity: 'Arrive at Atlas Mountains base' },
      { time: '10:00 AM', activity: 'Start trek through Berber villages' },
      { time: '1:00 PM', activity: 'Traditional Berber lunch with local family' },
      { time: '2:30 PM', activity: 'Continue trek to waterfall' },
      { time: '4:00 PM', activity: 'Return trek' },
      { time: '5:30 PM', activity: 'Return to Marrakech' },
    ],
    requirements: ['Comfortable walking shoes', 'Sun protection', 'Camera'],
    guideIncluded: true,
    description: 'Experience the breathtaking beauty of the Atlas Mountains with a local guide.',
    images: [
      'https://images.unsplash.com/photo-1536152471326-642d734f127b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526392587636-9a0e8a0e5c6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.9,
    reviews: getRandomReviews(8),
    host: 'Atlas Adventures',
    hostSince: '2015',
    isFeatured: true,
    isAvailable: true,
    createdAt: '2023-02-28',
  },
  {
    id: 15,
    serviceType: 'tour',
    title: 'Sahara Desert 2-Day Tour',
    location: 'Merzouga',
    address: 'Hotel Pickup',
    price: '$220',
    pricePeriod: '/person',
    duration: '2 days',
    groupSize: 10,
    languages: ['English', 'French'],
    includes: ['Camel Ride', 'Camp Dinner', 'Guide'],
    meetingPoint: 'Ouarzazate',
    difficulty: 'easy',
    highlights: ['Sunset Dunes', 'Desert Camp'],
    itinerary: [
      { time: 'Day 1', activity: 'Drive to desert & camel ride' },
      { time: 'Day 2', activity: 'Sunrise & return' },
    ],
    guideIncluded: true,
    description: 'Unforgettable Sahara experience with overnight desert camp.',
    images: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'],
    rating: 4.9,
    reviews: getRandomReviews(8),
  },
  {
    id: 20,
    serviceType: 'tour',
    title: 'Essaouira Coastal Day Trip',
    location: 'Essaouira',
    address: 'Hotel Pickup',
    price: '$65',
    pricePeriod: '/person',
    duration: '1 day',
    groupSize: 15,
    languages: ['English', 'French'],
    includes: ['Transport', 'Guide'],
    meetingPoint: 'Marrakech',
    difficulty: 'easy',
    highlights: ['Beach', 'Medina', 'Seafood'],
    itinerary: [{ time: '9:00 AM', activity: 'Departure' }],
    guideIncluded: true,
    description: 'Relaxing coastal escape to Essaouira.',
    images: ['https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1'],
    rating: 4.6,
    reviews: getRandomReviews(6),
  },
  {
    id: 27,
    serviceType: 'tour',
    title: 'Casablanca City Tour',
    location: 'Casablanca',
    address: 'Hotel Pickup',
    price: '$40',
    pricePeriod: '/person',
    duration: '4 hours',
    groupSize: 20,
    languages: ['English', 'French'],
    includes: ['Guide', 'Transport'],
    meetingPoint: 'City Center',
    difficulty: 'easy',
    highlights: ['Hassan II Mosque', 'Corniche'],
    itinerary: [{ time: '9:00 AM', activity: 'City Tour' }],
    guideIncluded: true,
    description: 'Discover Casablanca highlights.',
    images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429'],
    rating: 4.3,
    reviews: getRandomReviews(5),
  },
  {
    id: 31,
    serviceType: 'tour',
    title: 'Casablanca Walking Tour',
    location: 'Casablanca',
    address: 'Hotel Pickup',
    price: '$15',
    pricePeriod: '/person',
    duration: '2 hours',
    groupSize: 15,
    languages: ['English', 'French'],
    includes: ['Local Guide'],
    meetingPoint: 'United Nations Square',
    difficulty: 'easy',
    highlights: ['Old Medina', 'Art Deco Streets'],
    itinerary: [{ time: '10:00 AM', activity: 'Guided Walking Tour' }],
    guideIncluded: true,
    description: 'Affordable walking tour exploring Casablanca\'s historic center.',
    images: ['https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1'],
    rating: 4.1,
    reviews: getRandomReviews(4),
  },
  {
    id: 32,
    serviceType: 'tour',
    title: 'Casablanca Food Tasting Tour',
    location: 'Casablanca',
    address: 'Hotel Pickup',
    price: '$30',
    pricePeriod: '/person',
    duration: '3 hours',
    groupSize: 12,
    languages: ['English', 'French'],
    includes: ['Food Tastings', 'Guide'],
    meetingPoint: 'Central Market',
    difficulty: 'easy',
    highlights: ['Street Food', 'Local Markets'],
    itinerary: [{ time: '11:00 AM', activity: 'Food Sampling & Market Visit' }],
    guideIncluded: true,
    description: 'Taste authentic Moroccan dishes with a local guide.',
    images: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe'],
    rating: 4.4,
    reviews: getRandomReviews(5),
  },
  {
    id: 33,
    serviceType: 'tour',
    title: 'Casablanca Cultural Half-Day Tour',
    location: 'Casablanca',
    address: 'Hotel Pickup',
    price: '$55',
    pricePeriod: '/person',
    duration: '5 hours',
    groupSize: 18,
    languages: ['English', 'French'],
    includes: ['Guide', 'Transport'],
    meetingPoint: 'City Center',
    difficulty: 'easy',
    highlights: ['Hassan II Mosque', 'Habous Quarter'],
    itinerary: [{ time: '9:00 AM', activity: 'Cultural Sites Tour' }],
    guideIncluded: true,
    description: 'Explore Casablanca\'s cultural landmarks and neighborhoods.',
    images: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'],
    rating: 4.5,
    reviews: getRandomReviews(6),
  },
  {
    id: 34,
    serviceType: 'tour',
    title: 'Casablanca Private City Tour',
    location: 'Casablanca',
    address: 'Hotel Pickup',
    price: '$90',
    pricePeriod: '/person',
    duration: '6 hours',
    groupSize: 6,
    languages: ['English', 'French'],
    includes: ['Private Guide', 'Private Transport'],
    meetingPoint: 'Hotel Lobby',
    difficulty: 'easy',
    highlights: ['Corniche', 'Royal Palace Area'],
    itinerary: [{ time: '9:00 AM', activity: 'Private City Tour' }],
    guideIncluded: true,
    description: 'Private and personalized Casablanca sightseeing experience.',
    images: ['https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba'],
    rating: 4.7,
    reviews: getRandomReviews(4),
  },
  {
    id: 35,
    serviceType: 'tour',
    title: 'Luxury Casablanca VIP Tour',
    location: 'Casablanca',
    address: 'Hotel Pickup',
    price: '$150',
    pricePeriod: '/person',
    duration: '7 hours',
    groupSize: 4,
    languages: ['English', 'French'],
    includes: ['Luxury Vehicle', 'Professional Guide', 'Lunch'],
    meetingPoint: 'Hotel Lobby',
    difficulty: 'easy',
    highlights: ['Hassan II Mosque Interior', 'Exclusive Stops'],
    itinerary: [{ time: '8:30 AM', activity: 'VIP Guided Experience' }],
    guideIncluded: true,
    description: 'Premium VIP tour with luxury transport and curated experiences.',
    images: ['https://images.unsplash.com/photo-1518684079-3c830dcef090'],
    rating: 4.9,
    reviews: getRandomReviews(5),
  },

  // ==================== EVENTS ====================
  {
    id: 8,
    serviceType: 'event',
    title: 'Moroccan Jazz Night Festival',
    location: 'Agadir',
    address: 'Beachfront Arena, Agadir',
    price: '$60',
    pricePeriod: '/ticket',
    eventType: 'concert',
    date: '2024-06-15',
    time: '7:00 PM',
    venue: 'Open Air Beach Arena',
    organizer: 'Moroccan Jazz Society',
    capacity: 500,
    duration: '4 hours',
    performers: ['Sami Rai & Band', 'Jazz Fusion Collective', 'Traditional Gnawa Musicians', 'Local Jazz Artists'],
    schedule: [
      { time: '7:00 PM', activity: 'Doors Open & Welcome Drink' },
      { time: '8:00 PM', activity: 'Opening Act: Traditional Gnawa Music' },
      { time: '9:00 PM', activity: 'Main Performance: Sami Rai & Band' },
      { time: '10:30 PM', activity: 'Jazz Fusion Collective' },
      { time: '11:30 PM', activity: 'All-Star Jam Session' },
    ],
    ageRestriction: '18+',
    description: 'An unforgettable jazz night by the beach featuring the best of Moroccan and international jazz artists.',
    images: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.8,
    reviews: getRandomReviews(7),
    isFeatured: true,
    isAvailable: true,
    createdAt: '2023-05-10',
  },
  {
    id: 9,
    serviceType: 'event',
    title: 'Tech Conference 2024',
    location: 'Casablanca',
    address: 'Convention Center, Casablanca',
    price: '$300',
    pricePeriod: '/ticket',
    eventType: 'conference',
    date: '2024-09-20',
    time: '9:00 AM',
    venue: 'Casablanca Convention Center',
    organizer: 'TechMorocco',
    capacity: 1000,
    duration: '2 days',
    speakers: ['Tech Industry Leaders', 'Innovation Experts', 'Startup Founders'],
    schedule: [
      { time: '9:00 AM', activity: 'Registration & Networking' },
      { time: '10:00 AM', activity: 'Keynote: Future of Tech in Africa' },
      { time: '11:30 AM', activity: 'Panel: AI and Innovation' },
      { time: '2:00 PM', activity: 'Workshop: Startup Funding' },
    ],
    description: 'The largest tech conference in North Africa featuring industry leaders, innovative startups, and networking opportunities.',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.6,
    reviews: getRandomReviews(6),
    isFeatured: true,
    isAvailable: true,
    createdAt: '2023-06-01',
  },
  {
    id: 16,
    serviceType: 'event',
    title: 'Startup Networking Meetup',
    location: 'Rabat',
    address: 'Innovation Hub',
    price: '$15',
    pricePeriod: '/ticket',
    eventType: 'workshop',
    date: '2024-08-12',
    time: '6:00 PM',
    venue: 'Tech Hub Rabat',
    organizer: 'Startup Morocco',
    capacity: 120,
    duration: '3 hours',
    schedule: [{ time: '6:00 PM', activity: 'Networking & Talks' }],
    description: 'Meet entrepreneurs and investors in Morocco.',
    images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87'],
    rating: 4.5,
    reviews: getRandomReviews(4),
  },
  {
    id: 22,
    serviceType: 'event',
    title: 'Photography Workshop',
    location: 'Chefchaouen',
    address: 'Blue Medina',
    price: '$50',
    pricePeriod: '/ticket',
    eventType: 'workshop',
    date: '2024-10-05',
    time: '10:00 AM',
    venue: 'Art Center',
    organizer: 'Photo Morocco',
    capacity: 30,
    duration: '5 hours',
    schedule: [{ time: '10:00 AM', activity: 'Workshop & City Walk' }],
    description: 'Learn travel photography in the blue city.',
    images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429'],
    rating: 4.8,
    reviews: getRandomReviews(4),
  },
  {
    id: 28,
    serviceType: 'event',
    title: 'Yoga & Wellness Retreat',
    location: 'Ourika Valley',
    address: 'Eco Lodge',
    price: '$180',
    pricePeriod: '/ticket',
    eventType: 'workshop',
    date: '2024-12-01',
    time: '8:00 AM',
    venue: 'Mountain Retreat',
    organizer: 'Wellness Morocco',
    capacity: 25,
    duration: '2 days',
    schedule: [{ time: '8:00 AM', activity: 'Yoga & Meditation' }],
    description: 'Reconnect with nature and yourself.',
    images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773'],
    rating: 4.9,
    reviews: getRandomReviews(5),
  },

  // ==================== FLIGHTS ====================
  {
    id: 10,
    serviceType: 'flight',
    title: 'Royal Air Maroc Business Class',
    location: 'Casablanca to Paris',
    address: 'Mohammed V Airport, Casablanca',
    price: '$850',
    pricePeriod: '/person',
    airline: 'Royal Air Maroc',
    flightNumber: 'AT 756',
    departure: {
      airport: 'Mohammed V International Airport',
      airportCode: 'CMN',
      time: '14:30',
      date: '2024-06-15',
    },
    arrival: {
      airport: 'Charles de Gaulle Airport',
      airportCode: 'CDG',
      time: '18:45',
      date: '2024-06-15',
    },
    duration: '3h 15m',
    stops: 0,
    class: 'business',
    baggage: '2 x 32kg',
    aircraft: 'Boeing 787-9 Dreamliner',
    refundable: true,
    mealIncluded: true,
    description: 'Direct flight from Casablanca to Paris in Business Class comfort.',
    images: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.5,
    reviews: getRandomReviews(7),
    isFeatured: true,
    isAvailable: true,
    createdAt: '2023-04-20',
  },
  {
    id: 11,
    serviceType: 'flight',
    title: 'Economy Class to Dubai',
    location: 'Marrakech to Dubai',
    address: 'Marrakech Menara Airport',
    price: '$320',
    pricePeriod: '/person',
    airline: 'Emirates',
    flightNumber: 'EK 752',
    departure: {
      airport: 'Marrakech Menara Airport',
      airportCode: 'RAK',
      time: '08:15',
      date: '2024-07-10',
    },
    arrival: {
      airport: 'Dubai International Airport',
      airportCode: 'DXB',
      time: '18:30',
      date: '2024-07-10',
    },
    duration: '7h 15m',
    stops: 1,
    class: 'economy',
    baggage: '30kg',
    aircraft: 'Airbus A380',
    refundable: false,
    mealIncluded: true,
    description: 'Comfortable economy class flight to Dubai with one stop.',
    images: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.3,
    reviews: getRandomReviews(6),
    isFeatured: false,
    isAvailable: true,
    createdAt: '2023-05-15',
  },
  {
    id: 17,
    serviceType: 'flight',
    title: 'Direct Flight to Madrid',
    location: 'Casablanca to Madrid',
    address: 'CMN Airport',
    price: '$180',
    pricePeriod: '/person',
    airline: 'Iberia',
    flightNumber: 'IB 4321',
    departure: {
      airport: 'Mohammed V Airport',
      airportCode: 'CMN',
      time: '10:00',
      date: '2024-09-01',
    },
    arrival: {
      airport: 'Madrid Barajas',
      airportCode: 'MAD',
      time: '12:30',
      date: '2024-09-01',
    },
    duration: '2h 30m',
    stops: 0,
    class: 'economy',
    baggage: '23kg',
    aircraft: 'A320',
    refundable: false,
    mealIncluded: false,
    description: 'Affordable direct flight to Madrid.',
    images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05'],
    rating: 4.2,
    reviews: getRandomReviews(5),
  },
  {
    id: 23,
    serviceType: 'flight',
    title: 'Flight to Istanbul',
    location: 'Casablanca to Istanbul',
    address: 'CMN Airport',
    price: '$410',
    pricePeriod: '/person',
    airline: 'Turkish Airlines',
    flightNumber: 'TK 618',
    departure: {
      airport: 'CMN',
      airportCode: 'CMN',
      time: '1:30 AM',
      date: '2024-11-12',
    },
    arrival: {
      airport: 'Istanbul Airport',
      airportCode: 'IST',
      time: '7:45 AM',
      date: '2024-11-12',
    },
    duration: '5h 15m',
    stops: 0,
    class: 'economy',
    baggage: '30kg',
    aircraft: 'A321',
    refundable: true,
    mealIncluded: true,
    description: 'Comfortable night flight to Istanbul.',
    images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05'],
    rating: 4.6,
    reviews: getRandomReviews(7),
  },
  {
    id: 29,
    serviceType: 'flight',
    title: 'Flight to London',
    location: 'Rabat to London',
    address: 'Rabat Airport',
    price: '$390',
    pricePeriod: '/person',
    airline: 'British Airways',
    flightNumber: 'BA 881',
    departure: {
      airport: 'Rabat Airport',
      airportCode: 'RBA',
      time: '11:45',
      date: '2024-10-18',
    },
    arrival: {
      airport: 'Heathrow',
      airportCode: 'LHR',
      time: '14:30',
      date: '2024-10-18',
    },
    duration: '2h 45m',
    stops: 0,
    class: 'economy',
    baggage: '23kg',
    aircraft: 'A320',
    refundable: false,
    mealIncluded: true,
    description: 'Direct flight to London.',
    images: ['https://images.unsplash.com/photo-1436491865332-7a61a109cc05'],
    rating: 4.4,
    reviews: getRandomReviews(6),
  }
];

// Update the getOfferById to ensure rating is calculated from reviews
export const getOfferById = (id: number): Offer | undefined => {
  const offer = mockOffers.find(offer => offer.id === id);
  if (offer) {
    // Ensure rating is calculated from reviews
    offer.rating = calculateAverageRating(offer.reviews);
  }
  return offer;
};

export const getOffersByType = (serviceType: ServiceType): Offer[] => {
  return mockOffers.filter(offer => offer.serviceType === serviceType);
};

export const getFeaturedOffers = (): Offer[] => {
  return mockOffers.filter(offer => offer.isFeatured);
};

export const getAvailableOffers = (): Offer[] => {
  return mockOffers.filter(offer => offer.isAvailable !== false);
};

export const searchOffers = (query: string): Offer[] => {
  const searchTerm = query.toLowerCase();
  return mockOffers.filter(offer => 
    offer.title.toLowerCase().includes(searchTerm) ||
    offer.location.toLowerCase().includes(searchTerm) ||
    offer.description.toLowerCase().includes(searchTerm)
  );
};

// Get offers by multiple criteria
export const getFilteredOffers = (filters: {
  serviceType?: ServiceType;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  rating?: number;
}): Offer[] => {
  return mockOffers.filter(offer => {
    if (filters.serviceType && offer.serviceType !== filters.serviceType) return false;
    
    const price = parseFloat(offer.price.replace('$', ''));
    if (filters.minPrice && price < filters.minPrice) return false;
    if (filters.maxPrice && price > filters.maxPrice) return false;
    
    if (filters.location && !offer.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    if (filters.rating && offer.rating < filters.rating) return false;
    
    return true;
  });
};

// Get related offers (same service type, same location)
export const getRelatedOffers = (currentOffer: Offer, limit: number = 3): Offer[] => {
  return mockOffers
    .filter(offer => 
      offer.id !== currentOffer.id &&
      offer.serviceType === currentOffer.serviceType &&
      offer.location === currentOffer.location
    )
    .slice(0, limit);
};