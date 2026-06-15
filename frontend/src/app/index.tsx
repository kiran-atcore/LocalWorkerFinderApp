import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'expo-router';
import api from '../services/axios';

export default function RootIndex() {
  const router = useRouter();
  const { isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const response = await api.get('users/session/');
        if (response.data.isAuthenticated && isMounted) {
          setAuth(response.data.user);
        } else if (isMounted) {
          clearAuth();
        }
      } catch (error) {
        if (isMounted) {
           clearAuth();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Once loading is finished, navigate depending on auth state
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to main tabs when authenticated
        router.replace('/(tabs)/home' as any);
      } else {
        // Redirect to login when not authenticated
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <Text style={styles.appName}>Local Worker Finder</Text>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  // Render nothing as we're immediately redirecting
  return null;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#007AFF',
  }
});