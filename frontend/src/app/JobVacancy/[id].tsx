import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function JobVacancyDetail() {
  const router = useRouter();
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const res = await api.get('bookings/vacancies/my_vacancies/');
      setVacancies(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch your posted jobs.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVacancies();
    }, [])
  );

  const renderVacancy = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/JobVacancyView/${item.id}`)}
    >
      <View style={styles.cardTitleRow}>
        <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.status, item.is_active ? styles.statusActive : styles.statusClosed]}>
          {item.is_active ? 'Active' : 'Closed'}
        </Text>
      </View>
      <View style={styles.cardHeader}>
        <View style={styles.skillsContainer}>
          {item.skills_required?.slice(0, 3).map((skill: string, index: number) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{skill}</Text>
            </View>
          ))}
          {(item.skills_required?.length || 0) > 3 && (
            <View style={styles.skillChipMore}>
              <Text style={styles.skillChipTextMore}>...</Text>
            </View>
          )}
          {(!item.skills_required || item.skills_required.length === 0) && (
            <Text style={styles.noSkillsText}>General</Text>
          )}
        </View>
      </View>
      <View style={styles.descriptionBox}>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.remuneration}>${item.remuneration}</Text>
        <View style={styles.applicationsBadge}>
          <Ionicons name="people" size={14} color="#FFC107" style={{ marginRight: 4 }} />
          <Text style={styles.applicationsCount}>
            {item.applications_count} Applicant{item.applications_count !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </TouchableOpacity>
        <Text style={styles.title}>My Posted Jobs</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFC107" />
        </View>
      ) : (
        <FlatList
          data={vacancies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVacancy}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't posted any jobs yet.</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchVacancies}
        />
      )}

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.postButton}
          onPress={() => router.push('/JobVacancyForm/new')}
        >
          <Text style={styles.postButtonText}>+ Post New Job</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#333333' },
  backButton: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#FFC107' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  listContainer: { padding: 15, paddingBottom: 100 },
  card: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333333', borderLeftWidth: 4, borderLeftColor: '#FFC107' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10, color: '#FFFFFF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 10, fontWeight: 'bold', overflow: 'hidden', borderWidth: 1 },
  statusActive: { backgroundColor: '#1E1E1E', color: '#4CAF50', borderColor: '#4CAF50' },
  statusClosed: { backgroundColor: '#1E1E1E', color: '#C62828', borderColor: '#C62828' },
  descriptionBox: { backgroundColor: '#121212', padding: 10, borderRadius: 8, marginBottom: 15 },
  description: { fontSize: 14, color: '#A0A0A0', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remuneration: { fontSize: 18, fontWeight: '900', color: '#FFC107' },
  applicationsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  applicationsCount: { fontSize: 12, color: '#FFC107', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: { color: '#A0A0A0', fontSize: 16 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, marginRight: 10 },
  skillChip: { backgroundColor: '#333333', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  skillChipText: { color: '#FFC107', fontSize: 12, fontWeight: '600' },
  skillChipMore: { backgroundColor: '#333333', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  skillChipTextMore: { color: '#A0A0A0', fontSize: 12, fontWeight: '600' },
  noSkillsText: { color: '#A0A0A0', fontSize: 13, fontStyle: 'italic' },
  bottomContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  postButton: { backgroundColor: '#FFC107', padding: 16, borderRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  postButtonText: { color: '#121212', fontSize: 16, fontWeight: 'bold' },
});