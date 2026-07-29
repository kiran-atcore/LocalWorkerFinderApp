import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

import { CATEGORIES } from '../../constants/categories';

export default function BookingDetailsViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`bookings/${id}/`);
      setBooking(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch booking details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setIsProcessing(true);
    try {
      await api.post(`bookings/${id}/${action}/`);
      Alert.alert('Success', `Booking ${action}ed successfully.`);
      fetchBooking(); // refresh
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || `Failed to ${action} booking.`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.center}>
        <ActivityIndicator size="large" color="#FFC107" />
      </SafeAreaView>
    );
  }

  const isCustomer = currentUser?.id === booking.customer_details.user_id;
  const isWorker = currentUser?.id === booking.worker_details.user_id;

  const categoryId = booking?.job_role_details?.category;
  const categoryInfo = CATEGORIES.find(c => c.id === categoryId);
  const roleTitle = categoryInfo ? categoryInfo.name : (categoryId || 'Unknown Role');

  const renderButtons = () => {
    if (booking.status === 'PENDING') {
      if (isCustomer) {
        return (
          <Pressable style={[styles.actionBtn, styles.dangerBtn]} onPress={() => handleAction('cancel')} disabled={isProcessing}>
            <Text style={styles.btnText}>Cancel Booking</Text>
          </Pressable>
        );
      }
      if (isWorker) {
        return (
          <View style={styles.rowBtns}>
            <Pressable style={[styles.actionBtn, styles.dangerBtn, { flex: 1, marginRight: 10 }]} onPress={() => handleAction('reject')} disabled={isProcessing}>
              <Text style={styles.btnText}>Reject</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.successBtn, { flex: 1 }]} onPress={() => handleAction('accept')} disabled={isProcessing}>
              <Text style={styles.btnText}>Accept</Text>
            </Pressable>
          </View>
        );
      }
    }

    if (booking.status === 'ACCEPTED') {
      if (isCustomer) {
        return (
          <View style={styles.rowBtns}>
            <Pressable style={[styles.actionBtn, styles.dangerBtn, { flex: 1, marginRight: 10 }]} onPress={() => handleAction('cancel')} disabled={isProcessing}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.successBtn, { flex: 1 }]} onPress={() => handleAction('confirm')} disabled={isProcessing}>
              <Text style={styles.btnText}>Confirm Booking</Text>
            </Pressable>
          </View>
        );
      }
      if (isWorker) {
        return (
          <View style={[styles.actionBtn, styles.disabledBtn]}>
            <Text style={[styles.btnText, { color: '#666666' }]}>Waiting for customer to confirm</Text>
          </View>
        );
      }
    }

    if (booking.status === 'ACTIVE') {
      const hasCompleted = isCustomer ? booking.customer_completed : booking.worker_completed;
      if (hasCompleted) {
        return (
          <View style={[styles.actionBtn, styles.disabledBtn]}>
            <Text style={[styles.btnText, { color: '#666666' }]}>Waiting for other party to complete</Text>
          </View>
        );
      }
      return (
        <Pressable style={[styles.actionBtn, styles.successBtn]} onPress={() => handleAction('complete')} disabled={isProcessing}>
          <Text style={styles.btnText}>Mark as Completed</Text>
        </Pressable>
      );
    }

    return null;
  };

  const renderIcon = () => {
    if (!categoryInfo) return <Ionicons name="briefcase" size={24} color="#333" />;

    if (categoryInfo.iconFamily === 'MaterialIcons') {
      return <MaterialIcons name={categoryInfo.iconName as any} size={24} color={categoryInfo.color} />;
    } else if (categoryInfo.iconFamily === 'FontAwesome5') {
      return <FontAwesome5 name={categoryInfo.iconName as any} size={24} color={categoryInfo.color} />;
    }
    return <Ionicons name={categoryInfo.iconName as any} size={24} color={categoryInfo.color} />;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.title}>Booking #{booking.id}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 100) }]}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {booking.status === 'PENDING' && isWorker ? 'INCOMING' : booking.status}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Job Role</Text>
          <View style={styles.jobRoleCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconContainer, { backgroundColor: '#333333' }]}>
                {renderIcon()}
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.jobRoleTitle}>{roleTitle}</Text>
                {booking?.job_role_details?.hourly_rate && (
                  <Text style={styles.jobRoleRate}>${booking.job_role_details.hourly_rate} / hr</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {isCustomer && (
            <>
              <Text style={styles.sectionTitle}>Worker Details</Text>
              <Text style={styles.detailText}>{booking.worker_details.name}</Text>
              <View style={styles.divider} />
            </>
          )}

          {isWorker && (
            <>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <Text style={styles.detailText}>{booking.customer_details.name}</Text>
              <View style={styles.divider} />
            </>
          )}

          <Text style={styles.sectionTitle}>Problem Description</Text>
          <Text style={styles.descriptionText}>{booking.problem_description}</Text>

          {booking.negotiated_price && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Offered Price</Text>
              <Text style={styles.detailText}>${booking.negotiated_price}</Text>
            </>
          )}

          {(booking.preferred_date || booking.preferred_time) && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Preferred Schedule</Text>
              <Text style={styles.detailText}>
                {booking.preferred_date} {booking.preferred_time}
              </Text>
            </>
          )}

          {booking.address_text && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Service Location</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Ionicons name="location" size={20} color="#FFC107" style={{ marginRight: 8 }} />
                <Text style={[styles.detailText, { flex: 1 }]}>{booking.address_text}</Text>
              </View>
              {booking.latitude && booking.longitude && (
                <View style={styles.mapContainer}>
                  <WebView
                    style={styles.map}
                    scrollEnabled={false}
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                            <style>
                              body { padding: 0; margin: 0; }
                              #map { width: 100%; height: 100vh; filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
                            </style>
                          </head>
                          <body>
                            <div id="map"></div>
                            <script>
                              var map = L.map('map', {
                                zoomControl: false,
                                dragging: false,
                                scrollWheelZoom: false,
                                doubleClickZoom: false,
                                touchZoom: false
                              }).setView([${booking.latitude}, ${booking.longitude}], 14);
                              
                              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                maxZoom: 19,
                                attribution: '© OpenStreetMap'
                              }).addTo(map);

                              L.marker([${booking.latitude}, ${booking.longitude}]).addTo(map);
                            </script>
                          </body>
                        </html>
                      `
                    }}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {booking.status === 'PENDING' || booking.status === 'ACCEPTED' || booking.status === 'ACTIVE' ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          {isProcessing ? <ActivityIndicator color="#FFC107" /> : renderButtons()}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  backButton: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#FFC107' },
  container: { padding: 20 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  descriptionText: {
    fontSize: 15,
    color: '#A0A0A0',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 15,
  },
  badge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  badgeText: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  jobRoleCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginTop: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobRoleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  jobRoleRate: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    padding: 15,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  rowBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerBtn: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },
  successBtn: {
    backgroundColor: '#FFC107',
    shadowColor: '#FFC107',
  },
  disabledBtn: {
    backgroundColor: '#333333',
    elevation: 0,
    shadowOpacity: 0,
  },
  btnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '900',
  },
  mapContainer: {
    height: 150,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  map: {
    flex: 1,
  }
});
