import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../services/axios';
import { Ionicons } from '@expo/vector-icons';

export default function AddReviewForm() {
  const { id, editId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [skillRating, setSkillRating] = useState(5);
  const [performanceRating, setPerformanceRating] = useState(5);
  const [serviceQualityRating, setServiceQualityRating] = useState(5);
  const [friendlyRating, setFriendlyRating] = useState(5);
  const [costEfficiencyRating, setCostEfficiencyRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      fetchExistingReview();
    }
  }, [editId]);

  const fetchExistingReview = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`users/reviews/${editId}/`);
      const rev = res.data;
      setSkillRating(rev.skill_rating);
      setPerformanceRating(rev.performance_rating);
      setServiceQualityRating(rev.service_quality_rating);
      setFriendlyRating(rev.friendly_rating);
      setCostEfficiencyRating(rev.cost_efficiency_rating);
      setReviewText(rev.review_text);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch review for editing.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!id && !editId) return;
    try {
      setIsSubmitting(true);
      const payload = {
        worker: id,
        skill_rating: skillRating,
        performance_rating: performanceRating,
        service_quality_rating: serviceQualityRating,
        friendly_rating: friendlyRating,
        cost_efficiency_rating: costEfficiencyRating,
        review_text: reviewText
      };

      if (editId) {
        await api.patch(`users/reviews/${editId}/`, payload);
        Alert.alert('Success', 'Review updated successfully!', [
          { text: 'OK', onPress: () => { router.dismissAll(); router.push(`/WorkerProfileView/${id}` as any); } }
        ]);
      } else {
        await api.post(`users/reviews/`, payload);
        Alert.alert('Success', 'Review submitted successfully!', [
          { text: 'OK', onPress: () => { router.dismissAll(); router.push(`/WorkerProfileView/${id}` as any); } }
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to submit review.';
      if (Array.isArray(msg)) {
        Alert.alert('Error', msg[0]);
      } else {
        Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (label: string, value: number, setter: (val: number) => void) => (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setter(star)} style={styles.starPressable}>
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={28}
              color={star <= value ? '#FFC107' : '#333333'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#FFC107" /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.headerTitle}>{editId ? 'Edit Review' : 'Add Review'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Rate your experience</Text>
          <Text style={styles.introSubtitle}>Your feedback helps our community.</Text>
        </View>
        {renderStars('Skill', skillRating, setSkillRating)}
        {renderStars('Performance', performanceRating, setPerformanceRating)}
        {renderStars('Service Quality', serviceQualityRating, setServiceQualityRating)}
        {renderStars('Friendly', friendlyRating, setFriendlyRating)}
        {renderStars('Cost Efficiency', costEfficiencyRating, setCostEfficiencyRating)}

        <Text style={styles.inputLabel}>Review (Optional)</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="Share your experience with this worker..."
          placeholderTextColor="#666666"
          textAlignVertical="top"
        />

        <Pressable
          style={styles.submitBtn}
          onPress={submitReview}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text style={styles.submitBtnText}>{editId ? 'Update Review' : 'Submit Review'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#121212',
  },
  backButton: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#FFC107', textAlign: 'center' },
  container: { padding: 20 },
  introContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 5,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#1A1A1A',
    padding: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  starLabel: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  stars: { flexDirection: 'row', gap: 2 },
  starPressable: { padding: 2 },
  inputLabel: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 15, color: '#FFC107' },
  textInput: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    minHeight: 140,
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF'
  },
  submitBtn: {
    backgroundColor: '#FFC107',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnText: { color: '#121212', fontSize: 18, fontWeight: '900' },
});