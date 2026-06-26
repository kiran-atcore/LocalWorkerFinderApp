import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function LocationSetUp() {
  const router = useRouter();
  const { id, mode = 'search' } = useLocalSearchParams();
  const { user, activeRole, setAuth, setPendingWorkerLocation, setSearchLocation, setBookingLocation } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('Select location on map');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    initLocation();
  }, []);

  const initLocation = async () => {
    try {
      if (mode === 'profile') {
        const pendingLocation = useAuthStore.getState().pendingWorkerLocation;
        if (pendingLocation) {
          setCoords({ lat: pendingLocation.latitude, lng: pendingLocation.longitude });
          setAddress(pendingLocation.address_text);
          setLoading(false);
          return;
        }
      } else if (mode === 'booking') {
        const bookingLoc = useAuthStore.getState().bookingLocation;
        if (bookingLoc) {
          setCoords({ lat: bookingLoc.latitude, lng: bookingLoc.longitude });
          setAddress(bookingLoc.address_text);
          setLoading(false);
          return;
        } else {
          const searchLoc = useAuthStore.getState().searchLocation;
          if (searchLoc) {
             setCoords({ lat: searchLoc.latitude, lng: searchLoc.longitude });
             setAddress(searchLoc.address_text);
             setLoading(false);
             return;
          }
        }
      }

      // First try to get from backend's appropriate profile based on mode
      const endpoint = mode === 'profile' ? 'users/worker-profile/' : 'users/customer-profile/';
      const res = await api.get(endpoint);
      
      if (res.data.latitude && res.data.longitude) {
        setCoords({ lat: parseFloat(res.data.latitude), lng: parseFloat(res.data.longitude) });
        setAddress(res.data.address_text || 'Select location on map');
      } else {
        // Fallback to current device location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location;
          try {
             location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          } catch (e) {
             location = await Location.getLastKnownPositionAsync();
          }
          if (location) {
             setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
             reverseGeocode(location.coords.latitude, location.coords.longitude);
          } else {
             // Default to city center or something if denied or unavailable
             setCoords({ lat: 8.5241, lng: 76.9366 }); // Thiruvananthapuram
          }
        } else {
          // Default to city center or something if denied
          setCoords({ lat: 8.5241, lng: 76.9366 }); // Thiruvananthapuram
        }
      }
    } catch (e) {
      console.error(e);
      setCoords({ lat: 8.5241, lng: 76.9366 });
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      let reverse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reverse.length > 0) {
        const place = reverse[0];
        setAddress(`${place.name || place.street || ''}, ${place.city || place.subregion}, ${place.region || place.country}`);
      }
    } catch (e) {
      console.error("Reverse geocode failed", e);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.lat && data.lng) {
        setCoords({ lat: data.lat, lng: data.lng });
        reverseGeocode(data.lat, data.lng);
      }
    } catch (e) {
      console.error("Failed to parse map message", e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const geocoded = await Location.geocodeAsync(searchQuery);
      if (geocoded.length > 0) {
        const { latitude, longitude } = geocoded[0];
        setCoords({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        webviewRef.current?.injectJavaScript(`
          map.setView([${latitude}, ${longitude}], 14);
          marker.setLatLng([${latitude}, ${longitude}]);
          true;
        `);
      } else {
        Alert.alert('Not found', 'Could not find that location.');
      }
    } catch (e) {
      Alert.alert('Error', 'Search failed');
    }
  };

  const handleConfirm = async () => {
    if (!coords) return;
    setIsSaving(true);
    
    if (mode === 'profile') {
      setPendingWorkerLocation({
        latitude: Number(coords.lat.toFixed(6)),
        longitude: Number(coords.lng.toFixed(6)),
        address_text: address
      });
      Alert.alert('Location Locked', 'Location temporarily locked for this profile edit.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      setIsSaving(false);
      return;
    } else if (mode === 'booking') {
      setBookingLocation({
        latitude: Number(coords.lat.toFixed(6)),
        longitude: Number(coords.lng.toFixed(6)),
        address_text: address
      });
      router.back();
      setIsSaving(false);
      return;
    }

    const endpoint = 'users/customer-profile/';
    try {
      await api.put(endpoint, {
        latitude: Number(coords.lat.toFixed(6)),
        longitude: Number(coords.lng.toFixed(6)),
        address_text: address
      });
      
      setSearchLocation({
        latitude: Number(coords.lat.toFixed(6)),
        longitude: Number(coords.lng.toFixed(6)),
        address_text: address
      });
      
      Alert.alert('Success', 'Location updated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      Alert.alert('Error', 'Failed to save location');
    } finally {
      setIsSaving(false);
    }
  };

  const mapHtml = coords ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        #map { width: 100vw; height: 100vh; }
        .custom-marker { text-align: center; font-size: 30px; line-height: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
      </style>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {zoomControl: false}).setView([${coords.lat}, ${coords.lng}], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        var customIcon = L.divIcon({
          html: '📍',
          className: 'custom-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        var marker = L.marker([${coords.lat}, ${coords.lng}], {
          draggable: true,
          icon: customIcon
        }).addTo(map);
        
        marker.on('dragend', function(event) {
          var position = marker.getLatLng();
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat: position.lat, lng: position.lng }));
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
        });
      </script>
    </body>
    </html>
  ` : '';

  if (loading || !coords) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={{marginTop: 10, color: '#666'}}>Loading Map...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <View style={styles.searchBox}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search location..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <Pressable onPress={handleSearch} style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="#666" />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        <WebView 
          ref={webviewRef}
          source={{ html: mapHtml }}
          onMessage={handleMessage}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.addressOverlay}>
          <Ionicons name="location-sharp" size={20} color="#007aff" />
          <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
        </View>
      </View>
      
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable 
          style={[styles.confirmBtn, isSaving && { opacity: 0.7 }]} 
          onPress={handleConfirm}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Location</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { padding: 5, marginRight: 5 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
  searchBtn: { padding: 5 },
  mapContainer: { flex: 1, position: 'relative' },
  webview: { flex: 1, backgroundColor: '#f5f5f5' },
  addressOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressText: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '500', color: '#333' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  confirmBtn: { backgroundColor: '#007aff', padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
