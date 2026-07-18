import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api from '../../services/axios';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewList() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [id])
  );

  const fetchReviews = async () => {
    try {
      const res = await api.get(`users/reviews/?worker_id=${id}`);
      setReviews(res.data);
    } catch (e) {
      console.error('Failed to fetch reviews', e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const createdTime = new Date(item.created_at).getTime();
    const updatedTime = item.updated_at ? new Date(item.updated_at).getTime() : createdTime;
    const isEdited = updatedTime - createdTime > 1000;
    const displayDate = new Date(isEdited ? updatedTime : createdTime);
    const dateStr = displayDate.toLocaleDateString() + ' ' + displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (isEdited ? ' (Edited)' : '');

    return (
      <Pressable key={item.id} style={styles.reviewCard} onPress={() => router.push(`/ReviewView/${item.id}` as any)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFC107', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ color: '#121212', fontWeight: 'bold', fontSize: 18 }}>
                {(item.customer?.user?.first_name || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.reviewAuthor}>{item.customer?.user?.first_name || 'Customer'} {item.customer?.user?.last_name || ''}</Text>
              <Text style={{ color: '#A0A0A0', fontSize: 12 }}>{dateStr}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#1E1E1E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFC107', flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={12} color="#FFC107" style={{ marginRight: 4 }} />
            <Text style={styles.reviewStars}>{item.overall_rating.toFixed(1)}</Text>
          </View>
        </View>
        {item.review_text ? <Text style={styles.reviewText} numberOfLines={3}>"{item.review_text}"</Text> : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.title}>All Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFC107" /></View>
      ) : reviews.length === 0 ? (
        <View style={styles.center}><Text style={{color: '#A0A0A0'}}>No reviews found.</Text></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
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
  list: { padding: 15 },
  reviewCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },
  reviewAuthor: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    color: '#FFFFFF',
  },
  reviewStars: {
    color: '#FFC107',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewText: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  }
});