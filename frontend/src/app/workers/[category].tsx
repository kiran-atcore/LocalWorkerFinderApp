import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { LegendList } from '@legendapp/list';
import { Loader } from '../../components/Loader';
import { ErrorText } from '../../components/ErrorText';
import { formatCurrency } from '../../utils/formatters';

// Avoid inline objects/functions in renderItem by abstracting (Rule 2.1 & 2.2)
const WorkerItem = ({ worker, onPress }: { worker: any, onPress: (id: string) => void }) => {
  const handlePress = () => onPress(worker.id);
  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <Text style={styles.name}>{worker.user?.first_name} {worker.user?.last_name}</Text>
      <Text style={styles.rate}>{formatCurrency(Number(worker.hourly_rate))}/hr</Text>
    </Pressable>
  );
};

export default function WorkerListScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { push } = useRouter();

  const { data: workers, isLoading, error } = useQuery({
    queryKey: ['workers', category],
    queryFn: async () => (await apiClient.get(`/services/workers/?category=${category}`)).data
  });

  const handlePress = useCallback((id: string) => {
    push(`/worker/${id}` as any);
  }, [push]);
  
  const renderItem = useCallback(({ item }: { item: any }) => (
    <WorkerItem worker={item} onPress={handlePress} />
  ), [handlePress]);

  if (isLoading) return <Loader />;
  if (error) return <ErrorText message="Failed to load workers." />;

  return (
    <View style={styles.container}>
      {workers?.length > 0 ? (
        <LegendList
          data={workers}
          keyExtractor={(item: any) => item.id.toString()}
          estimatedItemSize={80}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.emptyText}>No workers found for this category.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: 16 },
  card: { padding: 16, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderCurve: 'continuous', gap: 4 },
  name: { fontSize: 18, fontWeight: '600' },
  rate: { color: '#007AFF', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16, fontStyle: 'italic', paddingHorizontal: 24 }
});