import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api, { getImageUrl } from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [bannedWorkers, setBannedWorkers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'banned'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        return;
      }
      
      if (user.is_staff) {
        if (activeTab === 'pending') {
          fetchPendingRequests();
        } else {
          fetchBannedWorkers();
        }
      } else {
        Alert.alert('Unauthorized', 'You are not authorized to view this page.');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(auth)/login' as any);
        }
      }
    }, [user, activeTab])
  );

  const handleLogout = async () => {
    try {
      await api.post('users/logout/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuth();
      router.replace('/(auth)/login' as any);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('users/admin/pending-workers/');
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      Alert.alert('Error', 'Failed to fetch pending worker requests.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBannedWorkers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('users/admin/banned-workers/');
      setBannedWorkers(response.data);
    } catch (error) {
      console.error('Error fetching banned workers:', error);
      Alert.alert('Error', 'Failed to fetch banned workers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async (email: string) => {
    try {
      setIsLoading(true);
      await api.post('users/admin/unban-worker/', { email });
      Alert.alert('Success', `${email} has been unbanned.`);
      fetchBannedWorkers();
    } catch (error) {
      console.error('Error unbanning worker:', error);
      Alert.alert('Error', 'Failed to unban worker.');
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={() => router.push(`/WorkerProfileView/${item.user.id}?isAdmin=true` as any)}
    >
      <View style={styles.cardLeft}>
        {item.profile_photo ? (
          <Image source={{ uri: getImageUrl(item.profile_photo) as string }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#FFC107" />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.first_name} {item.user.last_name}</Text>
          <Text style={styles.businessName}>{item.business_name || 'No Business Name'}</Text>
          <View style={styles.emailContainer}>
            <Ionicons name="mail-outline" size={14} color="#A0A0A0" style={{ marginRight: 4 }} />
            <Text style={styles.email} numberOfLines={1}>{item.user.email}</Text>
          </View>
          {item.rejection_count > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="warning-outline" size={12} color="#FF6B6B" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: '#FF6B6B' }}>
                Previous Rejections: {item.rejection_count}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <Ionicons name="chevron-forward" size={20} color="#FFC107" />
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={28} color="#FFC107" style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.headerTitle}>Admin Control</Text>
              <Text style={styles.headerSubtitle}>System Overview</Text>
            </View>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 6 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending Requests</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'banned' && styles.activeTab]}
            onPress={() => setActiveTab('banned')}
          >
            <Text style={[styles.tabText, activeTab === 'banned' && styles.activeTabText]}>Banned Workers</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {activeTab === 'pending' ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Verification Queue</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{pendingRequests.length}</Text>
                </View>
              </View>
              
              {pendingRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="shield-checkmark-outline" size={80} color="#333333" />
                  <Text style={styles.emptyTitle}>All Caught Up!</Text>
                  <Text style={styles.emptyText}>There are no pending worker verification requests at this time.</Text>
                </View>
              ) : (
                <FlatList
                  data={pendingRequests}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Banned Workers</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{bannedWorkers.length}</Text>
                </View>
              </View>
              
              {bannedWorkers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="shield-checkmark-outline" size={80} color="#333333" />
                  <Text style={styles.emptyTitle}>No Banned Workers</Text>
                  <Text style={styles.emptyText}>There are no permanently banned workers at this time.</Text>
                </View>
              ) : (
                <FlatList
                  data={bannedWorkers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.card}>
                      <View style={styles.cardLeft}>
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person-circle-outline" size={28} color="#FF6B6B" />
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
                          <View style={styles.emailContainer}>
                            <Ionicons name="mail-outline" size={14} color="#A0A0A0" style={{ marginRight: 4 }} />
                            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                          </View>
                        </View>
                      </View>
                      <Pressable 
                        style={styles.unbanButton}
                        onPress={() => {
                          Alert.alert('Confirm Unban', `Are you sure you want to unban ${item.email}? They will get their 3 attempts back.`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Unban', onPress: () => handleUnban(item.email) }
                          ])
                        }}
                      >
                        <Text style={styles.unbanButtonText}>Unban</Text>
                      </Pressable>
                    </View>
                  )}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFC107',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  logoutText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '900',
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#333333',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  businessName: {
    fontSize: 14,
    color: '#FFC107',
    fontWeight: '600',
    marginBottom: 6,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  email: {
    fontSize: 13,
    color: '#A0A0A0',
    flex: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
  },
  activeTab: {
    borderBottomColor: '#FFC107',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888888',
  },
  activeTabText: {
    color: '#FFC107',
  },
  unbanButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  unbanButtonText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
