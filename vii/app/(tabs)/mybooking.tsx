import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useBookings } from '../context/hooks/useBookings';
import { Booking, BookingStatus } from '../context/types/bookings.types';

type AnyBooking = Booking & {
  // API-like optional fields (in case your provider keeps them)
  // code?: string;
  gateway?: string;
  pay_now?: string | number;
  total?: string | number;
  total_guests?: number;
  number?: number;
  start_date?: string;
  end_date?: string;
  object_model?: string;
  service?: { title?: string };
  buyer_fees?: Array<{ name?: string; price?: string | number; type?: string }>;
  booking_meta?: any;
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const { bookings, loading, cancelBooking, refreshBookings } = useBookings();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | string>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshBookings) await refreshBookings();
    } catch (error) {
      console.error('❌ Failed to refresh:', error);
      Alert.alert('Error', 'Failed to refresh bookings');
    } finally {
      setRefreshing(false);
    }
  };

  const getServiceTypeConfig = (serviceType?: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      hotel: { label: 'Hotel', color: '#FF6B6B', icon: 'home' },
      tour: { label: 'Tour', color: '#96CEB4', icon: 'map' },
      car: { label: 'Car', color: '#4ECDC4', icon: 'truck' },
      boat: { label: 'Boat', color: '#87CEEB', icon: 'anchor' },
      event: { label: 'Event', color: '#FFEAA7', icon: 'calendar' },
      flight: { label: 'Flight', color: '#DDA0DD', icon: 'send' },
      space: { label: 'Space', color: '#45B7D1', icon: 'grid' },
    };

    const key = (serviceType || '').toLowerCase();
    return configs[key] || { label: 'Service', color: '#999999', icon: 'briefcase' };
  };

  const normalizeStatus = (raw?: string): string => {
    if (!raw) return 'unknown';
    return String(raw).toLowerCase().trim();
  };

  const getStatusConfig = (rawStatus?: string) => {
    const status = normalizeStatus(rawStatus);

    // API status examples: processing, cancelled, completed...
    if (status === 'processing') return { color: '#2563eb', icon: 'loader', label: 'Processing' };
    if (status === 'pending') return { color: '#f59e0b', icon: 'clock', label: 'Pending' };
    if (status === 'confirmed') return { color: '#16a34a', icon: 'check-circle', label: 'Confirmed' };
    if (status === 'completed') return { color: '#0ea5e9', icon: 'check', label: 'Completed' };
    if (status === 'cancelled' || status === 'canceled') return { color: '#ef4444', icon: 'x-circle', label: 'Cancelled' };

    return { color: '#6b7280', icon: 'help-circle', label: rawStatus ? String(rawStatus) : 'Unknown' };
  };

  const parseDateTime = (value?: string) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const formatDateTime = (value?: string) => {
    const d = parseDateTime(value);
    if (!d) return value || '—';

    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}`;
  };

  const getMoney = (v: any): string => {
    if (v === null || v === undefined) return '0.00';
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (Number.isNaN(n)) return String(v);
    return n.toFixed(2);
  };

  const getBookingTitle = (b: AnyBooking) => {
    return (
      b.offerTitle ||
      b.service?.title ||
      (b as any)?.title ||
      'Unknown Service'
    );
  };

  const getBookingServiceType = (b: AnyBooking) => {
    return b.serviceType || b.object_model || (b as any)?.object_model || 'service';
  };

  const getBookingCode = (b: AnyBooking) => {
    return b.bookingId || (b as any).code || '—';
  };

  const getBookingTotal = (b: AnyBooking) => {
    // prefer API total if exists
    const total = (b as any)?.total ?? (b as any)?.totalPrice;
    return getMoney(total);
  };

  const getBookingPayNow = (b: AnyBooking) => {
    const payNow = (b as any)?.pay_now;
    if (payNow === null || payNow === undefined) return null;
    return getMoney(payNow);
  };

  const getGatewayLabel = (gateway?: string) => {
    const g = normalizeStatus(gateway);
    if (g === 'offline_payment') return 'Offline payment';
    if (g === 'stripe') return 'Stripe';
    return gateway ? String(gateway) : '—';
  };

  const getGuestsLabel = (b: AnyBooking) => {
    // API has: total_guests or number; local has guests.adults/children/rooms
    const totalGuests = (b as any)?.total_guests;
    const number = (b as any)?.number;

    if (typeof totalGuests === 'number') return `${totalGuests} guest${totalGuests > 1 ? 's' : ''}`;
    if (typeof number === 'number') return `${number} guest${number > 1 ? 's' : ''}`;

    if (b.guests) {
      const adults = b.guests.adults || 0;
      const children = b.guests.children || 0;
      const rooms = b.guests.rooms || 0;

      const parts: string[] = [];
      if (adults) parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
      if (children) parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
      if (rooms > 1) parts.push(`${rooms} rooms`);
      return parts.length ? parts.join(' • ') : '—';
    }

    return '—';
  };

  const getMainDates = (b: AnyBooking) => {
    // Prefer API start_date/end_date
    const start = (b as any)?.start_date;
    const end = (b as any)?.end_date;

    if (start || end) {
      return `${formatDateTime(start)}\n${end ? `End: ${formatDateTime(end)}` : ''}`.trim();
    }

    // Fallback to local dates
    if (b.dates?.checkIn && b.dates?.checkOut) {
      return `${formatDateTime(b.dates.checkIn)}\nEnd: ${formatDateTime(b.dates.checkOut)}`;
    }
    if (b.dates?.date) return formatDateTime(b.dates.date);
    if ((b.dates as any)?.startDate) return formatDateTime((b.dates as any).startDate);

    return '—';
  };

  const getFeeSummary = (b: AnyBooking) => {
    const fees = (b as any)?.buyer_fees;
    if (!Array.isArray(fees) || fees.length === 0) return null;

    const total = fees.reduce((sum: number, f: any) => {
      const n = typeof f?.price === 'number' ? f.price : parseFloat(String(f?.price ?? 0));
      return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);

    return { count: fees.length, total: total.toFixed(2) };
  };

  const allBookings = bookings as AnyBooking[];

  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    allBookings.forEach((b) => set.add(normalizeStatus((b as any).status)));
    const list = Array.from(set).filter(Boolean);
    list.sort();
    return list;
  }, [allBookings]);

  const filteredBookings = useMemo(() => {
    if (selectedFilter === 'all') return allBookings;
    return allBookings.filter((b) => normalizeStatus((b as any).status) === normalizeStatus(selectedFilter));
  }, [allBookings, selectedFilter]);

  const getFilterCount = (filter: 'all' | string) => {
    if (filter === 'all') return allBookings.length;
    return allBookings.filter((b) => normalizeStatus((b as any).status) === normalizeStatus(filter)).length;
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelBooking(bookingId) },
    ]);
  };

  const renderBookingCard = ({ item }: { item: AnyBooking }) => {
    const serviceType = getBookingServiceType(item);
    const serviceConfig = getServiceTypeConfig(serviceType);
    const statusConfig = getStatusConfig((item as any).status);
    const feeSummary = getFeeSummary(item);

    const total = getBookingTotal(item);
    const payNow = getBookingPayNow(item);

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingImageContainer}>
          {item.offerImage ? (
            <Image source={{ uri: item.offerImage }} style={styles.bookingImage} resizeMode="cover" />
          ) : (
            <View style={[styles.noImage, { backgroundColor: serviceConfig.color + '20' }]}>
              <Feather name={serviceConfig.icon} size={34} color={serviceConfig.color} />
            </View>
          )}

          <View style={[styles.serviceBadge, { backgroundColor: serviceConfig.color }]}>
            <Feather name={serviceConfig.icon} size={12} color="#fff" />
            <Text style={styles.serviceBadgeText}>{serviceConfig.label}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <Feather name={statusConfig.icon as any} size={12} color="#fff" />
            <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.bookingContent}>
          <Text style={styles.bookingTitle} numberOfLines={2}>
            {getBookingTitle(item)}
          </Text>

          {!!item.offerLocation && (
            <View style={styles.row}>
              <Feather name="map-pin" size={14} color="#666" />
              <Text style={styles.mutedText} numberOfLines={1}>
                {item.offerLocation}
              </Text>
            </View>
          )}

          <View style={styles.metaBox}>
            {/* <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Code</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {getBookingCode(item)}
              </Text>
            </View> */}

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dates</Text>
              <Text style={styles.metaValue}>{getMainDates(item)}</Text>
            </View>

            {/* <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Guests</Text>
              <Text style={styles.metaValue}>{getGuestsLabel(item)}</Text>
            </View> */}

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment</Text>
              <Text style={styles.metaValue}>{getGatewayLabel((item as any).gateway)}</Text>
            </View>

            {feeSummary ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Fees</Text>
                <Text style={styles.metaValue}>
                  {feeSummary.count} fee{feeSummary.count > 1 ? 's' : ''} • DH {feeSummary.total}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValue}>DH {total}</Text>
              {payNow ? <Text style={styles.payNow}>Pay now: DH {payNow}</Text> : null}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => router.push(`/offers/${item.offerId}?serviceType=${serviceType}`)}
                activeOpacity={0.85}
              >
                <Feather name="eye" size={16} color="#0026ff" />
                <Text style={[styles.actionButtonText, { color: '#0026ff' }]}>View</Text>
              </TouchableOpacity>

              {normalizeStatus((item as any).status) !== 'cancelled' &&
              normalizeStatus((item as any).status) !== 'completed' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelBooking(getBookingCode(item))}
                  activeOpacity={0.85}
                >
                  <Feather name="x" size={16} color="#ef4444" />
                  <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Booked on{' '}
              {item.bookingDate
                ? new Date(item.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Feather name="calendar" size={40} color="#0026ff" />
      </View>
      <Text style={styles.emptyTitle}>No bookings</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'all'
          ? 'Start exploring and book your next adventure!'
          : `No "${selectedFilter}" bookings found.`}
      </Text>
      <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)')} activeOpacity={0.9}>
        <Feather name="search" size={18} color="#fff" />
        <Text style={styles.exploreButtonText}>Explore offers</Text>
      </TouchableOpacity>
    </View>
  );

  const filters = ['all', ...availableStatuses];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filters}
          keyExtractor={(x) => x}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = normalizeStatus(item) === normalizeStatus(selectedFilter);
            const count = getFilterCount(item);

            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item)}
                style={[styles.filterTab, active && styles.filterTabActive]}
                activeOpacity={0.85}
              >
                <View style={[styles.filterDot, { backgroundColor: active ? '#fff' : '#0026ff' }]} />
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {item === 'all' ? `All (${count})` : `${item} (${count})`}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0026ff" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(b) => String(getBookingCode(b))}
          renderItem={renderBookingCard}
          contentContainerStyle={filteredBookings.length ? styles.listContent : styles.listEmpty}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA',  paddingHorizontal: 10,  paddingBottom: 80  },

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
  backButton: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0026ff' },

  filterContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterTabActive: { backgroundColor: '#0026ff' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#666666' },
  filterTabTextActive: { color: '#FFFFFF' },
  filterDot: { width: 6, height: 6, borderRadius: 3 },

  listContent: { padding: 14, paddingBottom: 24 },
  listEmpty: { flexGrow: 1, padding: 14 },

  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  bookingImageContainer: { width: '100%', height: 160, position: 'relative' },
  bookingImage: { width: '100%', height: '100%' },
  noImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

  serviceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  bookingContent: { padding: 14 },
  bookingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  mutedText: { fontSize: 13, color: '#666666', flex: 1 },

  metaBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  metaLabel: { fontSize: 12, color: '#6b7280', width: 80 },
  metaValue: { fontSize: 12, color: '#111827', flex: 1, textAlign: 'right' },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  priceLabel: { fontSize: 12, color: '#666666', marginBottom: 3 },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  payNow: { marginTop: 4, fontSize: 12, color: '#6b7280' },

  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewButton: { backgroundColor: '#EEF2FF' },
  cancelButton: { backgroundColor: '#FFEBEE' },
  actionButtonText: { fontSize: 13, fontWeight: '700' },

  footer: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  footerText: { fontSize: 11, color: '#999999' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#666666' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  exploreButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0026ff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  exploreButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

