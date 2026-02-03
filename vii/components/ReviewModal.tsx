// app/components/ReviewModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reviewData: ReviewData) => Promise<void>;
  serviceId: number;
  serviceType: string;
  serviceTitle: string;
}

export interface ReviewData {
  rating: number;
  title: string;
  comment: string;
  serviceId: number;
  serviceType: string;
}

export default function ReviewModal({
  visible,
  onClose,
  onSubmit,
  serviceId,
  serviceType,
  serviceTitle,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setRating(0);
    setTitle('');
    setComment('');
  };

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Comment Required', 'Please write a comment');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        rating,
        title: title.trim(),
        comment: comment.trim(),
        serviceId,
        serviceType,
      });

      Alert.alert('Success', 'Your review has been submitted!');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Write a Review</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {serviceTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Rating Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Rating *</Text>
                <View style={styles.starContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Feather
                        name={star <= rating ? 'star' : 'star'}
                        size={40}
                        color={star <= rating ? '#FFB800' : '#E5E5E5'}
                        fill={star <= rating ? '#FFB800' : 'none'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && (
                  <Text style={styles.ratingText}>
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </Text>
                )}
              </View>

              {/* Title Section (Optional) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Review Title (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Summarize your experience"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Comment Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Review *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share details of your experience..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={500}
                  placeholderTextColor="#999999"
                />
                <Text style={styles.characterCount}>{comment.length}/500</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (rating === 0 || !comment.trim() || submitting) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={rating === 0 || !comment.trim() || submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    maxWidth: 250,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#1014d7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
