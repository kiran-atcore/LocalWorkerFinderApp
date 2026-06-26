import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
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
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.remuneration}>${item.remuneration}</Text>
        <Text style={styles.applicationsCount}>
          {item.applications_count} Applicant{item.applications_count !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Posted Jobs</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 15, paddingBottom: 100 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10, color: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  statusActive: { backgroundColor: '#E3F2FD', color: '#1976D2' },
  statusClosed: { backgroundColor: '#F5F5F5', color: '#757575' },
  description: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remuneration: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  applicationsCount: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: { color: '#666', fontSize: 16 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, marginRight: 10 },
  skillChip: { backgroundColor: '#e1f5fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  skillChipText: { color: '#0288d1', fontSize: 12, fontWeight: '600' },
  skillChipMore: { backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  skillChipTextMore: { color: '#7f8c8d', fontSize: 12, fontWeight: '600' },
  noSkillsText: { color: '#95a5a6', fontSize: 13, fontStyle: 'italic' },
  bottomContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  postButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  postButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});