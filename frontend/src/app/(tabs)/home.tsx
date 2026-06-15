import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import CategoryCard from '../../Components/CategoryCard';
import WorkerCard from '../../Components/WorkerCard';
import api from '../../services/axios';
import { CATEGORIES } from '../../constants/categories';

function CustomerHomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await api.get(`users/featured-workers/?search=${searchQuery}`);
        setWorkers(res.data);
      } catch (error) {
        console.error('Failed to fetch featured workers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchWorkers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>📍 Thiruvananthapuram, KL</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search services or workers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.categories}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <CategoryCard 
              key={cat.id}
              id={cat.id}
              name={cat.name}
              iconName={cat.iconName}
              iconFamily={cat.iconFamily as any}
              color={cat.color}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.featured}>
        <Text style={styles.sectionTitle}>Featured Workers</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />
        ) : workers.length > 0 ? (
          workers.map(worker => (
            <WorkerCard key={worker.id} worker={worker} />
          ))
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>No related workers found.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function WorkerHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>📍 Working in: Thiruvananthapuram, KL</Text>
      </View>

      <View style={styles.featured}>
        <Text style={styles.sectionTitle}>Latest Job Requests</Text>
        <View style={styles.workerCard}><Text>Fix leaking pipe - 2km away</Text></View>
        <View style={styles.workerCard}><Text>Install ceiling fan - 5km away</Text></View>
      </View>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const activeRole = useAuthStore((state) => state.activeRole);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {activeRole === 'worker' ? <WorkerHomeScreen /> : <CustomerHomeScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  banner: { padding: 20, backgroundColor: '#007AFF', alignItems: 'center' },
  bannerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  searchContainer: { margin: 15 },
  searchInput: { padding: 15, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  categories: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  categoryScroll: { paddingVertical: 10, paddingHorizontal: 5 },
  featured: { padding: 15 },
  workerCard: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  fallbackContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontSize: 16, color: '#888', fontStyle: 'italic' },
});