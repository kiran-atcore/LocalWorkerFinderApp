import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Switch, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import CategoryCard from '../../Components/CategoryCard';
import WorkerCard from '../../Components/WorkerCard';
import LocationBanner from '../../Components/LocationBanner';
import api from '../../services/axios';
import { CATEGORIES } from '../../constants/categories';

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

function CustomerHomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(50); // Default 50km
  const [isRadiusEnabled, setIsRadiusEnabled] = useState(true);
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, searchLocation, isLocationLoading } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;

      setIsLoading(true);

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

      fetchWorkers();
    }, [searchQuery, isAuthenticated])
  );

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

  const workersWithDistance = workers.map(w => {
    let distance = undefined;
    if (searchLocation && w.latitude && w.longitude) {
      distance = getDistance(searchLocation.latitude, searchLocation.longitude, parseFloat(w.latitude), parseFloat(w.longitude));
    }
    return { ...w, distance };
  });

  const filteredWorkers = workersWithDistance.filter(w => {
    if (!isRadiusEnabled) return true;
    if (w.distance === undefined) return false;
    return w.distance <= radius;
  });

  return (
    <ScrollView style={styles.container}>
      <LocationBanner />
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

      <View style={styles.postJobContainer}>
        <TouchableOpacity
          style={styles.postJobButton}
          onPress={() => router.push('/JobVacancy/list')}
        >
          <Text style={styles.postJobButtonText}>+ Post a Job Vacancy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featured}>
        <Text style={styles.sectionTitle}>Featured Workers</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search services or workers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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

        {isLoading || isLocationLoading || (!searchLocation && isRadiusEnabled) ? (
          <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />
        ) : filteredWorkers.length > 0 ? (
          filteredWorkers.map(worker => (
            <WorkerCard key={worker.id} worker={worker} distance={worker.distance} />
          ))
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>
              {isRadiusEnabled && searchQuery
                ? `No workers found matching "${searchQuery}" within ${radius}km.`
                : isRadiusEnabled
                  ? `No workers found within ${radius}km.`
                  : searchQuery
                    ? `No workers found matching "${searchQuery}".`
                    : "No featured workers found."}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function WorkerHomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(50);
  const [isRadiusEnabled, setIsRadiusEnabled] = useState(true);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('Latest');
  const { isAuthenticated, searchLocation, isLocationLoading } = useAuthStore();

  const SORT_OPTIONS = ['Latest', 'Oldest', 'Most applicants', 'Most Paid', 'Nearest'];

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;

      setIsLoading(true);

      const fetchVacanciesAndApplications = async () => {
        try {
          const [vacanciesRes, applicationsRes] = await Promise.all([
            api.get(`bookings/vacancies/?search=${searchQuery}`),
            api.get('bookings/applications/?role=worker')
          ]);
          setVacancies(vacanciesRes.data);
          setAppliedJobs(applicationsRes.data);
        } catch (error) {
          console.error('Failed to fetch data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      const delayDebounceFn = setTimeout(() => {
        fetchVacanciesAndApplications();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isAuthenticated])
  );

  const handleCancelApplication = (applicationId: number) => {
    Alert.alert(
      "Withdraw Application",
      "Are you sure you want to withdraw your application?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`bookings/applications/${applicationId}/?role=worker`);
              setAppliedJobs(prev => prev.filter(app => app.id !== applicationId));
              // Also refresh vacancies to move it back to the active list
              const res = await api.get(`bookings/vacancies/?search=${searchQuery}`);
              setVacancies(res.data);
            } catch (error) {
              console.error("Failed to withdraw application:", error);
              Alert.alert("Error", "Could not withdraw application. Please try again.");
            }
          }
        }
      ]
    );
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

  const vacanciesWithDistance = vacancies.map(v => {
    let distance = undefined;
    if (searchLocation && v.latitude && v.longitude) {
      distance = getDistance(searchLocation.latitude, searchLocation.longitude, parseFloat(v.latitude), parseFloat(v.longitude));
    }
    return { ...v, distance };
  });

  const filteredVacancies = vacanciesWithDistance.filter(v => {
    if (v.has_applied) return false;
    if (!isRadiusEnabled) return true;
    if (v.distance === undefined) return false;
    return v.distance <= radius;
  }).sort((a, b) => {
    if (sortBy === 'Latest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'Oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === 'Most applicants') {
      return (b.applications_count || 0) - (a.applications_count || 0);
    }
    if (sortBy === 'More remuneration') {
      return (parseFloat(b.remuneration) || 0) - (parseFloat(a.remuneration) || 0);
    }
    if (sortBy === 'Nearest') {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <ScrollView style={styles.container}>
      <LocationBanner />

      <View style={styles.appliedSection}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 15 }]}>Applied Jobs</Text>
        {appliedJobs.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.appliedScroll}
            snapToInterval={Dimensions.get('window').width - 15}
            decelerationRate="fast"
          >
            {appliedJobs.map(app => (
              <TouchableOpacity
                key={app.id}
                style={styles.appliedCard}
                onPress={() => router.push(`/JobVacancyView/${app.vacancy}`)}
              >
                <View style={styles.appliedCardHeader}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
                    <Text style={[styles.appliedJobTitle, { flexShrink: 1 }]} numberOfLines={1}>{app.vacancy_details?.title || 'Unknown Job'}</Text>
                    {app.vacancy_details?.is_active === false && (
                      <Text style={{ fontSize: 10, color: '#C62828', fontWeight: 'bold', backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>CLOSED</Text>
                    )}
                  </View>
                  <Text style={[styles.appliedStatusBadge, styles[`status${app.status}` as keyof typeof styles]]}>{app.status}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}>
                    {app.vacancy_details?.skills_required?.length > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                        {app.vacancy_details.skills_required.slice(0, 3).map((skill: string, index: number) => (
                          <View key={index} style={styles.appliedSkillBadge}>
                            <Text style={styles.appliedSkillText} numberOfLines={1}>{skill}</Text>
                          </View>
                        ))}
                        {app.vacancy_details.skills_required.length > 3 && (
                          <View style={styles.appliedSkillBadge}>
                            <Text style={styles.appliedSkillText}>...</Text>
                          </View>
                        )}
                      </View>
                    )}
                    <Text style={[styles.appliedJobRemuneration, { marginTop: 6 }]}>${app.vacancy_details?.remuneration}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleCancelApplication(app.id)} style={styles.appliedTrashBtn}>
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
            <Text style={{ color: '#888', fontStyle: 'italic' }}>You haven't applied to any jobs yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.featured}>
        <Text style={styles.sectionTitle}>Latest Jobs</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search job categories or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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

        <View style={styles.sortContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.sortChipOption, sortBy === option && styles.sortChipOptionActive]}
                onPress={() => setSortBy(option)}
              >
                <Text style={[styles.sortChipOptionText, sortBy === option && styles.sortChipOptionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading || isLocationLoading || (!searchLocation && isRadiusEnabled) ? (
          <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />
        ) : filteredVacancies.length > 0 ? (
          filteredVacancies.map(v => (
            <TouchableOpacity
              key={v.id}
              style={styles.workerCard}
              onPress={() => router.push(`/JobVacancyView/${v.id}`)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', marginRight: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', flexShrink: 1 }} numberOfLines={1}>{v.title}</Text>
                  {v.has_applied && (
                    <View style={styles.appliedBadge}>
                      <Text style={styles.appliedBadgeText}>Applied</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>${v.remuneration}</Text>
              </View>
              <View style={styles.skillsContainer}>
                {v.skills_required?.slice(0, 3).map((skill: string, index: number) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill}</Text>
                  </View>
                ))}
                {(v.skills_required?.length || 0) > 3 && (
                  <View style={styles.skillChipMore}>
                    <Text style={styles.skillChipTextMore}>...</Text>
                  </View>
                )}
                {(!v.skills_required || v.skills_required.length === 0) && (
                  <Text style={styles.noSkillsText}>General</Text>
                )}
              </View>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }} numberOfLines={2}>{v.description}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#888' }}>
                  {v.distance !== undefined ? `${v.distance.toFixed(1)} km away` : 'Location unknown'}
                </Text>
                {(() => {
                  const isEdited = v.updated_at && v.created_at && (new Date(v.updated_at).getTime() - new Date(v.created_at).getTime() > 60000);
                  return (
                    <Text style={{ fontSize: 12, color: '#aaa' }}>
                      {isEdited ? `Edited ${formatTimeAgo(v.updated_at)}` : `Posted ${formatTimeAgo(v.created_at)}`}
                    </Text>
                  );
                })()}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>
              {isRadiusEnabled && searchQuery
                ? `No jobs found matching "${searchQuery}" within ${radius}km.`
                : isRadiusEnabled
                  ? `No jobs found within ${radius}km.`
                  : searchQuery
                    ? `No jobs found matching "${searchQuery}".`
                    : "No jobs available at the moment."}
            </Text>
          </View>
        )}
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
  searchContainer: { marginBottom: 15 },
  searchInput: { padding: 15, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  sliderContainer: { marginBottom: 20, paddingHorizontal: 5 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sliderLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sliderLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  sliderValue: { fontSize: 14, fontWeight: 'bold', color: '#007aff' },
  categories: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  categoryScroll: { paddingVertical: 10, paddingHorizontal: 5 },
  postJobContainer: { paddingHorizontal: 15, paddingBottom: 10 },
  postJobButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  postJobButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  featured: { padding: 15 },
  workerCard: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  fallbackContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  fallbackImage: { width: 120, height: 120, resizeMode: 'contain', opacity: 0.5 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  skillChip: { backgroundColor: '#e1f5fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  skillChipText: { color: '#0288d1', fontSize: 12, fontWeight: '600' },
  skillChipMore: { backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  skillChipTextMore: { color: '#7f8c8d', fontSize: 12, fontWeight: '600' },
  noSkillsText: { color: '#95a5a6', fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  sortContainer: { marginBottom: 15 },
  sortScroll: { gap: 10, paddingHorizontal: 5 },
  sortChipOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#e0e0e0' },
  sortChipOptionActive: { backgroundColor: '#007aff', borderColor: '#007aff' },
  sortChipOptionText: { fontSize: 14, color: '#666', fontWeight: '600' },
  sortChipOptionTextActive: { color: '#fff' },
  appliedBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 8 },
  appliedBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold' },
  appliedSection: { paddingVertical: 15, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10 },
  appliedScroll: { paddingHorizontal: 15, gap: 15 },
  appliedCard: { width: Dimensions.get('window').width - 30, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  appliedCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  appliedJobTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  appliedStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 10, fontWeight: 'bold', overflow: 'hidden' },
  statusPENDING: { backgroundColor: '#FFF3E0', color: '#F57C00' },
  statusACCEPTED: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  statusREJECTED: { backgroundColor: '#FFEBEE', color: '#C62828' },
  appliedJobRemuneration: { fontSize: 15, fontWeight: '600', color: '#4CAF50', marginBottom: 4 },
  appliedJobCategory: { fontSize: 13, color: '#666' },
  appliedTrashBtn: { padding: 8, backgroundColor: '#FFEBEE', borderRadius: 20 },
  appliedSkillBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  appliedSkillText: { fontSize: 11, color: '#555', fontWeight: '500' },
});