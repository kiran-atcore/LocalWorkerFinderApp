import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { useRouter } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';

export default function ProfileScreen() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const { replace } = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      replace('/(auth)/login' as any);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <View style={styles.infoCard}>
          <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.role}>{user.role}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      ) : null}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Pressable style={styles.menuTrigger}>
            <Text style={styles.menuTriggerText}>Account Options ⚙️</Text>
          </Pressable>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item key="logout" destructive onSelect={handleLogout}>
            <DropdownMenu.ItemTitle>Logout</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: '#f9f9f9' },
  infoCard: { padding: 20, backgroundColor: '#fff', borderRadius: 12, borderCurve: 'continuous', gap: 4 },
  name: { fontSize: 24, fontWeight: '700' },
  role: { color: '#007AFF', fontWeight: '600' },
  email: { color: '#666', marginTop: 8 },
  menuTrigger: { padding: 16, backgroundColor: '#e5e5e5', borderRadius: 8, alignItems: 'center' },
  menuTriggerText: { fontWeight: '600', fontSize: 16 }
});