import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { Loader } from '../../components/Loader';
import { ErrorText } from '../../components/ErrorText';
import { WorkerCard } from '../../components/WorkerCard';

// --- Icon Mapping Helper ---
const getCategoryIcon = (name: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('plumb')) return 'pipe-wrench';
  if (lowerName.includes('electric')) return 'lightning-bolt';
  if (lowerName.includes('clean')) return 'broom';
  if (lowerName.includes('paint')) return 'format-paint';
  if (lowerName.includes('carp')) return 'saw-blade';
  if (lowerName.includes('garden') || lowerName.includes('landscap')) return 'leaf';
  if (lowerName.includes('mechanic') || lowerName.includes('auto')) return 'car-wrench';
  return 'tools'; // default fallback icon
};

// --- Static Fallback Categories ---
const STATIC_CATEGORIES = [
  { id: '1', name: 'Plumber' },
  { id: '2', name: 'Electrician' },
  { id: '3', name: 'Cleaner' },
  { id: '4', name: 'Painter' },
  { id: '5', name: 'Carpenter' },
  { id: '6', name: 'Gardener' },
  { id: '7', name: 'Mechanic' },
];

// --- Extracted Components for Performance (Rule 2.1 & 2.2) ---

const CategoryItem = ({ item, onPress }: { item: any, onPress: (id: string) => void }) => {
  const handlePress = () => onPress(item.id);
  return (
    <Pressable onPress={handlePress} style={styles.categoryCard}>
      <MaterialCommunityIcons name={getCategoryIcon(item.name)} size={32} color="#007AFF" />
      <Text style={styles.categoryTitle}>{item.name}</Text>
    </Pressable>
  );
};

const FeaturedWorkerItem = ({ item, onPress }: { item: any, onPress: (id: string) => void }) => {
  const handlePress = () => onPress(item.id);
  const workerName = item.user ? `${item.user.first_name} ${item.user.last_name}` : 'Worker';
  const categoryName = item.categories?.length > 0 ? item.categories[0].name : 'General';

  return (
    <Pressable onPress={handlePress} style={styles.workerWrapper}>
      <WorkerCard
        name={workerName}
        category={categoryName}
        hourlyRate={item.hourly_rate}
        rating={item.rating}
      />
    </Pressable>
  );
};

// --- Main Screen ---

export default function HomeScreen() {
  const { push } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading: isCatsLoading, error: catError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/services/categories/');
      return res.data;
    }
  });

  const { data: workers, isLoading: isWorkersLoading, error: workerError } = useQuery({
    queryKey: ['workers', 'featured'],
    queryFn: async () => {
      const res = await apiClient.get('/services/workers/');
      return res.data;
    }
  });

  const handleCategoryPress = useCallback((id: string) => {
    push(`/workers/${id}` as any);
  }, [push]);

  const handleWorkerPress = useCallback((id: string) => {
    push(`/worker/${id}` as any);
  }, [push]);

  const renderCategory = useCallback(({ item }: { item: any }) => (
    <CategoryItem item={item} onPress={handleCategoryPress} />
  ), [handleCategoryPress]);

  const renderWorker = useCallback(({ item }: { item: any }) => (
    <FeaturedWorkerItem item={item} onPress={handleWorkerPress} />
  ), [handleWorkerPress]);

  if (isCatsLoading || isWorkersLoading) return <Loader />;
  if (catError || workerError) return <ErrorText message="Failed to load dashboard data." />;

  // Safely slice the workers list for the featured section
  const featuredWorkers = Array.isArray(workers) ? workers.slice(0, 5) : [];
  
  const displayCategories = categories?.length > 0 ? categories : STATIC_CATEGORIES;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
      {/* Header / Location Banner */}
      <View style={styles.header}>
        <Text style={styles.locationLabel}>Current Location</Text>
        <Pressable style={styles.locationButton}>
          <Text style={styles.locationText}>📍 Thiruvananthapuram, Kerala</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for 'Electrician', 'Plumber'..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Service Categories Carousel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Categories</Text>
        <View style={styles.categoryListWrapper}>
          <LegendList
            style={styles.flexList}
            horizontal
            data={displayCategories}
            keyExtractor={(item: any) => item.id.toString()}
            estimatedItemSize={136} // 120 width + 16 margin
            renderItem={renderCategory}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>

      {/* Featured Workers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby & Featured</Text>
        <View style={styles.workerListWrapper}>
          {featuredWorkers.length > 0 ? (
            <LegendList
              style={styles.flexList}
              horizontal
              data={featuredWorkers}
              keyExtractor={(item: any) => item.id.toString()}
              estimatedItemSize={296} // 280 width + 16 margin
              renderItem={renderWorker}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <Text style={styles.emptyText}>No featured workers found nearby.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { padding: 24, paddingBottom: 16, gap: 4 },
  locationLabel: { fontSize: 12, color: '#666', fontWeight: '600', textTransform: 'uppercase' },
  locationButton: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 18, fontWeight: '700', color: '#111' },
  searchSection: { paddingHorizontal: 24, paddingBottom: 24 },
  searchInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
  },
  section: { gap: 12, paddingBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', paddingHorizontal: 24, color: '#111' },
  flexList: { flex: 1 },
  categoryListWrapper: { height: 120 }, // Explicit height required inside ScrollView
  workerListWrapper: { height: 130 }, // Explicit height required inside ScrollView
  listContent: { paddingHorizontal: 24 },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginRight: 16,
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  categoryTitle: { fontWeight: '600', fontSize: 13, textAlign: 'center', color: '#333' },
  workerWrapper: {
    marginRight: 16,
    width: 280,
  },
  emptyText: { paddingHorizontal: 24, color: '#666', fontStyle: 'italic' }
});