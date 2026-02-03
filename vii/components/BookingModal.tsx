import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather, Ionicons } from '@expo/vector-icons';

// TODO: adjust this path to your project
// Example if BookingModal is in /components and api is in /app/api:
import apiService from '../app/api/react_native_api';

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  specialRequests: string;

  checkIn?: Date;     // used by: hotel/car/boat/space
  checkOut?: Date;    // used by: hotel/car/space
  date?: Date;        // used by: event/tour (if you keep them later)

  time?: string;      // start time HH:MM:SS
  returnTime?: string; // return time HH:MM:SS (car only)

  adults: number;
  children: number;
  rooms: number;

  // ✅ hotel
  selectedRoomId?: number;

  // ✅ boat
  boatDurationType?: 'day' | 'hour';
  boatDurationValue?: number;
}

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: BookingFormData) => void;
  offer: {
    id: number;
    title: string;
    serviceType: string;
    price: string;
    pricePeriod: string;
    images: string[];
    location: string;
  };
}

type DatePickerField = 'checkIn' | 'checkOut' | 'date';
type TimePickerField = 'start' | 'return';

const toHHMMSS = (t?: string) => {
  if (!t) return undefined;
  return t.length === 5 ? `${t}:00` : t; // "13:12" => "13:12:00"
};

