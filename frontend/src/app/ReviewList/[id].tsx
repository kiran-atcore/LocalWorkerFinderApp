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
      <Pressable 
        style={styles.reviewCard} 
        onPress={() => router.push(`/ReviewView/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.author}>{item.customer?.user?.first_name || 'Customer'} {item.customer?.user?.last_name || ''}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <Text style={styles.stars}>⭐ {item.overall_rating.toFixed(1)}</Text>
        {item.review_text ? (
          <Text style={styles.text} numberOfLines={2}>{item.review_text}</Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>All Reviews</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#007aff" /></View>
      ) : reviews.length === 0 ? (
        <View style={styles.center}><Text>No reviews found.</Text></View>
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
  list: { padding: 15 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  author: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  date: { color: '#888', fontSize: 12 },
  stars: { color: '#d48806', fontSize: 14, marginBottom: 8 },
  text: { color: '#555', fontSize: 14, lineHeight: 20 },
  viewMore: { color: '#007aff', fontSize: 13, marginTop: 10, fontWeight: '500' }
});