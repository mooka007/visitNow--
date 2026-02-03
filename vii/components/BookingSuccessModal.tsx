import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  data: {
    offerTitle: string;
    email: string;
    bookingNumber: string; 
    bookingDate: string;   
    paymentMethod: string;
    status: string;       
  };
};

export default function BookingSuccessModal({ visible, onClose, data }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Feather name="check-circle" size={42} color="#22C55E" />
            <Text style={styles.title}>Your booking was submitted successfully!</Text>
            <Text style={styles.subtitle}>{data.offerTitle}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Booking details has been sent to:</Text>
            <Text style={styles.value}>{data.email}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Booking Number:</Text>
            <Text style={styles.value}>{data.bookingNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Booking Date:</Text>
            <Text style={styles.value}>{data.bookingDate}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{data.paymentMethod}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Booking Status:</Text>
            <Text style={styles.value}>{data.status}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
  },
  header: { alignItems: 'center', marginBottom: 14 },
  title: { marginTop: 10, fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 13, color: '#666', textAlign: 'center' },
  row: { marginTop: 10 },
  label: { fontSize: 12, color: '#666' },
  value: { marginTop: 2, fontSize: 14, fontWeight: '600', color: '#111' },
  button: { marginTop: 18, backgroundColor: '#0026ff', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
