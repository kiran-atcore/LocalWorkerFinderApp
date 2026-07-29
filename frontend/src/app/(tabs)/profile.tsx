import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import api, { getImageUrl } from '../../services/axios';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, activeRole, setActiveRole, clearAuth, setAuth } = useAuthStore();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.has_worker_profile) {
        api.get('users/worker-profile/')
          .then(res => {
            const newStatus = res.data?.verification_status;
            const newCount = res.data?.rejection_count;
            if ((newStatus && newStatus !== user.worker_profile_status) || (newCount !== undefined && newCount !== user.worker_profile_rejection_count)) {
              setAuth({
                ...user,
                worker_profile_status: newStatus || user.worker_profile_status,
                worker_profile_rejection_count: newCount !== undefined ? newCount : user.worker_profile_rejection_count
              });
            }
          })
          .catch(e => console.error("Error fetching worker profile status:", e));
      }
    }, [user])
  );

  const handleLogout = async () => {
    try {
      await api.post('users/logout/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAuth();
      router.replace('/(auth)/login');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete('users/delete-account/');
              clearAuth();
              router.replace('/(auth)/login');
            } catch (error: any) {
              console.error('Delete account failed:', error?.response?.data?.details || error.message);
              Alert.alert('Error', 'Failed to delete account.');
            }
          }
        }
      ]
    );
  };

  const handleRoleSwitch = async () => {
    if (activeRole === 'customer') {
      // Trying to switch to worker
      if (!user?.has_worker_profile) {
        // Doesn't exist, route to creation
        (router.push as any)(`/WorkerProfileEdit/${user?.id || 0}`);
        return;
      }
      
      // We need verification status from user object. If not present, we assume it's pending if has_worker_profile is true but verification_status isn't exposed (or handle it properly). 
      // Wait, let's fetch profile first to check status if not in user object, OR update user auth store.
      // Actually, if they try to switch and it fails, the backend will return 400.
      setIsSwitching(true);
      try {
        const res = await api.post('users/switch-role/', { role: 'worker' });
        setActiveRole('worker');
      } catch (error: any) {
        if (error.response?.data?.error) {
          Alert.alert('Notice', error.response.data.error);
        } else {
          Alert.alert('Error', 'Failed to switch role.');
        }
      } finally {
        setIsSwitching(false);
      }
    } else {
      // Switching to customer
      setIsSwitching(true);
      try {
        await api.post('users/switch-role/', { role: 'customer' });
        setActiveRole('customer');
      } catch (error) {
        Alert.alert('Error', 'Failed to switch role.');
      } finally {
        setIsSwitching(false);
      }
    }
  };

  const getSwitchButtonText = () => {
    if (activeRole === 'worker') return 'Switch to Customer Mode';
    if (!user?.has_worker_profile) return 'Request as Worker';
    if (user?.worker_profile_status === 'pending') return 'Approval pending';
    if (user?.worker_profile_status === 'rejected') return 'Request Rejected';
    return 'Switch to Worker Mode';
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View style={styles.header}>
          {user?.profile_photo ? (
            <Image source={{ uri: getImageUrl(user.profile_photo) as string }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.name}>{user?.first_name || user?.username || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.roleBadge}>{activeRole === 'worker' ? 'Worker Profile' : 'Customer Profile'}</Text>
        </View>

        <View style={styles.section}>
          {user?.worker_profile_status === 'permanently_rejected' || user?.is_permanently_banned_from_worker ? (
            <View>
              <Text style={{ color: '#FF6B6B', textAlign: 'center', marginTop: 10, fontWeight: 'bold', fontSize: 16 }}>
                Permanently banned from worker mode
              </Text>
            </View>
          ) : user?.worker_profile_status === 'rejected' ? (
            <View>
              <Pressable
                style={styles.switchButton}
                onPress={() => (router.push as any)(`/WorkerProfileEdit/${user?.id || 0}`)}
              >
                <Text style={styles.switchButtonText}>Re-submit Request</Text>
              </Pressable>
              <Text style={{ color: '#FF6B6B', textAlign: 'center', marginTop: 10, fontWeight: 'bold' }}>
                Approval rejected
              </Text>
              {user?.worker_profile_rejection_count !== undefined && (
                <Text style={{ color: '#A0A0A0', textAlign: 'center', marginTop: 5, fontSize: 12 }}>
                  Remaining attempts: {3 - user.worker_profile_rejection_count}
                </Text>
              )}
            </View>
          ) : (
            <Pressable
              style={[styles.switchButton, (isSwitching || user?.worker_profile_status === 'pending') && styles.disabledButton]}
              onPress={handleRoleSwitch}
              disabled={isSwitching || user?.worker_profile_status === 'pending'}
            >
              {isSwitching ? <ActivityIndicator color="#121212" /> :
                <Text style={styles.switchButtonText}>
                  {getSwitchButtonText()}
                </Text>
              }
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.menuItem}
            onPress={() => (router.push as any)(activeRole === 'worker' ? `/WorkerProfileEdit/${user?.id || 0}` : `/CustomerProfileEdit/${user?.id || 0}`)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="create-outline" size={20} color="#FFC107" style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
          </Pressable>
          {activeRole === 'worker' && (
            <>
              <Pressable style={styles.menuItem} onPress={() => (router.push as any)(`/WorkerProfileView/${user?.id || 0}`)}>
                <View style={styles.menuLeft}>
                  <Ionicons name="eye-outline" size={20} color="#FFC107" style={styles.menuIcon} />
                  <Text style={styles.menuText}>View Public Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => (router.push as any)(`/JobRoles/${user?.id || 0}`)}>
                <View style={styles.menuLeft}>
                  <Ionicons name="briefcase-outline" size={20} color="#FFC107" style={styles.menuIcon} />
                  <Text style={styles.menuText}>Manage Job Roles</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </Pressable>
            </>
          )}
        </View>

        <View style={[styles.section, { marginTop: 'auto' }]}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#1E1E1E', borderBottomWidth: 1, borderColor: '#333333' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333333', marginBottom: 15 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFC107' },
  email: { fontSize: 16, color: '#A0A0A0', marginTop: 5 },
  roleBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#FFC107', color: '#121212', borderRadius: 12, overflow: 'hidden', fontWeight: 'bold' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  switchButton: { backgroundColor: '#FFC107', padding: 18, borderRadius: 30, alignItems: 'center', shadowColor: '#FFC107', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  switchButtonText: { color: '#121212', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { opacity: 0.7 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#1E1E1E', borderRadius: 30, marginBottom: 12, borderWidth: 1, borderColor: '#333333' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 12 },
  menuText: { fontSize: 16, color: '#FFFFFF', fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', padding: 16, backgroundColor: '#1E1E1E', borderRadius: 30, marginBottom: 12, borderWidth: 1, borderColor: '#333333', alignItems: 'center' },
  logoutText: { fontSize: 16, color: '#FFFFFF', fontWeight: 'bold' },
  deleteButton: { flexDirection: 'row', justifyContent: 'center', padding: 16, backgroundColor: '#2A1010', borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B' },
  deleteText: { fontSize: 16, color: '#FF6B6B', fontWeight: 'bold' },
});