import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';

export default function BlockedList() {
  const { activeRole } = useAuthStore();
  const router = useRouter();

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/core/blocks/?role=${activeRole}`);
      setBlockedUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch blocked users', err);
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleUnblock = async (blockedId: number, name: string) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unblock", 
          style: "default",
          onPress: async () => {
            try {
              await api.post('/core/blocks/unblock/', { blocked_id: blockedId, role: activeRole });
              fetchBlockedUsers();
              Alert.alert("Success", "User unblocked successfully.");
            } catch (err) {
              console.error('Failed to unblock user', err);
              Alert.alert('Error', 'Could not unblock user.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const user = item.blocked;
    if (!user) return null;

    const name = user.display_name || user.username || 'Unknown User';

    return (
      <View style={styles.itemContainer}>
        <View style={styles.userInfo}>
          {user.profile_photo ? (
            <Image source={{ uri: user.profile_photo }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.userName}>{name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.unblockButton} 
          onPress={() => handleUnblock(user.id, name)}
        >
          <Text style={styles.unblockText}>Unblock</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.roleText}>
        Showing users you blocked as <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{activeRole}</Text>
      </Text>

      {blockedUsers.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#ccc" style={{ marginBottom: 10 }} />
          <Text style={styles.emptyText}>You haven't blocked anyone.</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBlockedUsers} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  roleText: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: '#A0A0A0',
    fontSize: 14,
    backgroundColor: '#121212',
  },
  listContent: {
    padding: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333'
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarImage: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFC107' },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unblockButton: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F44336'
  },
  unblockText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#A0A0A0',
  },
});