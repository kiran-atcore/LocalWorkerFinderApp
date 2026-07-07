import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/axios';

export default function RootIndex() {
  const router = useRouter();
  const { isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

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
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <View style={styles.iconContainer}>
            <Image source={require('../../assets/images/icon.png')} style={{ width: 100, height: 100, borderRadius: 20 }} />
          </View>
          <Text style={styles.appName}>Vicinio</Text>
          <Text style={styles.subtitle}>Your local services, instantly.</Text>
        </Animated.View>
        <ActivityIndicator size="large" color="#FFC107" style={{ position: 'absolute', bottom: 60 }} />
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
    backgroundColor: '#121212',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFC107',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    letterSpacing: 1,
    fontWeight: '500',
  }
});