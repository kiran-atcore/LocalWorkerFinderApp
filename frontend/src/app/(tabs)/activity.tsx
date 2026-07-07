import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/axios';
import { CATEGORIES } from '../../constants/categories';

const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

function CustomerActivityScreen({ bookings, isLoading }: { bookings: any[], isLoading: boolean }) {
  const [tab, setTab] = useState<'Active' | 'Past'>('Active');
  const router = useRouter();

  const getCategoryName = (categoryId: string) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  const renderList = () => {
    if (isLoading) return <ActivityIndicator size="large" color="#FFC107" style={{ marginTop: 20 }} />;

    // Customer Active: PENDING, ACCEPTED
    // Customer Past: REJECTED, CANCELLED, COMPLETED
    const list = bookings.filter(b =>
      tab === 'Active'
        ? ['PENDING', 'ACCEPTED', 'ACTIVE'].includes(b.status)
        : ['REJECTED', 'CANCELLED', 'COMPLETED'].includes(b.status)
    );

    if (list.length === 0) return <Text style={styles.emptyText}>No requests found.</Text>;

    return list.map(item => (
      <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/BookingDetailsView/${item.id}` as any)}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={styles.cardRow}>
            <Ionicons name="briefcase-outline" size={18} color="#FFC107" style={styles.cardIcon} />
            <Text style={styles.jobTitle} numberOfLines={1}>{getCategoryName(item.job_role_details.category)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="person-outline" size={14} color="#A0A0A0" style={styles.cardIcon} />
            <Text style={styles.subText}>Worker: {item.worker_details.name}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={14} color="#A0A0A0" style={styles.cardIcon} />
            <Text style={styles.dateText}>
              {tab === 'Active' ? `Booked: ${formatDateTime(item.created_at)}` : `Closed: ${formatDateTime(item.updated_at)}`}
            </Text>
          </View>
        </View>
        <View style={[styles.badgeContainer, getBadgeStyle(item.status, 'customer').container]}>
          <Text style={[styles.badgeText, getBadgeStyle(item.status, 'customer').text]}>{item.status}</Text>
        </View>
      </Pressable>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your Requests</Text>
      <View style={styles.tabContainer}>
        <Pressable style={[styles.tab, tab === 'Active' && styles.activeTab]} onPress={() => setTab('Active')}>
          <Text style={[styles.tabText, tab === 'Active' && styles.activeTabText]}>Active</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'Past' && styles.activeTab]} onPress={() => setTab('Past')}>
          <Text style={[styles.tabText, tab === 'Past' && styles.activeTabText]}>Past</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.scrollArea}>
        {renderList()}
      </ScrollView>
    </View>
  );
}

function WorkerActivityScreen({ bookings, isLoading }: { bookings: any[], isLoading: boolean }) {
  const [tab, setTab] = useState<'Active' | 'Past'>('Active');
  const router = useRouter();

  const getCategoryName = (categoryId: string) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  const renderList = () => {
    if (isLoading) return <ActivityIndicator size="large" color="#FFC107" style={{ marginTop: 20 }} />;

    // Worker Active: PENDING, ACCEPTED
    // Worker Past: REJECTED, COMPLETED
    // Exclude CANCELLED completely from worker view
    const list = bookings.filter(b => b.status !== 'CANCELLED').filter(b =>
      tab === 'Active'
        ? ['PENDING', 'ACCEPTED', 'ACTIVE'].includes(b.status)
        : ['REJECTED', 'COMPLETED'].includes(b.status)
    );

    if (list.length === 0) return <Text style={styles.emptyText}>No jobs found.</Text>;

    return list.map(item => (
      <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/BookingDetailsView/${item.id}` as any)}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={styles.cardRow}>
            <Ionicons name="briefcase-outline" size={18} color="#FFC107" style={styles.cardIcon} />
            <Text style={styles.jobTitle} numberOfLines={1}>{getCategoryName(item.job_role_details.category)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="person-outline" size={14} color="#A0A0A0" style={styles.cardIcon} />
            <Text style={styles.subText}>Customer: {item.customer_details.name}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={14} color="#A0A0A0" style={styles.cardIcon} />
            <Text style={styles.dateText}>
              {tab === 'Active' ? `Booked: ${formatDateTime(item.created_at)}` : `Closed: ${formatDateTime(item.updated_at)}`}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.badgeContainer, getBadgeStyle(item.status, 'worker').container]}>
            <Text style={[styles.badgeText, getBadgeStyle(item.status, 'worker').text]}>
              {item.status === 'PENDING' ? 'INCOMING' : item.status}
            </Text>
          </View>
        </View>
      </Pressable>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your Jobs</Text>
      <View style={styles.tabContainer}>
        <Pressable style={[styles.tab, tab === 'Active' && styles.activeTab]} onPress={() => setTab('Active')}>
          <Text style={[styles.tabText, tab === 'Active' && styles.activeTabText]}>Active</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'Past' && styles.activeTab]} onPress={() => setTab('Past')}>
          <Text style={[styles.tabText, tab === 'Past' && styles.activeTabText]}>Past</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.scrollArea}>
        {renderList()}
      </ScrollView>
    </View>
  );
}

function getBadgeStyle(status: string, role: string) {
  let color = '#A0A0A0';
  switch (status) {
    case 'PENDING': color = '#FFC107'; break; 
    case 'ACCEPTED': color = '#FFB300'; break;
    case 'ACTIVE': color = '#FFC107'; break;
    case 'COMPLETED': color = '#FFC107'; break;
    case 'CANCELLED':
    case 'REJECTED': color = '#FF6B6B'; break;
  }
  return {
    container: { backgroundColor: '#333333', borderColor: color, borderWidth: 1 },
    text: { color: color }
  };
}

export default function ActivityScreen() {
  const activeRole = useAuthStore((state) => state.activeRole);
  const currentUser = useAuthStore((state) => state.user);

  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) return;

    try {
      setIsLoading(true);
      const res = await api.get('bookings/');
      setAllBookings(res.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookings based on current context
  const contextBookings = allBookings.filter(b => {
    if (!currentUser) return false;
    if (activeRole === 'customer') {
      return b.customer_details.user_id === currentUser.id;
    } else {
      return b.worker_details.user_id === currentUser.id;
    }
  });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#121212' }}>
      {activeRole === 'worker' ? (
        <WorkerActivityScreen bookings={contextBookings} isLoading={isLoading} />
      ) : (
        <CustomerActivityScreen bookings={contextBookings} isLoading={isLoading} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', padding: 20, backgroundColor: '#1E1E1E', paddingBottom: 10, color: '#FFC107' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderBottomWidth: 1, borderColor: '#333333' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderColor: '#FFC107' },
  tabText: { fontSize: 16, color: '#A0A0A0', fontWeight: '600' },
  activeTabText: { color: '#FFC107', fontWeight: 'bold' },
  scrollArea: { flex: 1, padding: 15 },
  card: { padding: 15, backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardIcon: { marginRight: 8 },
  jobTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', flexShrink: 1 },
  subText: { fontSize: 14, color: '#A0A0A0' },
  dateText: { fontSize: 12, color: '#A0A0A0', fontStyle: 'italic' },
  badgeContainer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#A0A0A0', fontSize: 16 },
});