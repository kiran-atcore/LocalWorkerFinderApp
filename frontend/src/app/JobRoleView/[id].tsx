import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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
        <ActivityIndicator size="large" color="#FFC107" />
      </SafeAreaView>
    );
  }

  const categoryInfo = CATEGORIES.find(c => c.id === role.category);
  const categoryName = categoryInfo ? categoryInfo.name : role.category;
  const isOwner = currentUser?.id === role.worker?.user?.id;

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
        <Text style={styles.title}>Job Role Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 100) }}>
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
              <Text style={styles.statPillText}>${role.hourly_rate} / hr</Text>
            </View>
            
            <View style={styles.statPill}>
              <Ionicons name="briefcase-outline" size={20} color="#FFC107" />
              <Text style={styles.statPillText}>{role.experience_years} yrs exp</Text>
            </View>
          </View>

          <View style={styles.descriptionBox}>
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
  container: { padding: 20 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 20,
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
