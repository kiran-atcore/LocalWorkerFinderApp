import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import api, { getImageUrl } from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function CategoryListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [maxRate, setMaxRate] = useState(200);
  const [minExp, setMinExp] = useState(0);
  const [radius, setRadius] = useState(50); // Default 50km
  const [isRadiusEnabled, setIsRadiusEnabled] = useState(true);
  
  const { searchLocation } = useAuthStore();

  const categoryName = typeof id === 'string' ? id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ') : 'Category';

  useEffect(() => {
    fetchJobRoles();
  }, [id]);

  const fetchJobRoles = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`services/search/job-roles/?category=${id}`);
      setJobRoles(res.data);
    } catch (error) {
      console.error('Failed to fetch job roles', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const rolesWithDistance = jobRoles.map(role => {
    let distance = undefined;
    const worker = role.worker;
    if (searchLocation && worker.latitude && worker.longitude) {
      distance = getDistance(searchLocation.latitude, searchLocation.longitude, parseFloat(worker.latitude), parseFloat(worker.longitude));
    }
    return { ...role, distance };
  });

  const filteredRoles = rolesWithDistance.filter(role => {
    const worker = role.worker;
    const name = worker.user.first_name ? `${worker.user.first_name} ${worker.user.last_name}` : worker.user.username;
    
    if (searchText && !name.toLowerCase().includes(searchText.toLowerCase())) return false;
    if (maxRate < 200 && parseFloat(role.hourly_rate) > maxRate) return false;
    if (minExp > 0 && role.experience_years < minExp) return false;
    
    if (isRadiusEnabled && role.distance !== undefined) {
      if (role.distance > radius) return false;
    }
    
    return true;
  });

  const renderWorker = ({ item }: { item: any }) => {
    const worker = item.worker;
    const name = worker.user.first_name ? `${worker.user.first_name} ${worker.user.last_name}` : worker.user.username;
    
    return (
      <Pressable style={styles.card} onPress={() => router.push(`/ServiceView/${item.id}` as any)}>
        {worker.profile_photo ? (
          <Image source={{ uri: getImageUrl(worker.profile_photo) as string }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#aaa" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.workerName}>{name}</Text>
          {worker.business_name ? <Text style={styles.businessName}>{worker.business_name}</Text> : null}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f1c40f" />
            <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
            {item.distance !== undefined && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Ionicons name="location" size={14} color="#7f8c8d" />
                <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>${item.hourly_rate}/hr</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>{categoryName} Workers</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by worker name..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <View style={styles.slidersRow}>
          <View style={styles.sliderCol}>
            <Text style={styles.filterLabel}>Max Rate: {maxRate === 200 ? 'Any' : `$${maxRate}/hr`}</Text>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={200}
              step={5}
              value={maxRate}
              onValueChange={setMaxRate}
              minimumTrackTintColor="#007aff"
              maximumTrackTintColor="#ddd"
            />
          </View>
          <View style={styles.sliderCol}>
            <Text style={styles.filterLabel}>Min Exp: {minExp === 0 ? 'Any' : `${minExp} yrs`}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={20}
              step={1}
              value={minExp}
              onValueChange={setMinExp}
              minimumTrackTintColor="#007aff"
              maximumTrackTintColor="#ddd"
            />
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderLabelContainer}>
              <Text style={styles.sliderLabel}>Search Radius</Text>
              <Switch
                value={isRadiusEnabled}
                onValueChange={setIsRadiusEnabled}
                trackColor={{ false: '#ddd', true: '#007aff' }}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
            <Text style={[styles.sliderValue, !isRadiusEnabled && { color: '#aaa' }]}>{radius} km</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={5}
            maximumValue={100}
            step={5}
            value={radius}
            onValueChange={setRadius}
            disabled={!isRadiusEnabled}
            minimumTrackTintColor={isRadiusEnabled ? "#007aff" : "#ddd"}
            maximumTrackTintColor="#ddd"
            thumbTintColor={isRadiusEnabled ? "#007aff" : "#bbb"}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007aff" />
        </View>
      ) : (
        <FlatList
          data={filteredRoles}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWorker}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 20) }]}
          ListEmptyComponent={<Text style={styles.emptyText}>No workers found in this category.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    padding: 5,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  slidersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderCol: {
    flex: 1,
    marginHorizontal: 5,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  listContent: {
    padding: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  dotSeparator: {
    fontSize: 14,
    color: '#bdc3c7',
    marginHorizontal: 8,
  },
  distanceText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 2,
  },
  priceContainer: {
    paddingLeft: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
    fontSize: 16,
  },
  sliderContainer: { marginTop: 15 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sliderLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sliderLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  sliderValue: { fontSize: 14, fontWeight: 'bold', color: '#007aff' },
});
