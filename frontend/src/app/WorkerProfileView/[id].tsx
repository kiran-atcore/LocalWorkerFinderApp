import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api, { getImageUrl } from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function WorkerProfileView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [showAllServices, setShowAllServices] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { user, activeRole } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      fetchProfileAndRoles();
    }, [id])
  );

  const fetchProfileAndRoles = async () => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        api.get(`users/worker-profile/${id}/`),
        api.get(`services/search/job-roles/?worker_id=${id}`)
      ]);
      setProfile(profileRes.data);
      setJobRoles(rolesRes.data);
      
      const workerId = profileRes.data.id;
      const reviewsRes = await api.get(`users/reviews/?worker_id=${workerId}`);
      setReviews(reviewsRes.data.slice(0, 3)); // Top 3 latest reviews
      
      if (user) {
        const found = reviewsRes.data.find((r: any) => r.customer?.user?.id === user.id);
        setUserReview(found || null);
      }
    } catch (error) {
      console.error('Failed to load worker profile or roles', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#007aff" /></View>;
  if (!profile) return <View style={styles.center}><Text>Profile not found</Text></View>;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <View style={styles.header}>
          {profile.profile_photo ? (
            <Image source={{ uri: getImageUrl(profile.profile_photo) as string }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.placeholderPhoto]}>
              <Text style={styles.placeholderText}>No Photo</Text>
            </View>
          )}
          <Text style={styles.name}>{profile.user.first_name} {profile.user.last_name}</Text>
          <Text style={styles.businessName}>{profile.business_name || 'Independent Worker'}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {profile.rating.toFixed(1)}</Text>
          </View>
          <Pressable 
            style={[styles.actionButton, { marginTop: 15 }]} 
            onPress={() => (router.push as any)(`/ChatInbox/new?other_user_id=${profile.user.id}&name=${encodeURIComponent(profile.user.first_name + ' ' + profile.user.last_name)}`)}
          >
            <Text style={styles.actionButtonText}>💬 Chat</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{profile.bio || 'No bio provided.'}</Text>
        </View>

        {profile.address_text && profile.latitude && profile.longitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.addressText}>{profile.address_text}</Text>
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
                          #map { width: 100%; height: 100vh; }
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
                          }).setView([${profile.latitude}, ${profile.longitude}], 14);
                          
                          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19,
                            attribution: '© OpenStreetMap'
                          }).addTo(map);

                          L.marker([${profile.latitude}, ${profile.longitude}]).addTo(map);
                        </script>
                      </body>
                    </html>
                  `
                }}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.bioText}>No skills listed.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provided Services</Text>
          {jobRoles.length > 0 ? (
            <>
              {(showAllServices ? jobRoles : jobRoles.slice(0, 3)).map((role) => (
                <Pressable 
                  key={role.id} 
                  style={styles.roleCard}
                  onPress={() => router.push(`/JobRoleView/${role.id}` as any)}
                >
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleCategory}>{role.category}</Text>
                    <Text style={styles.rolePrice}>${role.hourly_rate}/hr</Text>
                  </View>
                  <Text style={styles.roleExp}>{role.experience_years} years exp</Text>
                  {role.description ? (
                    <Text style={styles.roleDesc} numberOfLines={2}>{role.description}</Text>
                  ) : null}
                </Pressable>
              ))}
              {jobRoles.length > 3 && (
                <Pressable 
                  style={styles.viewAllBtn} 
                  onPress={() => setShowAllServices(!showAllServices)}
                >
                  <Text style={styles.viewAllBtnText}>
                    {showAllServices ? 'View Less' : `View All Services (${jobRoles.length})`}
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <Text style={styles.bioText}>No services listed.</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
            {activeRole === 'customer' && user?.id !== profile.user?.id && (
              <Pressable 
                style={styles.addReviewBtn} 
                onPress={() => router.push((userReview ? `/ReviewView/${userReview.id}` : `/AddReviewForm/${profile.id}`) as any)}
              >
                <Text style={styles.addReviewBtnText}>{userReview ? 'View Review' : 'Add Review'}</Text>
              </Pressable>
            )}
          </View>

          {profile.review_stats ? (
            <View style={styles.statsContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontSize: 42, fontWeight: 'bold', color: '#d48806' }}>{profile.rating.toFixed(1)}</Text>
                <View style={{ marginLeft: 15 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Overall Rating</Text>
                  <Text style={{ color: '#888', fontSize: 13 }}>Based on {profile.review_stats.total_reviews} review(s)</Text>
                </View>
              </View>

              <View style={styles.statRow}><Text>Skill:</Text><Text>⭐ {profile.review_stats.skill}</Text></View>
              <View style={styles.statRow}><Text>Performance:</Text><Text>⭐ {profile.review_stats.performance}</Text></View>
              <View style={styles.statRow}><Text>Service Quality:</Text><Text>⭐ {profile.review_stats.service_quality}</Text></View>
              <View style={styles.statRow}><Text>Friendly:</Text><Text>⭐ {profile.review_stats.friendly}</Text></View>
              <View style={styles.statRow}><Text>Cost Efficiency:</Text><Text>⭐ {profile.review_stats.cost_efficiency}</Text></View>
            </View>
          ) : (
            <Text style={styles.bioText}>No ratings yet.</Text>
          )}

          {reviews.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 16 }}>Latest Reviews</Text>
              {reviews.map((rev) => {
                const createdTime = new Date(rev.created_at).getTime();
                const updatedTime = rev.updated_at ? new Date(rev.updated_at).getTime() : createdTime;
                const isEdited = updatedTime - createdTime > 1000;
                const displayDate = new Date(isEdited ? updatedTime : createdTime);
                const dateStr = displayDate.toLocaleDateString() + ' ' + displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (isEdited ? ' (Edited)' : '');
                
                return (
                  <Pressable key={rev.id} style={styles.reviewCard} onPress={() => router.push(`/ReviewView/${rev.id}` as any)}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.reviewAuthor}>{rev.customer?.user?.first_name || 'Customer'}</Text>
                      <Text style={{ color: '#888', fontSize: 12 }}>{dateStr}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={styles.reviewStars}>⭐ {rev.overall_rating.toFixed(1)}</Text>
                    </View>
                    {rev.review_text ? <Text style={styles.reviewText} numberOfLines={2}>{rev.review_text}</Text> : null}
                  </Pressable>
                );
              })}
              <Pressable 
                style={styles.viewAllBtn} 
                onPress={() => router.push(`/ReviewList/${profile.id}` as any)}
              >
                <Text style={styles.viewAllBtnText}>View All Reviews</Text>
              </Pressable>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  photo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', marginBottom: 15 },
  placeholderPhoto: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#888' },
  name: { fontSize: 24, fontWeight: 'bold' },
  businessName: { fontSize: 16, color: '#666', marginTop: 5 },
  ratingBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fffbe6', borderRadius: 16, borderWidth: 1, borderColor: '#ffe58f' },
  ratingText: { color: '#d48806', fontWeight: 'bold' },
  section: { marginTop: 20, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  bioText: { fontSize: 16, color: '#444', lineHeight: 24 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillBadge: { backgroundColor: '#e6f7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#91d5ff' },
  skillText: { color: '#096dd9', fontWeight: '500' },
  roleCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  roleCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  rolePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007aff',
  },
  roleExp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  roleDesc: {
    fontSize: 14,
    color: '#555',
  },
  addressText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 15,
  },
  mapContainer: {
    height: 150,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  map: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addReviewBtn: {
    backgroundColor: '#34c759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addReviewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalReviewsText: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  reviewAuthor: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reviewStars: {
    color: '#d48806',
    marginBottom: 5,
    fontSize: 12,
  },
  reviewText: {
    color: '#555',
    fontSize: 14,
  },
  viewAllBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#007aff',
    borderRadius: 8,
  },
  viewAllBtnText: {
    color: '#007aff',
    fontWeight: 'bold',
  }
});
