import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Platform, TextInput, Switch } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import * as Location from 'expo-location';
import api from '../../services/axios';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RadarMapPage() {
  const { id } = useLocalSearchParams(); // 'workers' or 'jobs'
  const router = useRouter();
  const { searchLocation } = useAuthStore();
  const webviewRef = useRef<WebView>(null);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<{lat: number, lng: number} | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState('');
  const [radius, setRadius] = useState(50);
  const [isRadiusEnabled, setIsRadiusEnabled] = useState(false);
  const [maxRate, setMaxRate] = useState<number | null>(null);
  const [minRate, setMinRate] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [minExp, setMinExp] = useState<number | null>(null);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Debounced NLP Parse
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery) {
        try {
          const res = await api.get(`core/parse-query/?q=${encodeURIComponent(searchQuery)}`);
          if (res.data) {
            setParsedQuery(res.data.search_text || '');
            if (res.data.radius) {
              setRadius(res.data.radius);
              setIsRadiusEnabled(true);
            } else {
              setIsRadiusEnabled(false);
            }
            setMaxRate(res.data.max_rate || null);
            setMinRate(res.data.min_rate || null);
            setMinRating(res.data.min_rating || null);
            setMinExp(res.data.min_experience || null);
          }
        } catch (e) {
          console.error('NLP Parse error', e);
          setParsedQuery(searchQuery);
        }
      } else {
        setParsedQuery('');
        setRadius(50);
        setIsRadiusEnabled(false);
        setMaxRate(null);
        setMinRate(null);
        setMinRating(null);
        setMinExp(null);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    (async () => {
      let centerLat = 0;
      let centerLon = 0;

      if (searchLocation) {
        centerLat = searchLocation.latitude;
        centerLon = searchLocation.longitude;
      } else {
        // Fallback to current location if not set
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Allow location access to use the Radar Map.');
          router.back();
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        centerLat = location.coords.latitude;
        centerLon = location.coords.longitude;
      }

      setCenter({ lat: centerLat, lng: centerLon });

      // Fetch items
      try {
        if (id === 'workers') {
          const res = await api.get('users/featured-workers/');
          setItems(res.data);
        } else if (id === 'jobs') {
          const res = await api.get('bookings/vacancies/');
          setItems(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch map data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, searchLocation]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!center) return;
    const filtered = items.filter(item => {
      // 1. Search Query
      const query = parsedQuery.toLowerCase();
      if (query) {
        if (id === 'workers') {
          const name = (item.business_name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || item.user?.username || '').toLowerCase();
          const skills = (item.categories || []).join(' ').toLowerCase();
          if (!name.includes(query) && !skills.includes(query)) return false;
        } else {
          const title = (item.title || '').toLowerCase();
          const cat = (item.category || '').toLowerCase();
          if (!title.includes(query) && !cat.includes(query)) return false;
        }
      }

      // 2. Radius
      if (isRadiusEnabled && item.latitude && item.longitude) {
        const dist = getDistance(center.lat, center.lng, parseFloat(item.latitude), parseFloat(item.longitude));
        if (dist > radius) return false;
      }

      // 3. Rate
      if (id === 'jobs') {
        const rate = parseFloat(item.remuneration) || 0;
        if (maxRate !== null && rate > maxRate) return false;
        if (minRate !== null && rate < minRate) return false;
      }
      
      // 4. Rating
      if (id === 'workers' && minRating !== null) {
        const rating = parseFloat(item.rating) || 0;
        if (rating < minRating) return false;
      }
      
      // 5. Experience
      if (id === 'jobs' && minExp !== null) {
        const exp = parseFloat(item.experience_required) || 0;
        if (exp < minExp) return false;
      }
      
      return true;
    });
    setFilteredItems(filtered);
  }, [items, parsedQuery, radius, isRadiusEnabled, center, maxRate, minRate, minRating, minExp]);

  const generateMarkersScript = (itemsToRender: any[]) => {
    return itemsToRender.filter(i => i.latitude && i.longitude).map((item) => {
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);
      
      let title = '';
      let subtitleHtml = '';
      let imageUrl = '';
      let defaultEmoji = '';
      let targetId = item.id;
      let isApplied = false;

      if (id === 'workers') {
        const firstName = item.user?.first_name || '';
        const lastName = item.user?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        title = item.business_name || fullName || item.user?.username || 'Worker';
        
        const categories = item.categories || [];
        if (categories.length > 0) {
          const top2 = categories.slice(0, 2);
          const capsules = top2.map((c: string) => `<span class="capsule">${c.replace(/'/g, "\\'")}</span>`).join('');
          const more = categories.length > 2 ? `<span class="capsule-more">...</span>` : '';
          subtitleHtml = `<div class="capsule-container">${capsules}${more}</div>`;
        }
        
        targetId = item.user?.id || item.id;
        imageUrl = item.profile_photo ? (item.profile_photo.startsWith('http') ? item.profile_photo : `http://10.0.2.2:8000${item.profile_photo}`) : '';
        defaultEmoji = '👷';
      } else {
        title = item.title;
        subtitleHtml = `<div class="capsule-container"><span class="capsule-job">$${item.remuneration}</span></div>`;
        
        let rawImageUrl = item.customer_details?.profile_photo || '';
        imageUrl = rawImageUrl ? (rawImageUrl.startsWith('http') ? rawImageUrl : `http://10.0.2.2:8000${rawImageUrl}`) : '';
        defaultEmoji = '💼';
        targetId = item.id;
        isApplied = item.has_applied === true;
      }

      if (isApplied) {
        subtitleHtml += `<div style="text-align:center;"><div class="applied-badge">✓ Applied</div></div>`;
      }

      const pinContent = imageUrl 
        ? `<img src="${imageUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
        : `<div class="pin">${defaultEmoji}</div>`;
        
      const pinClass = isApplied ? "pin-container pin-applied" : "pin-container";

      return `
        var popupContent_${item.id} = '<div class="popup-container"><b>${title.replace(/'/g, "\\'")}</b>${subtitleHtml}<button class="btn" onclick="postMessageToRN(${targetId})">View Details</button></div>';
        
        var icon_${item.id} = L.divIcon({
          html: '<div class="${pinClass}">${pinContent}</div>',
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        var m_${item.id} = L.marker([${lat}, ${lng}], { icon: icon_${item.id} }).bindPopup(popupContent_${item.id});
        m_${item.id}.addTo(map);
        window.markers.push(m_${item.id});
      `;
    }).join('\n');
  };

  useEffect(() => {
    if (mapLoaded && webviewRef.current) {
      const js = `
        if (window.markers) {
          window.markers.forEach(function(m) { map.removeLayer(m); });
        }
        window.markers = [];
        ${generateMarkersScript(filteredItems)}
        true;
      `;
      webviewRef.current.injectJavaScript(js);
    }
  }, [filteredItems, mapLoaded]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'item_click') {
        if (id === 'jobs') {
          router.push(`/JobVacancyView/${data.itemId}`);
        } else if (id === 'workers') {
          router.push(`/WorkerProfileView/${data.itemId}`);
        }
      }
    } catch (e) {
      console.log('Error parsing WebView message', e);
    }
  };

  // Base Map HTML without markers
  const mapHtml = useMemo(() => {
    if (!center) return '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          #map { width: 100vw; height: 100vh; }
          .custom-marker { text-align: center; }
          .pin-container { width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); background: #007AFF; display: flex; align-items: center; justify-content: center; }
          .pin-applied { border: 3px solid #2ecc71; box-shadow: 0 0 10px rgba(46,204,113,0.8); background: #2ecc71; }
          .pin { color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; }
          .user-pin { background: #e74c3c; color: white; border-radius: 50%; width: 24px; height: 24px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
          .popup-container { text-align: center; padding: 5px; }
          .btn { background: #007AFF; color: white; border: none; padding: 8px 12px; border-radius: 6px; margin-top: 8px; font-weight: bold; cursor: pointer; width: 100%; }
          .capsule-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin-top: 6px; margin-bottom: 2px; }
          .capsule { background-color: #E6F4FE; color: #007AFF; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; }
          .capsule-more { color: #888; font-size: 12px; font-weight: bold; align-self: center; padding: 0 2px; }
          .capsule-job { background-color: #E8F5E9; color: #2E7D32; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          .applied-badge { background-color: #2ecc71; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 5px; display: inline-block; }
        </style>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          window.markers = [];
          // Send message to React Native
          function postMessageToRN(itemId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'item_click', itemId: itemId }));
          }

          // Initialize Map
          var map = L.map('map', {zoomControl: false}).setView([${center.lat}, ${center.lng}], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          // Add User Location Marker
          var userIcon = L.divIcon({
            html: '<div class="user-pin"></div>',
            className: 'custom-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          L.marker([${center.lat}, ${center.lng}], { icon: userIcon, zIndexOffset: 1000 }).addTo(map).bindPopup('<b>You are here</b>');
        </script>
      </body>
      </html>
    `;
  }, [center]);

  if (loading || !center) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Scanning area...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Radar: {id === 'workers' ? 'Workers Nearby' : 'Jobs Nearby'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={{marginRight: 8}} />
          <TextInput
            style={styles.searchInput}
            placeholder={id === 'workers' ? "Search skills or workers..." : "Search jobs..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderLabelContainer}>
              <Text style={styles.sliderLabel}>Search Radius</Text>
              <Switch
                value={isRadiusEnabled}
                onValueChange={setIsRadiusEnabled}
                trackColor={{ false: '#ddd', true: '#007aff' }}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
            <Text style={[styles.sliderValue, !isRadiusEnabled && { color: '#aaa' }]}>{radius} km</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={5}
            maximumValue={100}
            step={5}
            value={radius}
            onValueChange={setRadius}
            disabled={!isRadiusEnabled}
            minimumTrackTintColor={isRadiusEnabled ? "#007aff" : "#ddd"}
            maximumTrackTintColor="#ddd"
            thumbTintColor={isRadiusEnabled ? "#007aff" : "#bbb"}
          />
        </View>
      </View>

      <WebView
        ref={webviewRef}
        style={styles.map}
        source={{ html: mapHtml }}
        onLoadEnd={() => setMapLoaded(true)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        bounces={false}
        scrollEnabled={false}
      />
      
      <View style={styles.radarOverlay}>
        <Text style={styles.radarText}>
          Found {filteredItems.length} {id === 'workers' ? 'Workers' : 'Jobs'} in this area
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  sliderContainer: {
    width: '100%',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -5,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  sliderValue: {
    fontWeight: 'bold',
    color: '#007aff',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  radarOverlay: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  radarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});