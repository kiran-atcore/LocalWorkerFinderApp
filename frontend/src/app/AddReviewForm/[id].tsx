import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
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
          <Pressable key={star} onPress={() => setter(star)}>
            <Ionicons 
              name={star <= value ? 'star' : 'star-outline'} 
              size={32} 
              color={star <= value ? '#fadb14' : '#d9d9d9'} 
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#007aff" /></View>;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>{editId ? 'Edit Review' : 'Add Review'}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
          textAlignVertical="top"
        />

        <Pressable 
          style={styles.submitBtn} 
          onPress={submitReview} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{editId ? 'Update Review' : 'Submit Review'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  container: { padding: 20 },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  starLabel: { fontSize: 16, fontWeight: '500', color: '#333' },
  stars: { flexDirection: 'row', gap: 5 },
  inputLabel: { fontSize: 16, fontWeight: '500', marginTop: 10, marginBottom: 10, color: '#333' },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#fafafa',
  },
  submitBtn: {
    backgroundColor: '#007aff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});