// app/search/index.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { mockOffers } from '../data/mockServices';

// ========== TYPES ==========
type ServiceType = 'hotels' | 'tours' | 'cars' | 'flights' | 'spaces' | 'events' | 'all';

interface Service {
  id: ServiceType;
  name: string;
  icon: string;
}

interface City {
  id: number;
  name: string;
}

// ========== CONSTANTS ==========
const SERVICES: Service[] = [
  { id: 'all', name: 'All Offers', icon: 'grid' },
  { id: 'hotels', name: 'Hotels', icon: 'home' },
  { id: 'tours', name: 'Tours', icon: 'map' },
  { id: 'cars', name: 'Cars', icon: 'car' },
  { id: 'flights', name: 'Flights', icon: 'airplay' },
  { id: 'spaces', name: 'Spaces', icon: 'briefcase' },
  { id: 'events', name: 'Events', icon: 'calendar' },
];

// ========== UTILITY FUNCTIONS ==========
const formatDateForDisplay = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const calculateDaysBetween = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getUniqueCities = (): City[] => {
  const cities = new Set<string>();
  mockOffers.forEach(offer => {
    if (offer.location) {
      cities.add(offer.location.split(',')[0].trim());
    }
  });
  return Array.from(cities).map((city, index) => ({
    id: index + 1,
    name: city,
  }));
};

// ========== REUSABLE COMPONENTS ==========
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onSubmitEditing?: () => void;
}

const SearchInput = ({ value, onChangeText, placeholder, onSubmitEditing }: SearchInputProps) => (
  <View style={styles.inputContainer}>
    <Feather name="search" size={18} color="#666666" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#999999"
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
      onSubmitEditing={onSubmitEditing}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
        <Feather name="x" size={16} color="#999999" />
      </TouchableOpacity>
    )}
  </View>
);

interface CityDropdownProps {
  value: string;
  onSelect: (city: string) => void;
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  icon?: string;
}

