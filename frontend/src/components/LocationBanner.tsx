import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/axios';

export default function LocationBanner({ mode = 'search' }: { mode?: 'search' | 'profile' | 'booking' }) {
  const router = useRouter();
  const { user, setHasAutoDetectedLocationSession, setPendingWorkerLocation, setSearchLocation, setBookingLocation, setIsLocationLoading } = useAuthStore();
  const [address, setAddress] = useState<string>('Detecting location...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsLocationLoading(loading);
  }, [loading]);

  useFocusEffect(
    React.useCallback(() => {
      fetchSavedLocation();
    }, [mode])
  );

  const fetchSavedLocation = async () => {
    setLoading(true);
    try {
      if (mode === 'search') {
        const currentAutoDetected = useAuthStore.getState().hasAutoDetectedLocationSession;
        const searchLoc = useAuthStore.getState().searchLocation;
        
        if (currentAutoDetected && searchLoc) {
          setAddress(searchLoc.address_text);
          setLoading(false);
          return;
        }
        
        if (!currentAutoDetected) {
          detectLocation();
          return;
        }
      } else if (mode === 'profile') {
        const pendingLocation = useAuthStore.getState().pendingWorkerLocation;
        if (pendingLocation) {
          setAddress(pendingLocation.address_text);
          setLoading(false);
          return;
        }
      } else if (mode === 'booking') {
        const bookingLoc = useAuthStore.getState().bookingLocation;
        if (bookingLoc) {
          setAddress(bookingLoc.address_text);
          setLoading(false);
          return;
        } else {
          // Fall back to search location if booking location not explicitly set yet
          const searchLoc = useAuthStore.getState().searchLocation;
          if (searchLoc) {
            setAddress(searchLoc.address_text);
            setBookingLocation(searchLoc);
            setLoading(false);
            return;
          }
        }
      }
      
      const endpoint = mode === 'profile' ? 'users/worker-profile/' : 'users/customer-profile/';
      const res = await api.get(endpoint);
      
      if (res.data.address_text) {
        setAddress(res.data.address_text);
        if (mode === 'search') {
          setSearchLocation({
            latitude: parseFloat(res.data.latitude),
            longitude: parseFloat(res.data.longitude),
            address_text: res.data.address_text
          });
        } else if (mode === 'booking') {
          setBookingLocation({
            latitude: parseFloat(res.data.latitude),
            longitude: parseFloat(res.data.longitude),
            address_text: res.data.address_text
          });
        }
        setLoading(false);
      } else {
        if (mode === 'search' || mode === 'booking') {
          detectLocation();
        } else {
          setAddress('Location not set');
          setLoading(false);
        }
      }
    } catch (e) {
      // If fetching fails or profile doesn't exist yet, fallback to detect
      detectLocation();
    }
  };

  const detectLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission denied');
        setLoading(false);
        if (mode === 'search') setHasAutoDetectedLocationSession(true);
        return;
      }

      let location;
      try {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      } catch (e) {
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location) {
        setAddress('Location unavailable');
        setLoading(false);
        if (mode === 'search' || mode === 'booking') setHasAutoDetectedLocationSession(true);
        return;
      }

      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const formattedAddress = `${place.city || place.subregion || place.name}, ${place.region || place.country}`;
        setAddress(formattedAddress);
        
        // Auto-save to the correct endpoint based on mode
        try {
          if (mode === 'profile') {
            setPendingWorkerLocation({
              latitude: Number(location.coords.latitude.toFixed(6)),
              longitude: Number(location.coords.longitude.toFixed(6)),
              address_text: formattedAddress
            });
          } else if (mode === 'booking') {
            setBookingLocation({
              latitude: Number(location.coords.latitude.toFixed(6)),
              longitude: Number(location.coords.longitude.toFixed(6)),
              address_text: formattedAddress
            });
          } else {
            await api.put('users/customer-profile/', {
              latitude: Number(location.coords.latitude.toFixed(6)),
              longitude: Number(location.coords.longitude.toFixed(6)),
              address_text: formattedAddress
            });
            setSearchLocation({
              latitude: Number(location.coords.latitude.toFixed(6)),
              longitude: Number(location.coords.longitude.toFixed(6)),
              address_text: formattedAddress
            });
            setHasAutoDetectedLocationSession(true);
          }
        } catch (e: any) {
          console.error("Failed to auto-save location", e.response?.data || e.message);
        }
      } else {
        setAddress('Location not found');
      }
    } catch (error) {
      console.error(error);
      setAddress('Error detecting location');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    (router.push as any)(`/LocationSetUp/${user?.id || 0}?mode=${mode}`);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.mainPressable} onPress={handlePress}>
        <Ionicons name="location-sharp" size={24} color="#007aff" />
        <View style={styles.textContainer}>
          <Text style={styles.label}>Current Location</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007aff" style={{ alignSelf: 'flex-start' }} />
          ) : (
            <Text style={styles.address} numberOfLines={1}>{address}</Text>
          )}
        </View>
      </Pressable>
      
      <Pressable style={styles.detectBtn} onPress={detectLocation}>
        <Ionicons name="locate" size={24} color="#007aff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingLeft: 20,
    paddingRight: 10,
  },
  detectBtn: {
    padding: 15,
    paddingLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  }
});
