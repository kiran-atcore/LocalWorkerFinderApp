import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import api, { getImageUrl } from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { CATEGORIES } from '../../constants/categories';

export default function CategoryListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [parsedText, setParsedText] = useState('');
  const [maxRate, setMaxRate] = useState(200);
  const [minRate, setMinRate] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [minExp, setMinExp] = useState(0);
  const [radius, setRadius] = useState(50); // Default 50km
  const [isRadiusEnabled, setIsRadiusEnabled] = useState(true);

  const { searchLocation } = useAuthStore();

  const categoryName = typeof id === 'string' ? id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ') : 'Category';

  // Debounced NLP Parse
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchText) {
        try {
          const res = await api.get(`core/parse-query/?q=${encodeURIComponent(searchText)}`);
          if (res.data) {
            setParsedText(res.data.search_text || '');
            if (res.data.radius !== null && res.data.radius !== undefined) {
              setRadius(res.data.radius);
              setIsRadiusEnabled(true);
            } else {
              setIsRadiusEnabled(false);
            }
            if (res.data.max_rate !== null && res.data.max_rate !== undefined) setMaxRate(res.data.max_rate); else setMaxRate(200);
            if (res.data.min_rate !== null && res.data.min_rate !== undefined) setMinRate(res.data.min_rate); else setMinRate(0);
            if (res.data.min_rating !== null && res.data.min_rating !== undefined) setMinRating(res.data.min_rating); else setMinRating(0);
            if (res.data.min_experience !== null && res.data.min_experience !== undefined) setMinExp(res.data.min_experience); else setMinExp(0);
          }
        } catch (e) {
          console.error('NLP Parse error', e);
          setParsedText(searchText);
        }
      } else {
        setParsedText('');
        setIsRadiusEnabled(false);
        setMaxRate(200);
        setMinRate(0);
        setMinRating(0);
        setMinExp(0);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    const categoryObj = CATEGORIES.find(c => c.id === id);
    const categoryName = categoryObj ? categoryObj.name.toLowerCase() : '';

    // Reverse mapping for display names
    const roleToCategory: Record<string, string> = {
      "painter": "painting",
      "carpenter": "carpentry",
      "electrician": "electrical",
      "plumber": "plumbing",
      "exterminator": "pest control",
      "cleaner": "cleaning",
      "gardener": "gardening",
      "mover": "moving",
      "driver": "transportation",
      "transporter": "transportation"
    };
    const parsedTextLower = parsedText.toLowerCase();
    const categoryMatchStr = roleToCategory[parsedTextLower] || parsedTextLower;

    const isCategoryMatch = categoryName.includes(parsedTextLower) ||
      id.toString().toLowerCase().includes(parsedTextLower) ||
      categoryName.includes(categoryMatchStr) ||
      id.toString().toLowerCase().includes(categoryMatchStr);

    if (parsedText && !isCategoryMatch && !name.toLowerCase().includes(parsedTextLower)) return false;

    const rate = parseFloat(role.hourly_rate) || 0;
    if (maxRate < 200 && rate > maxRate) return false;
    if (minRate > 0 && rate < minRate) return false;

    if (minExp > 0 && role.experience_years < minExp) return false;

    const rating = parseFloat(worker.rating) || 0;
    if (minRating > 0 && rating < minRating) return false;

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
            <Ionicons name="star" size={16} color="#FFC107" />
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.title}>{categoryName} Workers</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#A0A0A0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by worker name..."
            placeholderTextColor="#666666"
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
              minimumTrackTintColor="#FFC107"
              maximumTrackTintColor="#333333"
              thumbTintColor="#FFC107"
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
              minimumTrackTintColor="#FFC107"
              maximumTrackTintColor="#333333"
              thumbTintColor="#FFC107"
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
                trackColor={{ false: '#333333', true: '#FFC107' }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
            <Text style={[styles.sliderValue, !isRadiusEnabled && { color: '#666666' }]}>{radius} km</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={5}
            maximumValue={100}
            step={5}
            value={radius}
            onValueChange={setRadius}
            disabled={!isRadiusEnabled}
            minimumTrackTintColor={isRadiusEnabled ? "#FFC107" : "#333333"}
            maximumTrackTintColor="#333333"
            thumbTintColor={isRadiusEnabled ? "#FFC107" : "#666666"}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFC107" />
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333333'
  },
  backButton: {
    padding: 5,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFC107'
  },
  filterContainer: {
    backgroundColor: '#121212',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333'
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#FFFFFF'
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
    color: '#A0A0A0',
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
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333'
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
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
    color: '#FFFFFF'
  },
  businessName: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginLeft: 4,
    fontWeight: 'bold'
  },
  dotSeparator: {
    fontSize: 14,
    color: '#333333',
    marginHorizontal: 8,
  },
  distanceText: {
    fontSize: 13,
    color: '#A0A0A0',
    marginLeft: 2,
  },
  priceContainer: {
    paddingLeft: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#A0A0A0',
    fontSize: 16,
  },
  sliderContainer: { marginTop: 15 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sliderLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sliderLabel: { fontSize: 14, fontWeight: '600', color: '#A0A0A0' },
  sliderValue: { fontSize: 14, fontWeight: 'bold', color: '#FFC107' },
});
