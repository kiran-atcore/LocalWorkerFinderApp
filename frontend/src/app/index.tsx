import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function IndexScreen() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  
  if (isAuthenticated) {
    return <Redirect href={"/(tabs)/home" as any} />;
  }
  return <Redirect href={"/(auth)/login" as any} />;
}