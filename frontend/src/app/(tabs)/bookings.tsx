import { View, Text, StyleSheet } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import { Loader } from '../../components/Loader';
import { ErrorText } from '../../components/ErrorText';

// Minimal item reference extraction
const renderBookingItem = ({ item }: { item: any }) => (
  <View style={styles.card}>
    <Text style={styles.workerName}>Request sent to: {item.worker?.user?.username || 'Worker'}</Text>
    <Text style={styles.status}>Status: {item.status}</Text>
    <Text style={styles.date}>{item.date} at {item.time}</Text>
    <Text style={styles.desc}>{item.description}</Text>
  </View>
);

export default function BookingsScreen() {
  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: jobService.getJobs
  });

  if (isLoading) return <Loader />;
  if (error) return <ErrorText message="Failed to load bookings." />;

  return (
    <View style={styles.container}>
      <LegendList
        data={bookings}
        keyExtractor={(item: any) => item.id.toString()}
        estimatedItemSize={120}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={renderBookingItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: 16 },
  card: { padding: 16, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderCurve: 'continuous', gap: 4 },
  workerName: { fontSize: 18, fontWeight: '600' },
  status: { color: '#007AFF', fontWeight: 'bold' },
  date: { color: '#666', fontSize: 12 },
  desc: { color: '#333', marginTop: 4 }
});