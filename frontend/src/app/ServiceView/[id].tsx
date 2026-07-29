import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api, { getImageUrl } from '../../services/axios';
import { CATEGORIES } from '../../constants/categories';
import { useAuthStore } from '../../store/useAuthStore';

export default function ServiceViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);

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
        <ActivityIndicator size="large" color="#FFC107" />
      </SafeAreaView>
    );
  }

  if (!jobRole) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.center}>
        <Text style={{ color: '#FFFFFF' }}>Service not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#FFC107' }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const worker = jobRole.worker;
  const workerName = worker.user.first_name ? `${worker.user.first_name} ${worker.user.last_name}` : worker.user.username;
  const isOwner = currentUser?.id === worker.user.id;

  const categoryInfo = CATEGORIES.find(c => c.id === jobRole.category);
  const categoryName = categoryInfo ? categoryInfo.name : jobRole.category;

  const renderIcon = () => {
    if (!categoryInfo) return <Ionicons name="briefcase" size={28} color="#FFC107" />;

    if (categoryInfo.iconFamily === 'MaterialIcons') {
      return <MaterialIcons name={categoryInfo.iconName as any} size={28} color={categoryInfo.color} />;
    } else if (categoryInfo.iconFamily === 'FontAwesome5') {
      return <FontAwesome5 name={categoryInfo.iconName as any} size={28} color={categoryInfo.color} />;
    }
    return <Ionicons name={categoryInfo.iconName as any} size={28} color={categoryInfo.color} />;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.title}>Service Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 100) }]}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#333333' }]}>
              {renderIcon()}
            </View>
            <Text style={styles.categoryTitle}>{categoryName}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="cash-outline" size={20} color="#FFC107" />
              <Text style={styles.statPillText}>${jobRole.hourly_rate} / hr</Text>
            </View>

            <View style={styles.statPill}>
              <Ionicons name="briefcase-outline" size={20} color="#FFC107" />
              <Text style={styles.statPillText}>{jobRole.experience_years} yrs exp</Text>
            </View>
          </View>

          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{jobRole.description || 'No description provided.'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitleHeader}>About the Worker</Text>
        <View style={styles.card}>
          <View style={styles.workerRow}>
            {worker.profile_photo ? (
              <Image source={{ uri: getImageUrl(worker.profile_photo) as string }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#A0A0A0" />
              </View>
            )}
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{workerName}</Text>
              {worker.business_name ? <Text style={styles.businessName}>{worker.business_name}</Text> : null}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFC107" />
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

      {!isOwner && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <Pressable style={styles.bookButton} onPress={() => router.push(`/BookingForm/${jobRole.id}` as any)}>
            <Text style={styles.bookButtonText}>Book Service</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333333'
  },
  backButton: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#FFC107' },
  container: { padding: 15 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 8,
  },
  statPillText: {
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  descriptionBox: {
    backgroundColor: '#121212',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFC107',
  },
  descriptionText: {
    fontSize: 15,
    color: '#A0A0A0',
    lineHeight: 22,
  },
  sectionTitleHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFC107',
    paddingHorizontal: 5,
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
    backgroundColor: '#333333',
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
    color: '#FFFFFF'
  },
  businessName: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
    marginLeft: 4,
  },
  profileButton: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#FFC107',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    padding: 15,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  bookButton: {
    backgroundColor: '#FFC107',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
