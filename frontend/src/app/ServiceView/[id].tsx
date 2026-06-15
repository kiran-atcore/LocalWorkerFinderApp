import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '../../services/axios';

export default function ServiceViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [jobRole, setJobRole] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobRole();
  }, [id]);

  const fetchJobRole = async () => {
    try {
      const res = await api.get(`services/search/job-roles/${id}/`);
      setJobRole(res.data);
    } catch (error) {
      console.error('Failed to load service details', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.center}>
        <ActivityIndicator size="large" color="#007aff" />
      </SafeAreaView>
    );
  }

  if (!jobRole) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.center}>
        <Text>Service not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#007aff' }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const worker = jobRole.worker;
  const workerName = worker.user.first_name ? `${worker.user.first_name} ${worker.user.last_name}` : worker.user.username;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>Service Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.card}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{jobRole.category.toUpperCase()}</Text>
          </View>
          
          <Text style={styles.priceText}>${jobRole.hourly_rate} / hr</Text>
          <Text style={styles.expText}>{jobRole.experience_years} years of experience</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{jobRole.description || 'No description provided.'}</Text>
        </View>

        <Text style={styles.sectionTitleHeader}>About the Worker</Text>
        <View style={styles.card}>
          <View style={styles.workerRow}>
            {worker.profile_photo ? (
              <Image source={{ uri: getImageUrl(worker.profile_photo) as string }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#aaa" />
              </View>
            )}
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{workerName}</Text>
              {worker.business_name ? <Text style={styles.businessName}>{worker.business_name}</Text> : null}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#f1c40f" />
                <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
          
          <Pressable 
            style={styles.profileButton}
            onPress={() => router.push(`/WorkerProfileView/${worker.user.id}` as any)}
          >
            <Text style={styles.profileButtonText}>View Worker Profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
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
  container: { padding: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryBadge: {
    backgroundColor: '#e6f2ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 15,
  },
  categoryBadgeText: {
    color: '#007aff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  expText: {
    fontSize: 16,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionTitleHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    paddingHorizontal: 5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  profileButton: {
    backgroundColor: '#007aff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