const formatDate = (date?: Date) => {
  if (!date) return 'Select Date';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const BookingModal: React.FC<BookingModalProps> = ({ visible, onClose, onConfirm, offer }) => {
  const serviceType = (offer.serviceType || '').toLowerCase();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
    adults: 1,
    children: 0,
    rooms: 1,
    checkIn: undefined as Date | undefined,
    checkOut: undefined as Date | undefined,
    date: undefined as Date | undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState<DatePickerField | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<TimePickerField | null>(null);

  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedReturnTime, setSelectedReturnTime] = useState('18:00');

  // ✅ Hotel rooms
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // ✅ Boat duration
  const [boatDurationType, setBoatDurationType] = useState<'day' | 'hour'>('hour');
  const [boatDurationValue, setBoatDurationValue] = useState<number>(1);

  const serviceFields = useMemo(() => {
  switch (serviceType) {
    case 'hotel':
      return {
        showRangeDates: true,
        showSingleDate: false,
        showStartTime: false,
        showReturnTime: false,
        showGuests: true,
        showRoomsQty: true,
        showHotelRoomPick: true,
        showBoatDuration: false,
      };

    case 'car':
      return {
        showRangeDates: true,
        showSingleDate: false,
        showStartTime: true,
        showReturnTime: true,
        showGuests: true,
        showRoomsQty: false,
        showHotelRoomPick: false,
        showBoatDuration: false,
      };

    case 'boat':
      return {
        showRangeDates: false,
        showSingleDate: false,
        showStartTime: true,
        showReturnTime: false,
        showGuests: true,
        showRoomsQty: false,
        showHotelRoomPick: false,
        showBoatDuration: true,
      };

    case 'space':
      return {
        showRangeDates: true,
        showSingleDate: false,
        showStartTime: false,
        showReturnTime: false,
        showGuests: true,
        showRoomsQty: false,
        showHotelRoomPick: false,
        showBoatDuration: false,
      };

    case 'event':
    case 'tour':
      return {
        showRangeDates: false,
        showSingleDate: true,
        showStartTime: true,
        showReturnTime: false,
        showGuests: true,
        showRoomsQty: false,
        showHotelRoomPick: false,
        showBoatDuration: false,
      };

    default:
      return {
        showRangeDates: true,
        showSingleDate: false,
        showStartTime: false,
        showReturnTime: false,
        showGuests: true,
        showRoomsQty: false,
        showHotelRoomPick: false,
        showBoatDuration: false,
      };
  }
}, [serviceType]);

  // Reset on open
  useEffect(() => {
    if (!visible) return;

    setFormData({
      name: '',
      email: '',
      phone: '',
      specialRequests: '',
      adults: 1,
      children: 0,
      rooms: 1,
      checkIn: undefined,
      checkOut: undefined,
      date: undefined,
    });

    setSelectedTime('10:00');
    setSelectedReturnTime('18:00');

    setBoatDurationType('hour');
    setBoatDurationValue(1);

    setHotelRooms([]);
    setSelectedRoomId(null);
    setRoomsLoading(false);
  }, [visible]);

  // Fetch hotel rooms (only if hotel)
  useEffect(() => {
  const run = async () => {
    if (!visible) return;
    if (serviceType !== 'hotel') return;
    
    setRoomsLoading(true);
    try {
const res = await apiService.getHotelRooms(offer.id);

      if (!res?.success || !res?.data) {
        setHotelRooms([]);
        setSelectedRoomId(null);
        return;
      }

      console.log('HOTEL detail id:', offer.id);
console.log('HOTEL detail success:', res?.success);
console.log('HOTEL detail keys:', Object.keys(res?.data || {}));
      const raw: any = res.data;
      const rooms = raw?.rooms || raw?.data?.rooms || [];
      const list = Array.isArray(rooms) ? rooms : [];

      setHotelRooms(list);
      setSelectedRoomId(list.length ? (list[0]?.id ?? null) : null);
    } catch (e) {
      setHotelRooms([]);
      setSelectedRoomId(null);
    } finally {
      setRoomsLoading(false);
    }
  };

  run();
}, [visible, serviceType, offer.id]);

  const handleDateChange = (_event: any, selected?: Date) => {
    if (!showDatePicker) return;

    setShowDatePicker(null);
    if (!selected) return;

    setFormData((prev) => ({
      ...prev,
      [showDatePicker]: selected,
    }));
  };

  const handleTimeChange = (_event: any, selected?: Date) => {
    const t = showTimePicker;
    setShowTimePicker(null);

    if (!selected || !t) return;

    const timeString = selected.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (t === 'start') setSelectedTime(timeString);
    if (t === 'return') setSelectedReturnTime(timeString);
  };

  const calculateTotalPrice = () => {
  const basePrice = parseFloat(offer.price) || 0;

  if (serviceType === 'hotel' && formData.checkIn && formData.checkOut) {
    const diff = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return (basePrice * nights * formData.rooms).toFixed(2);
  }

  if (serviceType === 'space' && formData.checkIn && formData.checkOut) {
    const diff = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return (basePrice * days).toFixed(2);
  }

  if (serviceType === 'car' && formData.checkIn && formData.checkOut) {
    const diff = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return (basePrice * days).toFixed(2);
  }

  if (serviceType === 'boat') {
    return basePrice.toFixed(2);
  }

  return (basePrice * formData.adults).toFixed(2);
};


  const validateAndSubmit = () => {
  if (!formData.name.trim()) return Alert.alert('Error', 'Please enter your name');
  if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return Alert.alert('Error', 'Please enter a valid email address');
  if (!formData.phone.trim()) return Alert.alert('Error', 'Please enter your phone number');

  if (serviceFields.showRangeDates) {
    if (!formData.checkIn) return Alert.alert('Error', 'Please select start date');
    if (!formData.checkOut) return Alert.alert('Error', 'Please select end date');
  }

  if (serviceFields.showSingleDate) {
    if (!formData.date) return Alert.alert('Error', 'Please select a date');
  }

  if (serviceType === 'hotel') {
    if (roomsLoading) return Alert.alert('Error', 'Please wait, loading rooms...');
    if (!selectedRoomId) return Alert.alert('Error', 'Please select a room');
    if (!formData.rooms || formData.rooms < 1) return Alert.alert('Error', 'Please select number of rooms');
  }

  if (serviceType === 'car') {
    if (!formData.checkIn || !formData.checkOut) return Alert.alert('Error', 'Please select pickup and return dates');
    if (!selectedTime) return Alert.alert('Error', 'Please select pickup time');
    if (!selectedReturnTime) return Alert.alert('Error', 'Please select return time');
  }

  if (serviceType === 'boat') {
    if (!formData.checkIn) return Alert.alert('Error', 'Please select departure date');
    if (!selectedTime) return Alert.alert('Error', 'Please select departure time');
    if (!boatDurationValue || boatDurationValue < 1) return Alert.alert('Error', 'Please select duration');
  }

  const submitData: BookingFormData = {
    name: formData.name.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    specialRequests: formData.specialRequests,

    checkIn: formData.checkIn,
    checkOut: serviceType === 'boat' ? undefined : formData.checkOut,
    date: formData.date,

    time: serviceFields.showStartTime ? toHHMMSS(selectedTime) : undefined,
    returnTime: serviceFields.showReturnTime ? toHHMMSS(selectedReturnTime) : undefined,

    adults: formData.adults,
    children: formData.children,

    rooms: serviceType === 'hotel' ? formData.rooms : 1,
    selectedRoomId: serviceType === 'hotel' ? selectedRoomId ?? undefined : undefined,

    boatDurationType: serviceType === 'boat' ? boatDurationType : undefined,
    boatDurationValue: serviceType === 'boat' ? boatDurationValue : undefined,
  };

  onConfirm(submitData);
};


  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Book {offer.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Price */}
            <View style={styles.priceSummary}>
              <Text style={styles.priceLabel}>Price</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>DH {offer.price}</Text>
                <Text style={styles.pricePeriod}>/{offer.pricePeriod}</Text>
              </View>

              <View style={styles.location}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={{ marginLeft: 6, color: '#666' }}>{offer.location}</Text>
              </View>
            </View>

            {/* Dates */}
            {serviceFields.showRangeDates && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Dates</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker('checkIn')}>
                    <Text style={styles.dateLabel}>{serviceType === 'car' ? 'Pickup' : 'Start'}</Text>
                    <Text style={styles.dateValue}>{formatDate(formData.checkIn)}</Text>
                  </TouchableOpacity>

                  <Feather name="arrow-right" size={16} color="#666" style={styles.dateArrow} />

                  <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker('checkOut')}>
                    <Text style={styles.dateLabel}>{serviceType === 'car' ? 'Return' : 'End'}</Text>
                    <Text style={styles.dateValue}>{formatDate(formData.checkOut)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {serviceFields.showSingleDate && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Date</Text>
                <TouchableOpacity style={styles.fullDateInput} onPress={() => setShowDatePicker('date')}>
                  <Text style={styles.dateLabel}>Date</Text>
                  <Text style={styles.dateValue}>{formatDate(formData.date)}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Boat date (single start date only) */}
            {serviceType === 'boat' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Departure date</Text>
                <TouchableOpacity style={styles.fullDateInput} onPress={() => setShowDatePicker('checkIn')}>
                  <Text style={styles.dateLabel}>Date</Text>
                  <Text style={styles.dateValue}>{formatDate(formData.checkIn)}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Time */}
            {serviceFields.showStartTime && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{serviceType === 'car' ? 'Pickup / Return time' : 'Time'}</Text>

                {serviceFields.showReturnTime ? (
                  <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowTimePicker('start')}>
                      <Text style={styles.dateLabel}>Pickup time</Text>
                      <Text style={styles.dateValue}>{selectedTime}</Text>
                    </TouchableOpacity>

                    <Feather name="arrow-right" size={16} color="#666" style={styles.dateArrow} />

                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowTimePicker('return')}>
                      <Text style={styles.dateLabel}>Return time</Text>
                      <Text style={styles.dateValue}>{selectedReturnTime}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.fullDateInput} onPress={() => setShowTimePicker('start')}>
                    <Text style={styles.dateLabel}>Start time</Text>
                    <Text style={styles.dateValue}>{selectedTime}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Boat duration */}
            {serviceFields.showBoatDuration && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Duration</Text>

                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, boatDurationType === 'hour' && styles.toggleBtnActive]}
                    onPress={() => setBoatDurationType('hour')}
                  >
                    <Text style={[styles.toggleText, boatDurationType === 'hour' && styles.toggleTextActive]}>Hour</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, boatDurationType === 'day' && styles.toggleBtnActive]}
                    onPress={() => setBoatDurationType('day')}
                  >
                    <Text style={[styles.toggleText, boatDurationType === 'day' && styles.toggleTextActive]}>Day</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.counter, { marginTop: 12 }]}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setBoatDurationValue((v) => Math.max(1, v - 1))}
                  >
                    <Feather name="minus" size={16} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.counterValue}>{boatDurationValue}</Text>

                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setBoatDurationValue((v) => v + 1)}
                  >
                    <Feather name="plus" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Guests */}
            {serviceFields.showGuests && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Guests</Text>

                <View style={styles.counterRow}>
                  <View style={styles.counterGroup}>
                    <Text style={styles.counterLabel}>Adults</Text>
                    <View style={styles.counter}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setFormData((p) => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                      >
                        <Feather name="minus" size={16} color="#666" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{formData.adults}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setFormData((p) => ({ ...p, adults: p.adults + 1 }))}
                      >
                        <Feather name="plus" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.counterGroup}>
                    <Text style={styles.counterLabel}>Children</Text>
                    <View style={styles.counter}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setFormData((p) => ({ ...p, children: Math.max(0, p.children - 1) }))}
                      >
                        <Feather name="minus" size={16} color="#666" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{formData.children}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setFormData((p) => ({ ...p, children: p.children + 1 }))}
                      >
                        <Feather name="plus" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Hotel room selection */}
            {serviceFields.showHotelRoomPick && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select room</Text>

                {roomsLoading ? (
                  <View style={{ paddingVertical: 8 }}>
                    <ActivityIndicator />
                    <Text style={{ marginTop: 8, color: '#666' }}>Loading rooms...</Text>
                  </View>
                ) : hotelRooms.length === 0 ? (
                  <Text style={{ color: '#666' }}>No rooms found for this hotel.</Text>
                ) : (
                  hotelRooms.map((room) => {
                    const active = selectedRoomId === room?.id;
                    return (
                      <TouchableOpacity
                        key={String(room?.id)}
                        style={[styles.roomOption, active && styles.roomOptionActive]}
                        onPress={() => setSelectedRoomId(room?.id)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.roomTitle}>{room?.title || `Room #${room?.id}`}</Text>
                        {!!room?.price && <Text style={styles.roomPrice}>DH {room.price}</Text>}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* Hotel rooms qty */}
            {serviceFields.showRoomsQty && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rooms quantity</Text>

                <View style={styles.counter}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setFormData((p) => ({ ...p, rooms: Math.max(1, p.rooms - 1) }))}
                  >
                    <Feather name="minus" size={16} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.counterValue}>{formData.rooms}</Text>

                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => setFormData((p) => ({ ...p, rooms: p.rooms + 1 }))}
                  >
                    <Feather name="plus" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Contact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChangeText={(t) => setFormData((p) => ({ ...p, email: t }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+212 6xx xxx xxx"
                  value={formData.phone}
                  onChangeText={(t) => setFormData((p) => ({ ...p, phone: t }))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Special Requests */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special requests (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special requirements?"
                value={formData.specialRequests}
                onChangeText={(t) => setFormData((p) => ({ ...p, specialRequests: t }))}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Total */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>DH {calculateTotalPrice()}</Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={validateAndSubmit}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
              <Feather name="check" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={(formData as any)[showDatePicker] || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', flex: 1, paddingRight: 10 },
  closeButton: { padding: 4 },

  priceSummary: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  priceLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  priceValue: { fontSize: 24, fontWeight: 'bold', color: '#1014d7' },
  pricePeriod: { fontSize: 14, color: '#666', marginLeft: 4 },
  location: { flexDirection: 'row', alignItems: 'center' },

  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },

  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateInput: { flex: 1, padding: 12, backgroundColor: '#F8F9FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5E5' },
  fullDateInput: { padding: 12, backgroundColor: '#F8F9FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5E5' },
  dateLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  dateValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  dateArrow: { marginHorizontal: 12 },

  counterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  counterGroup: { flex: 1, marginRight: 16 },
  counterLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  counterButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  counterValue: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', minWidth: 40, textAlign: 'center' },

  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#0026ff' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#666' },
  toggleTextActive: { color: '#FFFFFF' },

  roomOption: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#F8F9FA', marginBottom: 10 },
  roomOptionActive: { backgroundColor: '#FFFFFF', borderColor: '#0026ff' },
  roomTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  roomPrice: { marginTop: 4, fontSize: 12, color: '#666' },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A1A', backgroundColor: '#F8F9FA' },
  textArea: { height: 100, textAlignVertical: 'top' },

  totalSection: { padding: 20, backgroundColor: '#F8F9FA', borderTopWidth: 1, borderTopColor: '#E5E5E5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#1014d7' },

  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', marginRight: 12 },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  confirmButton: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#1014d7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginRight: 8 },
});

export default BookingModal;



// import React, { useState, useEffect } from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   Platform,
//   Alert,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { Feather } from '@expo/vector-icons';

// // ✅ Export the interface so id.tsx can import it
// export interface BookingFormData {
//   // Common fields
//   name: string;
//   email: string;
//   phone: string;
//   specialRequests: string;
//   // Date/Time fields
//   checkIn?: Date;
//   checkOut?: Date;
//   date?: Date;
//   time?: string;
//   returnTime?: string;
//   // Guest fields
//   adults: number;
//   children: number;
//   rooms: number;
// }

// interface BookingModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onConfirm: (data: BookingFormData) => void;
//   offer: {
//     id: number;
//     title: string;
//     serviceType: string;
//     price: string;
//     pricePeriod: string;
//     images: string[];
//     location: string;
//   };
// }

// const BookingModal: React.FC<BookingModalProps> = ({
//   visible,
//   onClose,
//   onConfirm,
//   offer,
// }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     specialRequests: '',
//     adults: 1,
//     children: 0,
//     rooms: 1,
//   });
//   const [showDatePicker, setShowDatePicker] = useState<'checkIn' | 'checkOut' | 'date' | null>(null);
//   const [showTimePicker, setShowTimePicker] = useState<'start' | 'return' | null>(null);
//   const [selectedTime, setSelectedTime] = useState('10:00');
//   const [selectedReturnTime, setSelectedReturnTime] = useState('18:00');

//   // Reset form when modal opens
//   useEffect(() => {
//     if (visible) {
//       setFormData({
//         name: '',
//         email: '',
//         phone: '',
//         specialRequests: '',
//         adults: 1,
//         children: 0,
//         rooms: 1,
//       });
//       setSelectedTime('10:00');
//       setSelectedReturnTime('18:00');
//     }
//   }, [visible]);

//   const getServiceSpecificFields = () => {
//     const serviceType = offer.serviceType?.toLowerCase();
//     switch (serviceType) {
//       case 'hotel':
//         return {
//           showDates: true,
//           showGuestCount: true,
//           showRooms: true,
//           showTime: false,
//           showReturnTime: false,
//           showSingleDate: false,
//           guestLabel: 'Guests',
//           dateLabel: 'Check-in / Check-out',
//         };
//       case 'tour':
//         return {
//           showDates: false,
//           showGuestCount: true,
//           showRooms: false,
//           showTime: true,
//           showReturnTime: false,
//           showSingleDate: true,
//           guestLabel: 'Participants',
//           dateLabel: 'Tour Date',
//         };
//       case 'car':
//         return {
//           showDates: true,
//           showGuestCount: true,
//           showRooms: false,
//           showTime: true,
//           showReturnTime: true,
//           showSingleDate: false,
//           guestLabel: 'Passengers',
//           dateLabel: 'Pickup / Return',
//         };
//       case 'event':
//         return {
//           showDates: false,
//           showGuestCount: true,
//           showRooms: false,
//           showTime: true,
//           showReturnTime: false,
//           showSingleDate: true,
//           guestLabel: 'Tickets',
//           dateLabel: 'Event Date',
//         };
//       case 'boat':
//         return {
//           showDates: true,
//           showGuestCount: true,
//           showRooms: false,
//           showTime: true,
//           showReturnTime: true,
//           showSingleDate: false,
//           guestLabel: 'Guests',
//           dateLabel: 'Departure / Return',
//         };
//       case 'space':
//         return {
//           showDates: true,
//           showGuestCount: true,
//           showRooms: false,
//           showTime: false,
//           showReturnTime: false,
//           showSingleDate: false,
//           guestLabel: 'Guests',
//           dateLabel: 'Start / End Date',
//         };
//       default:
//         return {
//           showDates: true,
//           showGuestCount: true,
//           showRooms: false,
//           showTime: false,
//           showReturnTime: false,
//           showSingleDate: false,
//           guestLabel: 'Guests',
//           dateLabel: 'Select Dates',
//         };
//     }
//   };

//   const serviceFields = getServiceSpecificFields();

//   const handleDateChange = (event: any, selectedDate?: Date) => {
//     if (showDatePicker && selectedDate) {
//       setFormData({
//         ...formData,
//         [showDatePicker]: selectedDate,
//       });
//     }
//     setShowDatePicker(null);
//   };

//   const handleTimeChange = (event: any, selectedDateTime?: Date) => {
//     const timeType = showTimePicker;
//     setShowTimePicker(null);
    
//     if (selectedDateTime && timeType) {
//       const timeString = selectedDateTime.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//       });
      
//       if (timeType === 'start') {
//         setSelectedTime(timeString);
//       } else if (timeType === 'return') {
//         setSelectedReturnTime(timeString);
//       }
//     }
//   };

//   const incrementAdults = () => setFormData({ ...formData, adults: formData.adults + 1 });
//   const decrementAdults = () => formData.adults > 1 && setFormData({ ...formData, adults: formData.adults - 1 });
//   const incrementChildren = () => setFormData({ ...formData, children: formData.children + 1 });
//   const decrementChildren = () => formData.children > 0 && setFormData({ ...formData, children: formData.children - 1 });
//   const incrementRooms = () => setFormData({ ...formData, rooms: formData.rooms + 1 });
//   const decrementRooms = () => formData.rooms > 1 && setFormData({ ...formData, rooms: formData.rooms - 1 });

//   const formatDate = (date?: Date) => {
//     if (!date) return 'Select Date';
//     return date.toLocaleDateString('en-US', {
//       weekday: 'short',
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//     });
//   };

//   const calculateTotalPrice = () => {
//     const basePrice = parseFloat(offer.price) || 0;
//     const serviceType = offer.serviceType?.toLowerCase();

//     if (serviceType === 'hotel' && formData.checkIn && formData.checkOut) {
//       const diffTime = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
//       const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return (basePrice * nights * formData.rooms).toFixed(2);
//     } else if ((serviceType === 'car' || serviceType === 'boat' || serviceType === 'space') && formData.checkIn && formData.checkOut) {
//       const diffTime = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
//       const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       return (basePrice * days).toFixed(2);
//     } else {
//       return (basePrice * formData.adults).toFixed(2);
//     }
//   };

//   const handleSubmit = () => {
//     const serviceType = offer.serviceType?.toLowerCase();
//     if (serviceFields.showDates && !formData.checkIn) {
//       Alert.alert('Error', 'Please select start date');
//       return;
//     }
//     if (serviceFields.showDates && !serviceFields.showSingleDate && !formData.checkOut) {
//       Alert.alert('Error', 'Please select end date');
//       return;
//     }
//     if (serviceFields.showSingleDate && !formData.date) {
//       Alert.alert('Error', 'Please select a date');
//       return;
//     }

//     // Build submit data
//     const submitData: BookingFormData = {
//       ...formData,
//       time: serviceFields.showTime ? selectedTime : undefined,
//       returnTime: serviceFields.showReturnTime ? selectedReturnTime : undefined,
//     };

//     onConfirm(submitData);
//   };

//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View style={styles.modalContainer}>
//         <View style={styles.modalContent}>
//           <View style={styles.header}>
//             <Text style={styles.headerTitle}>Book {offer.title}</Text>
//             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//               <Feather name="x" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>

//           <ScrollView showsVerticalScrollIndicator={false}>
//             {/* Price Summary */}
//             <View style={styles.section}>
//               <Text style={styles.priceLabel}>Price</Text>
//               <View style={styles.priceRow}>
//                 <Text style={styles.priceValue}>DH {offer.price}</Text>
//                 <Text style={styles.pricePeriod}>/{offer.pricePeriod}</Text>
//               </View>
//             </View>

//             {/* Dates Section */}
//             {serviceFields.showDates && !serviceFields.showSingleDate && (
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>{serviceFields.dateLabel}</Text>
//                 <View style={styles.dateRow}>
//                   <TouchableOpacity
//                     style={styles.dateInput}
//                     onPress={() => setShowDatePicker('checkIn')}
//                   >
//                     <Text style={styles.dateLabel}>Start</Text>
//                     <Text style={styles.dateValue}>{formatDate(formData.checkIn)}</Text>
//                   </TouchableOpacity>
//                   <Feather name="arrow-right" size={16} color="#666" style={styles.dateArrow} />
//                   <TouchableOpacity
//                     style={styles.dateInput}
//                     onPress={() => setShowDatePicker('checkOut')}
//                   >
//                     <Text style={styles.dateLabel}>End</Text>
//                     <Text style={styles.dateValue}>{formatDate(formData.checkOut)}</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}

//             {/* Single Date */}
//             {serviceFields.showSingleDate && (
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>{serviceFields.dateLabel}</Text>
//                 <TouchableOpacity
//                   style={styles.fullDateInput}
//                   onPress={() => setShowDatePicker('date')}
//                 >
//                   <Text style={styles.dateLabel}>Date</Text>
//                   <Text style={styles.dateValue}>{formatDate(formData.date)}</Text>
//                 </TouchableOpacity>
//               </View>
//             )}

//             {/* Time Selection */}
//             {serviceFields.showTime && (
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Select Time</Text>
//                 <View style={serviceFields.showReturnTime ? styles.dateRow : {}}>
//                   <TouchableOpacity
//                     style={serviceFields.showReturnTime ? styles.dateInput : styles.fullDateInput}
//                     onPress={() => setShowTimePicker('start')}
//                   >
//                     <Text style={styles.dateLabel}>
//                       {serviceFields.showReturnTime ? 'Start Time' : 'Time'}
//                     </Text>
//                     <Text style={styles.dateValue}>{selectedTime}</Text>
//                   </TouchableOpacity>

//                   {serviceFields.showReturnTime && (
//                     <>
//                       <Feather name="arrow-right" size={16} color="#666" style={styles.dateArrow} />
//                       <TouchableOpacity
//                         style={styles.dateInput}
//                         onPress={() => setShowTimePicker('return')}
//                       >
//                         <Text style={styles.dateLabel}>Return Time</Text>
//                         <Text style={styles.dateValue}>{selectedReturnTime}</Text>
//                       </TouchableOpacity>
//                     </>
//                   )}
//                 </View>
//               </View>
//             )}

//             {/* Guest Count */}
//             {serviceFields.showGuestCount && (
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>{serviceFields.guestLabel}</Text>
//                 <View style={styles.counterRow}>
//                   <View style={styles.counterGroup}>
//                     <Text style={styles.counterLabel}>Adults</Text>
//                     <View style={styles.counter}>
//                       <TouchableOpacity style={styles.counterButton} onPress={decrementAdults}>
//                         <Feather name="minus" size={16} color="#666" />
//                       </TouchableOpacity>
//                       <Text style={styles.counterValue}>{formData.adults}</Text>
//                       <TouchableOpacity style={styles.counterButton} onPress={incrementAdults}>
//                         <Feather name="plus" size={16} color="#666" />
//                       </TouchableOpacity>
//                     </View>
//                   </View>

//                   <View style={styles.counterGroup}>
//                     <Text style={styles.counterLabel}>Children</Text>
//                     <View style={styles.counter}>
//                       <TouchableOpacity style={styles.counterButton} onPress={decrementChildren}>
//                         <Feather name="minus" size={16} color="#666" />
//                       </TouchableOpacity>
//                       <Text style={styles.counterValue}>{formData.children}</Text>
//                       <TouchableOpacity style={styles.counterButton} onPress={incrementChildren}>
//                         <Feather name="plus" size={16} color="#666" />
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </View>
//               </View>
//             )}

//             {/* Rooms for Hotels */}
//             {serviceFields.showRooms && (
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Rooms</Text>
//                 <View style={styles.counter}>
//                   <TouchableOpacity style={styles.counterButton} onPress={decrementRooms}>
//                     <Feather name="minus" size={16} color="#666" />
//                   </TouchableOpacity>
//                   <Text style={styles.counterValue}>{formData.rooms}</Text>
//                   <TouchableOpacity style={styles.counterButton} onPress={incrementRooms}>
//                     <Feather name="plus" size={16} color="#666" />
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}

//             {/* Total Price */}
//             <View style={styles.totalSection}>
//               <Text style={styles.totalLabel}>Total Price</Text>
//               <Text style={styles.totalPrice}>DH {calculateTotalPrice()}</Text>
//             </View>
//           </ScrollView>

//           {/* Footer Buttons */}
//           <View style={styles.footer}>
//             <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
//               <Text style={styles.cancelButtonText}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
//               <Text style={styles.confirmButtonText}>Confirm Booking</Text>
//               <Feather name="check" size={20} color="#FFFFFF" />
//             </TouchableOpacity>
//           </View>

//           {/* Date/Time Pickers */}
//           {showDatePicker && (
//             <DateTimePicker
//               value={formData[showDatePicker] || new Date()}
//               mode="date"
//               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//               onChange={handleDateChange}
//               minimumDate={new Date()}
//             />
//           )}

//           {showTimePicker && (
//             <DateTimePicker
//               value={new Date()}
//               mode="time"
//               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//               onChange={handleTimeChange}
//             />
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
//   modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
//   headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
//   closeButton: { padding: 4 },
//   section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
//   sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
//   priceLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
//   priceRow: { flexDirection: 'row', alignItems: 'baseline' },
//   priceValue: { fontSize: 24, fontWeight: 'bold', color: '#1014d7' },
//   pricePeriod: { fontSize: 14, color: '#666', marginLeft: 4 },
//   dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   dateInput: { flex: 1, padding: 12, backgroundColor: '#F8F9FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5E5' },
//   fullDateInput: { padding: 12, backgroundColor: '#F8F9FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5E5' },
//   dateLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
//   dateValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
//   dateArrow: { marginHorizontal: 12 },
//   counterRow: { flexDirection: 'row', justifyContent: 'space-between' },
//   counterGroup: { flex: 1, marginRight: 16 },
//   counterLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
//   counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E5E5' },
//   counterButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
//   counterValue: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', minWidth: 40, textAlign: 'center' },
//   inputGroup: { marginBottom: 16 },
//   inputLabel: { fontSize: 14, color: '#666', marginBottom: 6 },
//   input: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A1A', backgroundColor: '#F8F9FA' },
//   textArea: { height: 100, textAlignVertical: 'top' },
//   totalSection: { padding: 20, backgroundColor: '#F8F9FA', borderTopWidth: 1, borderTopColor: '#E5E5E5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
//   totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#1014d7' },
//   footer: { flexDirection: 'row', padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
//   cancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', marginRight: 12 },
//   cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
//   confirmButton: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#1014d7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
//   confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginRight: 8 },
// });

// export default BookingModal;


// // import React, { useEffect, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   FlatList,
// //   TouchableOpacity,
// //   Image,
// //   ActivityIndicator,
// //   RefreshControl,
// //   Alert,
// // } from 'react-native';
// // import { useRouter } from 'expo-router';
// // import { Feather } from '@expo/vector-icons';
// // import { useBookings } from '../app/context/hooks/useBookings';
// // import { Booking, BookingStatus } from '../app/context/types/bookings.types';

// // export default function MyBookingsScreen() {
// //   const router = useRouter();
// //   const { bookings, loading, refreshBookings } = useBookings();
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [filter, setFilter] = useState<'all' | BookingStatus>('all');

// //   useEffect(() => {
// //     refreshBookings();
// //   }, []);

// //   const onRefresh = async () => {
// //     setRefreshing(true);
// //     await refreshBookings();
// //     setRefreshing(false);
// //   };

// //   const getFilteredBookings = () => {
// //     if (filter === 'all') return bookings;
// //     return bookings.filter((b) => b.status === filter);
// //   };

// //   const getStatusColor = (status: BookingStatus) => {
// //     const colors: Record<BookingStatus, string> = {
// //       pending: '#FF9800',
// //       confirmed: '#4CAF50',
// //       cancelled: '#F44336',
// //       completed: '#2196F3',
// //     };
// //     return colors[status] || '#999';
// //   };

// //   const getStatusIcon = (status: BookingStatus) => {
// //     const icons: Record<BookingStatus, string> = {
// //       pending: 'clock',
// //       confirmed: 'check-circle',
// //       cancelled: 'x-circle',
// //       completed: 'check-circle',
// //     };
// //     return icons[status] || 'info';
// //   };

// //   // ✅ Helper to format dates based on service type
// //   const formatBookingDates = (booking: Booking) => {
// //     const serviceType = booking.serviceType?.toLowerCase();

// //     if (serviceType === 'event' || serviceType === 'tour') {
// //       // Single date events/tours
// //       const date = booking.dates?.date || booking.dates?.startDate || booking.dates?.checkIn;
// //       if (date) {
// //         return new Date(date).toLocaleDateString('en-US', {
// //           month: 'short',
// //           day: 'numeric',
// //           year: 'numeric',
// //         });
// //       }
// //     } else {
// //       // Multi-day bookings (hotel, car, boat, space)
// //       const startDate = booking.dates?.checkIn || booking.dates?.startDate;
// //       const endDate = booking.dates?.checkOut || booking.dates?.endDate;
      
// //       if (startDate && endDate) {
// //         const start = new Date(startDate).toLocaleDateString('en-US', {
// //           month: 'short',
// //           day: 'numeric',
// //         });
// //         const end = new Date(endDate).toLocaleDateString('en-US', {
// //           month: 'short',
// //           day: 'numeric',
// //           year: 'numeric',
// //         });
// //         return `${start} - ${end}`;
// //       } else if (startDate) {
// //         return new Date(startDate).toLocaleDateString('en-US', {
// //           month: 'short',
// //           day: 'numeric',
// //           year: 'numeric',
// //         });
// //       }
// //     }

// //     return 'Date not available';
// //   };

// //   // ✅ Helper to get service-specific details
// //   const getBookingDetails = (booking: Booking) => {
// //     const serviceType = booking.serviceType?.toLowerCase();
// //     const details: string[] = [];

// //     switch (serviceType) {
// //       case 'hotel':
// //         if (booking.guests?.rooms) {
// //           details.push(`${booking.guests.rooms} room${booking.guests.rooms > 1 ? 's' : ''}`);
// //         }
// //         if (booking.guests?.adults) {
// //           details.push(`${booking.guests.adults} adult${booking.guests.adults > 1 ? 's' : ''}`);
// //         }
// //         if (booking.guests?.children && booking.guests.children > 0) {
// //           details.push(`${booking.guests.children} child${booking.guests.children > 1 ? 'ren' : ''}`);
// //         }
// //         // Calculate nights
// //         if (booking.dates?.checkIn && booking.dates?.checkOut) {
// //           const start = new Date(booking.dates.checkIn);
// //           const end = new Date(booking.dates.checkOut);
// //           const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
// //           details.push(`${nights} night${nights > 1 ? 's' : ''}`);
// //         }
// //         break;

// //       case 'car':
// //         if (booking.guests?.adults) {
// //           details.push(`${booking.guests.adults} passenger${booking.guests.adults > 1 ? 's' : ''}`);
// //         }
// //         // Calculate days
// //         if (booking.dates?.checkIn && booking.dates?.checkOut) {
// //           const start = new Date(booking.dates.checkIn);
// //           const end = new Date(booking.dates.checkOut);
// //           const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
// //           details.push(`${days} day${days > 1 ? 's' : ''}`);
// //         }
// //         if (booking.dates?.time) {
// //           details.push(`Pickup: ${booking.dates.time}`);
// //         }
// //         break;

// //       case 'boat':
// //         if (booking.guests?.adults) {
// //           const total = (booking.guests.adults || 0) + (booking.guests.children || 0);
// //           details.push(`${total} guest${total > 1 ? 's' : ''}`);
// //         }
// //         if (booking.dates?.time) {
// //           details.push(`Departure: ${booking.dates.time}`);
// //         }
// //         break;

// //       case 'tour':
// //         if (booking.guests?.adults) {
// //           details.push(`${booking.guests.adults} participant${booking.guests.adults > 1 ? 's' : ''}`);
// //         }
// //         if (booking.dates?.time) {
// //           details.push(`Start time: ${booking.dates.time}`);
// //         }
// //         break;

// //       case 'event':
// //         if (booking.guests?.adults) {
// //           details.push(`${booking.guests.adults} ticket${booking.guests.adults > 1 ? 's' : ''}`);
// //         }
// //         if (booking.dates?.time) {
// //           details.push(`Event time: ${booking.dates.time}`);
// //         }
// //         break;

// //       case 'space':
// //         if (booking.guests?.adults) {
// //           const total = (booking.guests.adults || 0) + (booking.guests.children || 0);
// //           details.push(`${total} guest${total > 1 ? 's' : ''}`);
// //         }
// //         // Calculate days
// //         if (booking.dates?.checkIn && booking.dates?.checkOut) {
// //           const start = new Date(booking.dates.checkIn);
// //           const end = new Date(booking.dates.checkOut);
// //           const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
// //           details.push(`${days} day${days > 1 ? 's' : ''}`);
// //         }
// //         break;

// //       default:
// //         if (booking.guests?.adults) {
// //           details.push(`${booking.guests.adults} guest${booking.guests.adults > 1 ? 's' : ''}`);
// //         }
// //         break;
// //     }

// //     return details.join(' • ');
// //   };

// //   // ✅ Service type badge
// //   const getServiceTypeBadge = (serviceType: string) => {
// //     const types: Record<string, { label: string; color: string; icon: string }> = {
// //       hotel: { label: 'Hotel', color: '#2196F3', icon: 'home' },
// //       car: { label: 'Car', color: '#FF9800', icon: 'truck' },
// //       boat: { label: 'Boat', color: '#00BCD4', icon: 'anchor' },
// //       tour: { label: 'Tour', color: '#4CAF50', icon: 'map' },
// //       event: { label: 'Event', color: '#9C27B0', icon: 'calendar' },
// //       space: { label: 'Space', color: '#FF5722', icon: 'package' },
// //       flight: { label: 'Flight', color: '#3F51B5', icon: 'navigation' },
// //     };

// //     const type = types[serviceType?.toLowerCase()] || { 
// //       label: serviceType, 
// //       color: '#999', 
// //       icon: 'bookmark' 
// //     };

// //     return (
// //       <View style={[styles.serviceBadge, { backgroundColor: type.color + '20' }]}>
// //         <Feather name={type.icon as any} size={12} color={type.color} />
// //         <Text style={[styles.serviceBadgeText, { color: type.color }]}>
// //           {type.label}
// //         </Text>
// //       </View>
// //     );
// //   };

// //   const renderBookingCard = ({ item }: { item: Booking }) => (
// //     <TouchableOpacity
// //       style={styles.bookingCard}
// //       onPress={() => {
// //         // Navigate to booking details
// //         // router.push(`/booking/${item.bookingId}`);
// //         Alert.alert('Booking Details', `Booking ID: ${item.bookingId}`);
// //       }}
// //       activeOpacity={0.7}
// //     >
// //       {/* Service Type Badge */}
// //       <View style={styles.cardHeader}>
// //         {getServiceTypeBadge(item.serviceType)}
// //         <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
// //           <Feather
// //             name={getStatusIcon(item.status) as any}
// //             size={12}
// //             color={getStatusColor(item.status)}
// //           />
// //           <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
// //             {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
// //           </Text>
// //         </View>
// //       </View>

// //       {/* Booking Content */}
// //       <View style={styles.cardContent}>
// //         {/* Image */}
// //         {item.offerImage ? (
// //           <Image source={{ uri: item.offerImage }} style={styles.bookingImage} />
// //         ) : (
// //           <View style={[styles.bookingImage, styles.placeholderImage]}>
// //             <Feather name="image" size={32} color="#CCC" />
// //           </View>
// //         )}

// //         {/* Details */}
// //         <View style={styles.bookingDetails}>
// //           <Text style={styles.bookingTitle} numberOfLines={2}>
// //             {item.offerTitle}
// //           </Text>

// //           <View style={styles.locationRow}>
// //             <Feather name="map-pin" size={12} color="#666" />
// //             <Text style={styles.locationText} numberOfLines={1}>
// //               {item.offerLocation}
// //             </Text>
// //           </View>

// //           <View style={styles.dateRow}>
// //             <Feather name="calendar" size={12} color="#666" />
// //             <Text style={styles.dateText}>{formatBookingDates(item)}</Text>
// //           </View>

// //           {/* Service-specific details */}
// //           {getBookingDetails(item) && (
// //             <View style={styles.detailsRow}>
// //               <Feather name="info" size={12} color="#666" />
// //               <Text style={styles.detailsText} numberOfLines={1}>
// //                 {getBookingDetails(item)}
// //               </Text>
// //             </View>
// //           )}

// //           {/* Price */}
// //           <View style={styles.priceRow}>
// //             <Text style={styles.priceLabel}>Total:</Text>
// //             <Text style={styles.priceValue}>DH {item.totalPrice}</Text>
// //           </View>
// //         </View>
// //       </View>

// //       {/* Footer */}
// //       <View style={styles.cardFooter}>
// //         <Text style={styles.bookingId}>Booking ID: {item.bookingId}</Text>
// //         <Feather name="chevron-right" size={20} color="#999" />
// //       </View>
// //     </TouchableOpacity>
// //   );

// //   const FilterButton = ({ label, value }: { label: string; value: 'all' | BookingStatus }) => (
// //     <TouchableOpacity
// //       style={[styles.filterButton, filter === value && styles.filterButtonActive]}
// //       onPress={() => setFilter(value)}
// //     >
// //       <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>
// //         {label}
// //       </Text>
// //     </TouchableOpacity>
// //   );

// //   if (loading && bookings.length === 0) {
// //     return (
// //       <View style={styles.centerContainer}>
// //         <ActivityIndicator size="large" color="#0026ff" />
// //         <Text style={styles.loadingText}>Loading bookings...</Text>
// //       </View>
// //     );
// //   }

// //   const filteredBookings = getFilteredBookings();

// //   return (
// //     <View style={styles.container}>
// //       {/* Header */}
// //       <View style={styles.header}>
// //         <Text style={styles.headerTitle}>My Bookings</Text>
// //         <Text style={styles.headerSubtitle}>{bookings.length} total bookings</Text>
// //       </View>

// //       {/* Filters */}
// //       <View style={styles.filtersContainer}>
// //         <FilterButton label="All" value="all" />
// //         <FilterButton label="Pending" value="pending" />
// //         <FilterButton label="Confirmed" value="confirmed" />
// //         <FilterButton label="Completed" value="completed" />
// //       </View>

// //       {/* Bookings List */}
// //       {filteredBookings.length === 0 ? (
// //         <View style={styles.emptyContainer}>
// //           <Feather name="inbox" size={64} color="#CCC" />
// //           <Text style={styles.emptyText}>No bookings found</Text>
// //           <Text style={styles.emptySubtext}>
// //             {filter === 'all'
// //               ? 'Start exploring and book your first experience!'
// //               : `No ${filter} bookings`}
// //           </Text>
// //           <TouchableOpacity
// //             style={styles.exploreButton}
// //             onPress={() => router.push('/tabs/explore')}
// //           >
// //             <Text style={styles.exploreButtonText}>Explore Now</Text>
// //           </TouchableOpacity>
// //         </View>
// //       ) : (
// //         <FlatList
// //           data={filteredBookings}
// //           renderItem={renderBookingCard}
// //           keyExtractor={(item) => item.bookingId}
// //           contentContainerStyle={styles.listContainer}
// //           refreshControl={
// //             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0026ff']} />
// //           }
// //           showsVerticalScrollIndicator={false}
// //         />
// //       )}
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#F8F9FA',
// //   },
// //   centerContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#F8F9FA',
// //   },
// //   loadingText: {
// //     marginTop: 12,
// //     fontSize: 14,
// //     color: '#666',
// //   },
// //   header: {
// //     padding: 20,
// //     paddingTop: 60,
// //     backgroundColor: '#FFFFFF',
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#F0F0F0',
// //   },
// //   headerTitle: {
// //     fontSize: 28,
// //     fontWeight: 'bold',
// //     color: '#1A1A1A',
// //     marginBottom: 4,
// //   },
// //   headerSubtitle: {
// //     fontSize: 14,
// //     color: '#666',
// //   },
// //   filtersContainer: {
// //     flexDirection: 'row',
// //     padding: 16,
// //     backgroundColor: '#FFFFFF',
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#F0F0F0',
// //     gap: 8,
// //   },
// //   filterButton: {
// //     paddingHorizontal: 16,
// //     paddingVertical: 8,
// //     borderRadius: 20,
// //     backgroundColor: '#F5F5F5',
// //   },
// //   filterButtonActive: {
// //     backgroundColor: '#0026ff',
// //   },
// //   filterButtonText: {
// //     fontSize: 14,
// //     fontWeight: '600',
// //     color: '#666',
// //   },
// //   filterButtonTextActive: {
// //     color: '#FFFFFF',
// //   },
// //   listContainer: {
// //     padding: 16,
// //   },
// //   bookingCard: {
// //     backgroundColor: '#FFFFFF',
// //     borderRadius: 16,
// //     marginBottom: 16,
// //     overflow: 'hidden',
// //     elevation: 2,
// //     shadowColor: '#000',
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 8,
// //   },
// //   cardHeader: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     padding: 12,
// //     backgroundColor: '#FAFAFA',
// //   },
// //   serviceBadge: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     paddingHorizontal: 10,
// //     paddingVertical: 4,
// //     borderRadius: 12,
// //     gap: 4,
// //   },
// //   serviceBadgeText: {
// //     fontSize: 12,
// //     fontWeight: '600',
// //   },
// //   statusBadge: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     paddingHorizontal: 10,
// //     paddingVertical: 4,
// //     borderRadius: 12,
// //     gap: 4,
// //   },
// //   statusText: {
// //     fontSize: 12,
// //     fontWeight: '600',
// //   },
// //   cardContent: {
// //     flexDirection: 'row',
// //     padding: 12,
// //   },
// //   bookingImage: {
// //     width: 100,
// //     height: 100,
// //     borderRadius: 12,
// //     marginRight: 12,
// //   },
// //   placeholderImage: {
// //     backgroundColor: '#F5F5F5',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   bookingDetails: {
// //     flex: 1,
// //     justifyContent: 'space-between',
// //   },
// //   bookingTitle: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#1A1A1A',
// //     marginBottom: 4,
// //   },
// //   locationRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 4,
// //     marginBottom: 4,
// //   },
// //   locationText: {
// //     fontSize: 12,
// //     color: '#666',
// //     flex: 1,
// //   },
// //   dateRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 4,
// //     marginBottom: 4,
// //   },
// //   dateText: {
// //     fontSize: 12,
// //     color: '#666',
// //   },
// //   detailsRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 4,
// //     marginBottom: 4,
// //   },
// //   detailsText: {
// //     fontSize: 12,
// //     color: '#666',
// //     flex: 1,
// //   },
// //   priceRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     marginTop: 4,
// //   },
// //   priceLabel: {
// //     fontSize: 12,
// //     color: '#666',
// //   },
// //   priceValue: {
// //     fontSize: 16,
// //     fontWeight: 'bold',
// //     color: '#0026ff',
// //   },
// //   cardFooter: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     padding: 12,
// //     backgroundColor: '#FAFAFA',
// //     borderTopWidth: 1,
// //     borderTopColor: '#F0F0F0',
// //   },
// //   bookingId: {
// //     fontSize: 11,
// //     color: '#999',
// //     fontFamily: 'monospace',
// //   },
// //   emptyContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     padding: 40,
// //   },
// //   emptyText: {
// //     fontSize: 18,
// //     fontWeight: '600',
// //     color: '#1A1A1A',
// //     marginTop: 16,
// //   },
// //   emptySubtext: {
// //     fontSize: 14,
// //     color: '#666',
// //     marginTop: 8,
// //     textAlign: 'center',
// //   },
// //   exploreButton: {
// //     marginTop: 24,
// //     paddingHorizontal: 32,
// //     paddingVertical: 12,
// //     backgroundColor: '#0026ff',
// //     borderRadius: 24,
// //   },
// //   exploreButtonText: {
// //     fontSize: 16,
// //     fontWeight: '600',
// //     color: '#FFFFFF',
// //   },
// // });
