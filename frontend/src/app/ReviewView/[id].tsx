import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api from '../../services/axios';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';

const StarRating = ({ rating }: { rating: number }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={16} color="#FFC107" />
    ))}
  </View>
);

export default function ReviewView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchReview();
    }, [id])
  );

  const fetchReview = async () => {
    try {
      const res = await api.get(`users/reviews/${id}/`);
      setReview(res.data);
    } catch (e) {
      console.error('Failed to fetch review', e);
      Alert.alert('Error', 'Review not found');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`users/reviews/${id}/`);
            Alert.alert('Success', 'Review deleted.', [
              { text: 'OK', onPress: () => { router.dismissAll(); router.push(`/WorkerProfileView/${review.worker}` as any); } }
            ]);
          } catch (e) {
            Alert.alert('Error', 'Failed to delete review.');
          }
        }
      }
    ]);
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#FFC107" /></View>;
  if (!review) return null;

  const isOwner = user && review.customer?.user?.id === user.id;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.title}>Review Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.card}>
          <Text style={styles.author}>{review.customer?.user?.first_name} {review.customer?.user?.last_name}</Text>
          <Text style={styles.date}>
            {(() => {
              const createdTime = new Date(review.created_at).getTime();
              const updatedTime = review.updated_at ? new Date(review.updated_at).getTime() : createdTime;
              const isEdited = updatedTime - createdTime > 1000;
              const displayDate = new Date(isEdited ? updatedTime : createdTime);
              return displayDate.toLocaleDateString() + ' ' + displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (isEdited ? ' (Edited)' : '');
            })()}
          </Text>
          
          <View style={styles.overallRating}>
            <Ionicons name="star" size={40} color="#121212" style={{ marginBottom: 5 }} />
            <Text style={styles.overallText}>{review.overall_rating.toFixed(1)}</Text>
            <Text style={styles.overallLabel}>Out of 5</Text>
          </View>

          <View style={styles.statsList}>
            <View style={styles.statRow}><Text style={styles.statLabel}>Skill</Text><StarRating rating={review.skill_rating} /></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Performance</Text><StarRating rating={review.performance_rating} /></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Service Quality</Text><StarRating rating={review.service_quality_rating} /></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Friendly</Text><StarRating rating={review.friendly_rating} /></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Cost Efficiency</Text><StarRating rating={review.cost_efficiency_rating} /></View>
          </View>

          {review.review_text ? (
            <View style={styles.textContainer}>
              <Text style={styles.textLabel}>Review:</Text>
              <Text style={styles.text}>{review.review_text}</Text>
            </View>
          ) : null}
        </View>

        {isOwner && (
          <View style={styles.actions}>
            <Pressable 
              style={[styles.btn, styles.editBtn]}
              onPress={() => router.push(`/AddReviewForm/${review.worker}?editId=${review.id}` as any)}
            >
              <Text style={styles.editBtnText}>Edit Review</Text>
            </Pressable>
            <Pressable 
              style={[styles.btn, styles.deleteBtn]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteBtnText}>Delete Review</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#333333',
  },
  backBtn: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#FFC107', textAlign: 'center' },
  content: { padding: 15 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  author: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  date: { color: '#A0A0A0', fontSize: 14, marginBottom: 15 },
  overallRating: {
            backgroundColor: '#FFC107',
            padding: 20,
            borderRadius: 20,
            alignItems: 'center',
            marginBottom: 25,
            shadowColor: '#FFC107',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          },
          overallText: { color: '#121212', fontSize: 36, fontWeight: '900' },
          overallLabel: { color: '#121212', fontSize: 14, fontWeight: '600', opacity: 0.8 },
          statsList: {
            backgroundColor: '#1A1A1A',
            padding: 20,
            borderRadius: 16,
            marginBottom: 25,
          },
          statRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#2A2A2A',
          },
  statLabel: { fontSize: 16, color: '#A0A0A0', fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  textContainer: {
    marginTop: 5,
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
  },
  textLabel: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#FFC107' },
  text: { fontSize: 15, color: '#A0A0A0', lineHeight: 22 },
  actions: { marginTop: 20, gap: 10, flexDirection: 'row' },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  editBtn: { backgroundColor: '#FFC107' },
  editBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 16 },
  deleteBtn: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#F44336' },
  deleteBtnText: { color: '#F44336', fontWeight: 'bold', fontSize: 16 },
});