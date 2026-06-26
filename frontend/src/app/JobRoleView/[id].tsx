import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';
import { CATEGORIES } from '../../constants/categories';
import { useAuthStore } from '../../store/useAuthStore';

export default function JobRoleViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchJobRole();
  }, [id]);

  const fetchJobRole = async () => {
    try {
      // Use the public search endpoint which allows viewing any active job role
      const res = await api.get(`services/search/job-roles/${id}/`);
      setRole(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch job role details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading || !role) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007aff" />
      </SafeAreaView>
    );
  }

  const categoryInfo = CATEGORIES.find(c => c.id === role.category);
  const categoryName = categoryInfo ? categoryInfo.name : role.category;
  const isOwner = currentUser?.id === role.worker?.user?.id;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>Job Role Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 100) }}>
        <View style={styles.card}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color="#666" />
            <Text style={styles.detailText}>${role.hourly_rate} / hour</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{role.experience_years} years experience</Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{role.description || 'No description provided.'}</Text>
          </View>
        </View>
      </ScrollView>

      {!isOwner && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <Pressable style={styles.bookButton} onPress={() => router.push(`/BookingForm/${role.id}` as any)}>
            <Text style={styles.bookButtonText}>Book Service</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  container: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  descriptionContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  bookButton: {
    backgroundColor: '#34c759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
