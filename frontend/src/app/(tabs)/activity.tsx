import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';

// Dummy Data
interface JobItem {
  id: number;
  title: string;
  status: string;
  worker?: string | null;
  customer?: string;
  distance?: string;
}

const customerActiveRequests: JobItem[] = [
  { id: 1, title: 'Fix leaking pipe', status: 'Pending', worker: null },
  { id: 2, title: 'Install ceiling fan', status: 'Active', worker: 'Jane Smith' },
];
const customerPastRequests: JobItem[] = [
  { id: 3, title: 'House Cleaning', status: 'Completed', worker: 'Alice Johnson' },
  { id: 4, title: 'Garden Mowing', status: 'Cancelled', worker: null },
];

const workerActiveJobs: JobItem[] = [
  { id: 1, title: 'Fix leaking pipe', status: 'Incoming', customer: 'John Doe', distance: '2km' },
  { id: 2, title: 'Install ceiling fan', status: 'Active', customer: 'Mark L.', distance: '5km' },
];
const workerPastJobs: JobItem[] = [
  { id: 3, title: 'House Cleaning', status: 'Completed', customer: 'Sarah W.' },
  { id: 4, title: 'Window Cleaning', status: 'Rejected', customer: 'Tom B.' },
];

function CustomerActivityScreen() {
  const [tab, setTab] = useState<'Active' | 'Past'>('Active');
  
  const renderList = () => {
    const list = tab === 'Active' ? customerActiveRequests : customerPastRequests;
    if (list.length === 0) return <Text style={styles.emptyText}>No requests found.</Text>;
    return list.map(item => (
      <View key={item.id} style={styles.card}>
        <View>
          <Text style={styles.jobTitle}>{item.title}</Text>
          {item.worker && <Text style={styles.subText}>Worker: {item.worker}</Text>}
        </View>
        <Text style={[styles.badge, getBadgeStyle(item.status)]}>[{item.status}]</Text>
      </View>
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

function WorkerActivityScreen() {
  const [tab, setTab] = useState<'Active' | 'Past'>('Active');
  
  const renderList = () => {
    const list = tab === 'Active' ? workerActiveJobs : workerPastJobs;
    if (list.length === 0) return <Text style={styles.emptyText}>No jobs found.</Text>;
    return list.map(item => (
      <View key={item.id} style={styles.card}>
        <View>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.subText}>Customer: {item.customer} {item.distance ? `(${item.distance})` : ''}</Text>
        </View>
        <Text style={[styles.badge, getBadgeStyle(item.status)]}>[{item.status}]</Text>
      </View>
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

function getBadgeStyle(status: string) {
  switch(status) {
    case 'Pending':
    case 'Incoming':
      return { color: '#ff9500' };
    case 'Active':
      return { color: '#007aff' };
    case 'Completed':
      return { color: '#34c759' };
    case 'Cancelled':
    case 'Rejected':
      return { color: '#ff3b30' };
    default:
      return { color: '#888' };
  }
}

export default function ActivityScreen() {
  const activeRole = useAuthStore((state) => state.activeRole);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {activeRole === 'worker' ? <WorkerActivityScreen /> : <CustomerActivityScreen />}
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
  badge: { fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 16 },
});