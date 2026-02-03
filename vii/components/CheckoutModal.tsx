import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export type CheckoutFormData = {
  paymentGateway: 'offline_payment' | 'stripe';

  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  zipCode: string;

  country: string;
  termsAccepted: boolean;
};

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (checkoutData: CheckoutFormData) => void;

  bookingCode: string;
  bookingDetails: {
    title: string;
    price: string;
    dates?: string;
    guests?: string;
  };

  loading?: boolean;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  onClose,
  onConfirm,
  bookingCode,
  bookingDetails,
  loading = false,
}) => {
  const [paymentGateway, setPaymentGateway] =
    useState<'offline_payment' | 'stripe'>('offline_payment');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('MA');

  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setPaymentGateway('offline_payment');
    setTermsAccepted(false);

    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');

    setAddress('');
    setCity('');
    setState('');
    setZipCode('');

    setCountry('MA');
  }, [visible]);

  const validate = () => {
    if (!firstName.trim()) return 'Please enter your first name';
    if (!lastName.trim()) return 'Please enter your last name';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address';
    if (!phone.trim()) return 'Please enter your phone number';

    if (!address.trim()) return 'Please enter your address';
    if (!city.trim()) return 'Please enter your city';
    if (!state.trim()) return 'Please enter your state';
    if (!zipCode.trim()) return 'Please enter your zip code';

    if (!country.trim()) return 'Please enter your country code (e.g. MA)';
    if (!termsAccepted) return 'Please accept the terms and conditions';

    return null;
  };

  const handleConfirm = () => {
    if (loading) return;

    const err = validate();
    if (err) {
      Alert.alert('Error', err);
      return;
    }

    onConfirm({
      paymentGateway,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim().toUpperCase(),
      termsAccepted,
    });
  };

  const PaymentCard = ({
    id,
    title,
    description,
    icon,
    color,
    comingSoon,
  }: {
    id: 'offline_payment' | 'stripe';
    title: string;
    description: string;
    icon: any;
    color: string;
    comingSoon?: boolean;
  }) => {
    const active = paymentGateway === id;

    return (
      <TouchableOpacity
        style={[styles.paymentMethod, active && styles.paymentMethodActive, loading && styles.disabled]}
        onPress={() => {
          if (loading) return;
          if (comingSoon) return;
          setPaymentGateway(id);
        }}
        activeOpacity={0.85}
        disabled={loading}
      >
        <View style={[styles.paymentIcon, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={22} color={color} />
        </View>

        <View style={styles.paymentInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.paymentName}>{title}</Text>
            {comingSoon ? <Text style={styles.comingSoon}>Soon</Text> : null}
          </View>
          <Text style={styles.paymentDescription}>{description}</Text>
        </View>

        <View style={[styles.radio, active && styles.radioActive]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      // Prevent Android back close while loading
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complete your booking</Text>

            <TouchableOpacity
              onPress={() => {
                if (loading) return;
                onClose();
              }}
              style={[styles.closeButton, loading && styles.disabled]}
              disabled={loading}
            >
              <Feather name="x" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={!loading}>
            {/* Summary */}
            <View style={styles.section}>
              <View style={styles.successBadge}>
                <Feather name="check-circle" size={36} color="#16a34a" />
                <Text style={styles.successText}>Booking reserved</Text>
                <Text style={styles.bookingCode}>Code: {bookingCode}</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{bookingDetails.title}</Text>

                {!!bookingDetails.dates && (
                  <View style={styles.summaryRow}>
                    <Feather name="calendar" size={14} color="#666" />
                    <Text style={styles.summaryText}>{bookingDetails.dates}</Text>
                  </View>
                )}

                {!!bookingDetails.guests && (
                  <View style={styles.summaryRow}>
                    <Feather name="users" size={14} color="#666" />
                    <Text style={styles.summaryText}>{bookingDetails.guests}</Text>
                  </View>
                )}

                <View style={styles.priceSummary}>
                  <Text style={styles.priceLabel}>Total</Text>
                  <Text style={styles.priceValue}>DH {bookingDetails.price}</Text>
                </View>
              </View>
            </View>

            {/* Billing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Billing information</Text>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>First name *</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                    placeholder="First name"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Last name *</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                    placeholder="Last name"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address *</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  style={styles.input}
                  placeholder="Street, building, etc."
                  editable={!loading}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput value={city} onChangeText={setCity} style={styles.input} placeholder="City" editable={!loading} />
                </View>

                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>State *</Text>
                  <TextInput
                    value={state}
                    onChangeText={setState}
                    style={styles.input}
                    placeholder="State / Region"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Zip code *</Text>
                  <TextInput
                    value={zipCode}
                    onChangeText={setZipCode}
                    style={styles.input}
                    placeholder="Zip code"
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Country code *</Text>
                  <TextInput
                    value={country}
                    onChangeText={setCountry}
                    style={styles.input}
                    placeholder="MA"
                    autoCapitalize="characters"
                    maxLength={2}
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            {/* Payment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment method</Text>

              <PaymentCard
                id="offline_payment"
                title="Offline payment"
                description="Pay offline (cash/bank transfer) and confirm with the vendor."
                icon="credit-card"
                color="#2563eb"
              />

              <PaymentCard
                id="stripe"
                title="Stripe"
                description="Pay online with card (may require additional setup)."
                icon="lock"
                color="#7c3aed"
                comingSoon
              />
            </View>

            {/* Terms */}
            <View style={styles.termsSection}>
              <TouchableOpacity
                style={[styles.checkboxRow, loading && styles.disabled]}
                onPress={() => {
                  if (loading) return;
                  setTermsAccepted((v) => !v);
                }}
                activeOpacity={0.85}
                disabled={loading}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                  {termsAccepted ? <Feather name="check" size={14} color="#fff" /> : null}
                </View>
                <Text style={styles.termsText}>I accept the terms and conditions</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Feather name="check" size={18} color="#fff" />}
              <Text style={styles.confirmButtonText}>{loading ? 'Confirming...' : 'Complete booking'}</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Loading overlay */}
          {loading ? (
            <View style={styles.loadingOverlay} pointerEvents="auto">
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#0026ff" />
                <Text style={styles.loadingTitle}>Confirming your booking...</Text>
                <Text style={styles.loadingSub}>Please wait. Don’t close the app.</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  closeButton: { padding: 4 },

  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },

  successBadge: { alignItems: 'center', paddingVertical: 10 },
  successText: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 10 },
  bookingCode: { fontSize: 13, color: '#666', marginTop: 4, fontFamily: 'monospace' },

  summaryCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginTop: 14 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryText: { fontSize: 14, color: '#666', flex: 1 },

  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  priceLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  priceValue: { fontSize: 18, fontWeight: '900', color: '#0026ff' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },

  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputHalf: { flex: 1 },
  inputGroup: { marginBottom: 16 },

  inputLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
  },

  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodActive: { backgroundColor: '#FFFFFF', borderColor: '#0026ff' },

  paymentIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  paymentInfo: { flex: 1, marginLeft: 12 },
  paymentName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  paymentDescription: { marginTop: 2, fontSize: 13, color: '#666' },
  comingSoon: { fontSize: 12, color: '#666', backgroundColor: '#EEE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: '#0026ff' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0026ff' },

  termsSection: { padding: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: { backgroundColor: '#0026ff', borderColor: '#0026ff' },
  termsText: { fontSize: 14, color: '#666', flex: 1 },

  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  confirmButton: {
    backgroundColor: '#0026ff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  loadingTitle: { marginTop: 12, fontSize: 16, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  loadingSub: { marginTop: 6, fontSize: 13, color: '#666', textAlign: 'center' },

  disabled: { opacity: 0.6 },
});

export default CheckoutModal;
