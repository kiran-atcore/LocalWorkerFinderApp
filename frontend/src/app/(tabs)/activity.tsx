import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
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
    if (isLoading) return <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />;
    
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
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{getCategoryName(item.job_role_details.category)}</Text>
          <Text style={styles.subText}>Worker: {item.worker_details.name}</Text>
          <Text style={styles.dateText}>
            {tab === 'Active' ? `Booked: ${formatDateTime(item.created_at)}` : `Closed: ${formatDateTime(item.updated_at)}`}
          </Text>
        </View>
        <Text style={[styles.badge, getBadgeStyle(item.status, 'customer')]}>[{item.status}]</Text>
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
    if (isLoading) return <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />;
    
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
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{getCategoryName(item.job_role_details.category)}</Text>
          <Text style={styles.subText}>Customer: {item.customer_details.name}</Text>
          <Text style={styles.dateText}>
            {tab === 'Active' ? `Booked: ${formatDateTime(item.created_at)}` : `Closed: ${formatDateTime(item.updated_at)}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.badge, getBadgeStyle(item.status, 'worker')]}>
            [{item.status === 'PENDING' ? 'INCOMING' : item.status}]
          </Text>
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
  switch(status) {
    case 'PENDING':
      return { color: '#ff9500' }; // Will be displayed as INCOMING for worker
    case 'ACCEPTED':
      return { color: '#007aff' };
    case 'ACTIVE':
      return { color: '#5856d6' };
    case 'COMPLETED':
      return { color: '#34c759' };
    case 'CANCELLED':
    case 'REJECTED':
      return { color: '#ff3b30' };
    default:
      return { color: '#888' };
  }
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {activeRole === 'worker' ? (
        <WorkerActivityScreen bookings={contextBookings} isLoading={isLoading} />
      ) : (
        <CustomerActivityScreen bookings={contextBookings} isLoading={isLoading} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', padding: 20, backgroundColor: '#fff', paddingBottom: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderColor: '#007aff' },
  tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#007aff', fontWeight: 'bold' },
  scrollArea: { flex: 1, padding: 15 },
  card: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { fontSize: 16, fontWeight: '500' },
  subText: { fontSize: 14, color: '#666', marginTop: 4 },
  dateText: { fontSize: 12, color: '#999', marginTop: 6, fontStyle: 'italic' },
  badge: { fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 16 },
});