const CityDropdown = ({ value, onSelect, placeholder, isOpen, onToggle, icon = 'map-pin' }: CityDropdownProps) => {
  const cities = getUniqueCities();
  
  const handleSelect = (city: string) => {
    onSelect(city);
    onToggle(); // Close dropdown after selection
  };
  
  return (
    <>
      <View style={styles.inputContainer}>
        <Feather name={icon as any} size={18} color="#666666" style={styles.inputIcon} />
        <TouchableOpacity style={styles.dropdownTrigger} onPress={onToggle}>
          <Text style={value ? styles.dropdownTextSelected : styles.dropdownText}>
            {value || placeholder}
          </Text>
          <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#666666" />
        </TouchableOpacity>
      </View>

      {isOpen && (
        <View style={styles.dropdown}>
          <ScrollView 
            style={styles.dropdownList}
            keyboardShouldPersistTaps="always"
          >
            {cities.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={styles.dropdownItem}
                onPress={() => handleSelect(city.name)}
              >
                <Feather name="map-pin" size={14} color="#666666" />
                <Text style={styles.dropdownItemText}>{city.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  onStartPress: () => void;
  onEndPress: () => void;
  startLabel: string;
  endLabel: string;
  showDuration?: boolean;
  durationLabel?: string;
}

const DateRangeSelector = ({
  startDate,
  endDate,
  onStartPress,
  onEndPress,
  startLabel,
  endLabel,
  showDuration = false,
  durationLabel = 'day(s)',
}: DateRangeSelectorProps) => (
  <View style={styles.datesRow}>
    <TouchableOpacity style={styles.dateButton} onPress={onStartPress}>
      <Feather name="calendar" size={16} color="#0026ff" style={styles.dateIcon} />
      <View>
        <Text style={styles.dateLabel}>{startLabel}</Text>
        <Text style={styles.dateValue}>{formatDateForDisplay(startDate)}</Text>
      </View>
    </TouchableOpacity>

    <View style={styles.dateSeparator}>
      <Feather name="arrow-right" size={14} color="#999999" />
      {showDuration && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            {calculateDaysBetween(startDate, endDate)} {durationLabel}
          </Text>
        </View>
      )}
    </View>

    <TouchableOpacity style={styles.dateButton} onPress={onEndPress}>
      <Feather name="calendar" size={16} color="#0026ff" style={styles.dateIcon} />
      <View>
        <Text style={styles.dateLabel}>{endLabel}</Text>
        <Text style={styles.dateValue}>{formatDateForDisplay(endDate)}</Text>
      </View>
    </TouchableOpacity>
  </View>
);

interface CounterProps {
  label: string;
  subLabel: string;
  value: number;
  min: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const Counter = ({ label, subLabel, value, min, max = 99, onIncrement, onDecrement }: CounterProps) => (
  <View style={styles.counterRow}>
    <View style={styles.counterLabelContainer}>
      <Text style={styles.counterLabel}>{label}</Text>
      <Text style={styles.counterSubLabel}>{subLabel}</Text>
    </View>
    <View style={styles.counterButtons}>
      <TouchableOpacity
        style={[styles.counterButton, value <= min && styles.counterButtonDisabled]}
        onPress={onDecrement}
        disabled={value <= min}
      >
        <Feather name="minus" size={16} color={value <= min ? '#CCCCCC' : '#666666'} />
      </TouchableOpacity>
      <Text style={styles.counterValue}>{value}</Text>
      <TouchableOpacity
        style={[styles.counterButton, value >= max && styles.counterButtonDisabled]}
        onPress={onIncrement}
        disabled={value >= max}
      >
        <Feather name="plus" size={16} color={value >= max ? '#CCCCCC' : '#666666'} />
      </TouchableOpacity>
    </View>
  </View>
);

// ========== MAIN COMPONENT ==========
export default function SearchScreen() {
  const router = useRouter();
  
  const [activeService, setActiveService] = useState<ServiceType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000));
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState<'in' | 'out' | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean | 'from' | 'to'>(false);
  const [maxPrice, setMaxPrice] = useState(500);
  const [minRating, setMinRating] = useState(3);

  const handleSearch = () => {
  // Title/query is now the main search - REQUIRED
  if (!searchQuery.trim()) {
    alert('Please enter a search term (hotel name, car model, tour name, etc.)');
    return;
  }

  // Date validation for services that need dates
  if (['hotels', 'tours', 'cars', 'spaces'].includes(activeService)) {
    if (checkInDate >= checkOutDate) {
      alert('End date must be after start date');
      return;
    }
  }

  // Special validation for flights: needs from/to OR search query
  if (activeService === 'flights') {
    if (!flightFrom.trim() && !flightTo.trim() && !searchQuery.trim()) {
      alert('Please enter flight details or search term');
      return;
    }
  }

  // ✅ Prepare params for API search
  const baseParams: any = {
    // IMPORTANT: Use 'query' instead of 'search' to match results.tsx
    query: searchQuery.trim(),
    service: activeService === 'all' ? undefined : activeService,
    maxPrice: maxPrice.toString(),
    rating: minRating.toString(), // Changed from minRating to rating
  };

  // Add optional location if provided
  if (location.trim()) {
    baseParams.location = location.trim();
  }

  // Add service-specific parameters
  switch (activeService) {
    case 'all':
      // For all, just send search term and optional location
      if (location.trim()) {
        baseParams.location = location;
      }
      baseParams.startDate = checkInDate.toISOString();
      baseParams.endDate = checkOutDate.toISOString();
      break;

    case 'hotels':
      if (location.trim()) baseParams.location = location;
      baseParams.checkIn = checkInDate.toISOString();
      baseParams.checkOut = checkOutDate.toISOString();
      baseParams.adults = adults.toString();
      baseParams.children = children.toString();
      baseParams.rooms = rooms.toString();
      break;

    case 'tours':
    case 'cars':
      if (location.trim()) baseParams.location = location;
      baseParams.startDate = checkInDate.toISOString();
      baseParams.endDate = checkOutDate.toISOString();
      break;

    case 'flights':
      if (flightFrom.trim()) baseParams.from = flightFrom.trim();
      if (flightTo.trim()) baseParams.to = flightTo.trim();
      baseParams.date = checkInDate.toISOString();
      break;

    case 'spaces':
      if (location.trim()) baseParams.location = location;
      baseParams.startDate = checkInDate.toISOString();
      baseParams.endDate = checkOutDate.toISOString();
      break;

    case 'events':
      if (location.trim()) baseParams.location = location;
      baseParams.date = checkInDate.toISOString();
      break;
  }

  console.log('🔍 Search params:', baseParams);
  
  router.push({
    pathname: '/search/results',
    params: baseParams,
  });
};



  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDatePicker(null);
      return;
    }

    setShowDatePicker(null);
    
    if (selectedDate) {
      if (showDatePicker === 'in') {
        const newDate = new Date(selectedDate);
        setCheckInDate(newDate);
        
        if (checkOutDate <= newDate) {
          const nextDay = new Date(newDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setCheckOutDate(nextDay);
        }
      } else if (showDatePicker === 'out') {
        const newDate = new Date(selectedDate);
        if (newDate > checkInDate) {
          setCheckOutDate(newDate);
        } else {
          alert('Return date must be after departure date');
        }
      }
    }
  };

 const renderServiceSpecificInputs = () => {
  switch (activeService) {
    case 'all':
      return (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name (hotel, car, tour...)"
            onSubmitEditing={handleSearch}
          />

          <CityDropdown
            value={location}
            onSelect={setLocation}
            placeholder="City (optional)"
            isOpen={showCityDropdown === true}
            onToggle={() => setShowCityDropdown(showCityDropdown === true ? false : true)}
          />

          <DateRangeSelector
            startDate={checkInDate}
            endDate={checkOutDate}
            onStartPress={() => setShowDatePicker('in')}
            onEndPress={() => setShowDatePicker('out')}
            startLabel="Start Date"
            endLabel="End Date"
            showDuration
            durationLabel="day(s)"
          />
        </>
      );

    case 'hotels':
      return (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search hotel by name..."
            onSubmitEditing={handleSearch}
          />

          <CityDropdown
            value={location}
            onSelect={setLocation}
            placeholder="City (optional)"
            isOpen={showCityDropdown === true}
            onToggle={() => setShowCityDropdown(showCityDropdown === true ? false : true)}
          />

          <DateRangeSelector
            startDate={checkInDate}
            endDate={checkOutDate}
            onStartPress={() => setShowDatePicker('in')}
            onEndPress={() => setShowDatePicker('out')}
            startLabel="Check-in"
            endLabel="Check-out"
            showDuration
            durationLabel="night(s)"
          />

          <View style={styles.guestsCard}>
            <Text style={styles.guestsTitle}>Guests & Rooms</Text>
            
            <Counter
              label="Adults"
              subLabel="Age 13+"
              value={adults}
              min={1}
              onIncrement={() => setAdults(prev => prev + 1)}
              onDecrement={() => setAdults(prev => Math.max(1, prev - 1))}
            />
            
            <View style={styles.counterDivider} />
            
            <Counter
              label="Children"
              subLabel="Age 0-12"
              value={children}
              min={0}
              onIncrement={() => setChildren(prev => prev + 1)}
              onDecrement={() => setChildren(prev => Math.max(0, prev - 1))}
            />
            
            <View style={styles.counterDivider} />
            
            <Counter
              label="Rooms"
              subLabel="Number of rooms"
              value={rooms}
              min={1}
              onIncrement={() => setRooms(prev => prev + 1)}
              onDecrement={() => setRooms(prev => Math.max(1, prev - 1))}
            />
          </View>
        </>
      );

    case 'tours':
      return (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tour by name or destination..."
            onSubmitEditing={handleSearch}
          />

          <CityDropdown
            value={location}
            onSelect={setLocation}
            placeholder="Tour location (optional)"
            isOpen={showCityDropdown === true}
            onToggle={() => setShowCityDropdown(showCityDropdown === true ? false : true)}
          />

          <DateRangeSelector
            startDate={checkInDate}
            endDate={checkOutDate}
            onStartPress={() => setShowDatePicker('in')}
            onEndPress={() => setShowDatePicker('out')}
            startLabel="Departure Date"
            endLabel="Return Date"
            showDuration
            durationLabel="day(s)"
          />
        </>
      );

    case 'cars':
      return (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search car by model or brand..."
            onSubmitEditing={handleSearch}
          />

          <CityDropdown
            value={location}
            onSelect={setLocation}
            placeholder="Pickup city (optional)"
            isOpen={showCityDropdown === true}
            onToggle={() => setShowCityDropdown(showCityDropdown === true ? false : true)}
          />

          <DateRangeSelector
            startDate={checkInDate}
            endDate={checkOutDate}
            onStartPress={() => setShowDatePicker('in')}
            onEndPress={() => setShowDatePicker('out')}
            startLabel="Pick-up Date"
            endLabel="Return Date"
            showDuration
            durationLabel="day(s)"
          />
        </>
      );

    case 'flights':
      return (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search flight by airline or code..."
            onSubmitEditing={handleSearch}
          />

          <CityDropdown
            value={flightFrom}
            onSelect={setFlightFrom}
            placeholder="Departure city (optional)"
            isOpen={showCityDropdown === 'from'}
            onToggle={() => setShowCityDropdown(showCityDropdown === 'from' ? false : 'from')}
            icon="map-pin"
          />

          <CityDropdown
            value={flightTo}
            onSelect={setFlightTo}
            placeholder="Destination city (optional)"
            isOpen={showCityDropdown === 'to'}
            onToggle={() => setShowCityDropdown(showCityDropdown === 'to' ? false : 'to')}
            icon="flag"
          />

          <DateRangeSelector
            startDate={checkInDate}
            endDate={checkOutDate}
            onStartPress={() => setShowDatePicker('in')}
            onEndPress={() => setShowDatePicker('out')}
            startLabel="Departure Date"
            endLabel="Return Date"
            showDuration
            durationLabel="day(s)"
          />
        </>
      );

    case 'spaces':
      return (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search space by name or type..."
            onSubmitEditing={handleSearch}
          />

          <CityDropdown
            value={location}
            onSelect={setLocation}
            placeholder="Workspace city (optional)"
            isOpen={showCityDropdown === true}
            onToggle={() => setShowCityDropdown(showCityDropdown === true ? false : true)}
          />

          <DateRangeSelector
            startDate={checkInDate}
            endDate={checkOutDate}
            onStartPress={() => setShowDatePicker('in')}
            onEndPress={() => setShowDatePicker('out')}
            startLabel="Start Date"
            endLabel="End Date"
            showDuration
            durationLabel="day(s)"
          />
        </>
      );

    case 'events':
      return (
        <>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search event by name..."
            onSubmitEditing={handleSearch}
          />

          <CityDropdown
            value={location}
            onSelect={setLocation}
            placeholder="Event city (optional)"
            isOpen={showCityDropdown === true}
            onToggle={() => setShowCityDropdown(showCityDropdown === true ? false : true)}
          />

          <DateRangeSelector
            startDate={checkInDate}
            endDate={checkOutDate}
            onStartPress={() => setShowDatePicker('in')}
            onEndPress={() => setShowDatePicker('out')}
            startLabel="Event Date"
            endLabel="End Date"
            showDuration
            durationLabel="day(s)"
          />
        </>
      );

    default:
      return null;
  }
};

  // Reset specific states when switching from service-specific to all or vice versa
  const handleServiceChange = (serviceId: ServiceType) => {
    setActiveService(serviceId);
    setShowCityDropdown(false);
    
    // Reset some states when switching services
    setSearchQuery('');
    setLocation('');
    setFlightFrom('');
    setFlightTo('');
    
    // Reset counters for non-hotel services
    if (serviceId !== 'hotels') {
      setAdults(2);
      setChildren(0);
      setRooms(1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search</Text>
          <View style={styles.backButton} />
        </View>

        {/* Service Tabs with All Offers */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesContainer}
        >
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceTab,
                activeService === service.id && styles.serviceTabActive,
                service.id === 'all' && styles.allOffersTab,
              ]}
              onPress={() => handleServiceChange(service.id)}
            >
              <Feather
                name={service.icon as any}
                size={18}
                color={activeService === service.id ? '#FFFFFF' : '#666666'}
              />
              <Text
                style={[
                  styles.serviceTabText,
                  activeService === service.id && styles.serviceTabTextActive,
                ]}
              >
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Search Form */}
        <View style={styles.form}>
          {/* Service Specific Inputs */}
          {renderServiceSpecificInputs()}

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={showDatePicker === 'in' ? checkInDate : checkOutDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              maximumDate={new Date(2100, 0, 1)}
              textColor="#1A1A1A"
              themeVariant="light"
              style={Platform.OS === 'ios' ? styles.datePickerIOS : styles.datePickerAndroid}
            />
          )}

          {/* Max Price Filter - Always shown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maximum Price</Text>
            <View style={styles.priceRange}>
              <Text style={styles.priceLabel}>Up to</Text>
              <Text style={styles.priceValue}>${maxPrice}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1000}
              minimumTrackTintColor="#0026ff"
              maximumTrackTintColor="#E5E5E5"
              thumbTintColor="#0026ff"
              value={maxPrice}
              onValueChange={setMaxPrice}
              step={10}
            />
            <Text style={styles.priceDescription}>
              Shows offers with price ≤ ${maxPrice}
            </Text>
          </View>

          {/* Minimum Rating Filter - Always shown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.starRating}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Feather
                    key={star}
                    name="star"
                    size={20}
                    color={star <= minRating ? '#FFD700' : '#E5E5E5'}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{minRating}+ stars</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              minimumTrackTintColor="#0026ff"
              maximumTrackTintColor="#E5E5E5"
              thumbTintColor="#0026ff"
              value={minRating}
              onValueChange={setMinRating}
            />
            <Text style={styles.ratingDescription}>
              Shows offers with rating ≥ {minRating} stars
            </Text>
          </View>

          {/* Search Button */}
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearch}
            activeOpacity={0.85}
          >
            <Feather name="search" size={18} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>
              {activeService === 'all' ? 'Search All Offers' : `Search ${activeService}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
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
    color: '#0026ff',
  },
  filterButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  servicesContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  serviceTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F5F5F5', borderRadius: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  allOffersTab: { borderColor: '#FF6B35' },
  serviceTabActive: { backgroundColor: '#0026ff', borderColor: '#0026ff' },
  serviceTabText: { fontSize: 13, fontWeight: '600', color: '#666666' },
  serviceTabTextActive: { color: '#FFFFFF' },
  form: { paddingHorizontal: 16, paddingBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 12, paddingHorizontal: 14, height: 48 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', height: '100%', paddingVertical: 0 },
  clearButton: { padding: 4, marginLeft: 6 },
  dropdownTrigger: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: '100%' },
  dropdownText: { fontSize: 15, color: '#999999' },
  dropdownTextSelected: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  dropdown: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5E5', marginTop: -6, marginBottom: 12, maxHeight: 180, zIndex: 1000, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  dropdownList: { padding: 6 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 15, color: '#1A1A1A' },
  datesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5E5', padding: 14, marginBottom: 12 },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateSeparator: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  durationContainer: { backgroundColor: '#E8F5F0', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginTop: 3 },
  durationText: { fontSize: 9, color: '#0026ff', fontWeight: '500' },
  dateIcon: {},
  dateLabel: { fontSize: 11, color: '#666666', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  datePickerIOS: { height: 180, marginTop: 8 },
  datePickerAndroid: { marginTop: 8 },
  guestsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 20 },
  guestsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterLabelContainer: { flex: 1 },
  counterLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', marginBottom: 2 },
  counterSubLabel: { fontSize: 11, color: '#666666' },
  counterButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  counterButtonDisabled: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E5E5E5' },
  counterValue: { fontSize: 16, fontWeight: 'bold', color: '#0026ff', minWidth: 20, textAlign: 'center' },
  counterDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  priceRange: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 6 },
  priceLabel: { fontSize: 15, color: '#666666' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#0026ff' },
  priceDescription: { fontSize: 11, color: '#999999', textAlign: 'center', marginTop: 6 },
  slider: { width: '100%', height: 36 },
  starRating: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  stars: { flexDirection: 'row', gap: 3 },
  ratingText: { fontSize: 13, color: '#666666' },
  ratingDescription: { fontSize: 11, color: '#999999', textAlign: 'center', marginTop: 6 },
  searchButton: { backgroundColor: '#0026ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, marginTop: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
