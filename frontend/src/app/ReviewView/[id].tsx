import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api from '../../services/axios';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';

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

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#007aff" /></View>;
  if (!review) return null;

  const isOwner = user && review.customer?.user?.id === user.id;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>Review Details</Text>
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
            <Text style={styles.overallText}>Overall: ⭐ {review.overall_rating.toFixed(1)}</Text>
          </View>

          <View style={styles.statsList}>
            <View style={styles.statRow}><Text style={styles.statLabel}>Skill</Text><Text style={styles.statValue}>⭐ {review.skill_rating}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Performance</Text><Text style={styles.statValue}>⭐ {review.performance_rating}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Service Quality</Text><Text style={styles.statValue}>⭐ {review.service_quality_rating}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Friendly</Text><Text style={styles.statValue}>⭐ {review.friendly_rating}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Cost Efficiency</Text><Text style={styles.statValue}>⭐ {review.cost_efficiency_rating}</Text></View>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  backBtn: { marginRight: 15 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  author: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  date: { color: '#888', fontSize: 14, marginBottom: 15 },
  overallRating: {
    backgroundColor: '#fffbe6',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffe58f',
    alignItems: 'center',
    marginBottom: 20,
  },
  overallText: { color: '#d48806', fontSize: 18, fontWeight: 'bold' },
  statsList: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  statLabel: { fontSize: 15, color: '#555' },
  statValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  textContainer: {
    marginTop: 10,
  },
  textLabel: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#333' },
  text: { fontSize: 15, color: '#444', lineHeight: 22 },
  actions: { marginTop: 20, gap: 10 },
  btn: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtn: { backgroundColor: '#007aff' },
  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  deleteBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ff3b30' },
  deleteBtnText: { color: '#ff3b30', fontWeight: 'bold', fontSize: 16 },
});