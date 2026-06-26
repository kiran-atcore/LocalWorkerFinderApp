import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import api, { getImageUrl } from '../../services/axios';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, activeRole, setActiveRole, clearAuth, setAuth } = useAuthStore();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

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
            } catch (error) {
              console.error('Delete account failed:', error);
              Alert.alert('Error', 'Failed to delete account.');
            }
          }
        }
      ]
    );
  };

  const handleRoleSwitch = async () => {
    const targetRole = activeRole === 'customer' ? 'worker' : 'customer';
    setIsSwitching(true);
    try {
      const res = await api.post('users/switch-role/', { role: targetRole });
      setActiveRole(targetRole);
      // Optional: update the user object if has_worker_profile was false
      if (user && !user.has_worker_profile && targetRole === 'worker') {
         setAuth({ ...user, has_worker_profile: true });
      }

      if (targetRole === 'worker' && res.data.is_first_time) {
         router.push(`/WorkerProfileEdit/${user?.id || 0}` as any);
      }
    } catch (error) {
      console.error('Role switch failed:', error);
      Alert.alert('Error', 'Failed to switch role.');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
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
          <Pressable 
            style={[styles.switchButton, isSwitching && styles.disabledButton]} 
            onPress={handleRoleSwitch}
            disabled={isSwitching}
          >
            {isSwitching ? <ActivityIndicator color="#fff" /> : 
             <Text style={styles.switchButtonText}>
               {activeRole === 'customer' ? 'Switch to Worker Mode' : 'Switch to Customer Mode'}
             </Text>
            }
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable 
            style={styles.menuItem} 
            onPress={() => (router.push as any)(activeRole === 'worker' ? `/WorkerProfileEdit/${user?.id || 0}` : `/CustomerProfileEdit/${user?.id || 0}`)}
          >
            <Text style={styles.menuText}>Edit Profile</Text>
          </Pressable>
          {activeRole === 'worker' && (
            <>
              <Pressable style={styles.menuItem} onPress={() => (router.push as any)(`/WorkerProfileView/${user?.id || 0}`)}>
                <Text style={styles.menuText}>View Public Profile</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => (router.push as any)(`/JobRoles/${user?.id || 0}`)}>
                <Text style={styles.menuText}>Manage Job Roles</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={[styles.section, { marginTop: 'auto' }]}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ccc', marginBottom: 15 },
  name: { fontSize: 24, fontWeight: 'bold' },
  email: { fontSize: 16, color: '#666', marginTop: 5 },
  roleBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#e1f5fe', color: '#0288d1', borderRadius: 12, overflow: 'hidden', fontWeight: 'bold' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  switchButton: { backgroundColor: '#34c759', padding: 15, borderRadius: 8, alignItems: 'center' },
  switchButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { opacity: 0.7 },
  menuItem: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  menuText: { fontSize: 16 },
  logoutButton: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  logoutText: { fontSize: 16, color: '#007aff', fontWeight: 'bold' },
  deleteButton: { padding: 15, backgroundColor: '#ffeeee', borderRadius: 8, alignItems: 'center' },
  deleteText: { fontSize: 16, color: '#ff3b30', fontWeight: 'bold' },
});