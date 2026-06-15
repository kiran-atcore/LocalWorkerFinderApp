import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';
import { CATEGORIES } from '../../constants/categories';

export default function JobRolesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      fetchJobRoles();
    }, [])
  );

  const fetchJobRoles = async () => {
    try {
      const res = await api.get('services/job-roles/');
      setJobRoles(res.data);
    } catch (error) {
      console.error('Failed to fetch job roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  const handleDelete = (roleId: string) => {
    Alert.alert('Delete Role', 'Are you sure you want to delete this job role?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`services/job-roles/${roleId}/`);
            fetchJobRoles(); // Refresh the list after deleting
          } catch (error) {
            Alert.alert('Error', 'Failed to delete role.');
          }
        }
      }
    ]);
  };

  const renderRole = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => (router.push as any)(`/JobRoleView/${item.id}`)}>
      <View style={styles.cardContent}>
        <Text style={styles.roleTitle}>{getCategoryName(item.category)}</Text>
        <Text style={styles.roleDetail}>${item.hourly_rate}/hr • {item.experience_years} yrs exp</Text>
      </View>
      <View style={styles.actionIcons}>
        <Pressable onPress={() => (router.push as any)(`/JobRoleForm/${item.id}`)} style={styles.iconButton}>
          <Ionicons name="pencil" size={20} color="#007aff" />
        </Pressable>
        <Pressable onPress={() => handleDelete(item.id)} style={styles.iconButton}>
          <Ionicons name="trash" size={20} color="#ff3b30" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>My Job Roles</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007aff" />
        </View>
      ) : (
        <FlatList
          data={jobRoles}
          keyExtractor={item => item.id.toString()}
          renderItem={renderRole}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't added any job roles yet. Add one to appear in customer searches!</Text>}
        />
      )}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
        <Pressable style={styles.addButton} onPress={() => (router.push as any)('/JobRoleForm/new')}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Job Role</Text>
        </Pressable>
      </View>
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
  backButton: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15, paddingBottom: 120 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardContent: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  roleDetail: { fontSize: 14, color: '#666' },
  actionIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginLeft: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16, lineHeight: 24, paddingHorizontal: 20 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  addButton: {
    backgroundColor: '#007aff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});
