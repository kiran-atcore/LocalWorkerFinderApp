import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api, { getImageUrl } from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

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

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#FFC107" /></View>;
  if (!profile) return <View style={styles.center}><Text>Profile not found</Text></View>;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
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
          <View style={[styles.ratingBadge, { flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="star" size={14} color="#FFC107" style={{ marginRight: 4 }} />
            <Text style={styles.ratingText}>{profile.rating.toFixed(1)}</Text>
          </View>
          <Pressable
            style={[styles.actionButton, { marginTop: 15, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => (router.push as any)(`/ChatInbox/new?other_user_id=${profile.user.id}&name=${encodeURIComponent(profile.user.first_name + ' ' + profile.user.last_name)}`)}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#ffffffff" style={{ marginRight: 6 }} />
            <Text style={styles.actionButtonText}>Chat</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{profile.bio || 'No bio provided.'}</Text>
        </View>

        {profile.address_text && profile.latitude && profile.longitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="location" size={20} color="#FFC107" style={{ marginRight: 8 }} />
              <Text style={[styles.addressText, { marginBottom: 0, flex: 1 }]}>{profile.address_text}</Text>
            </View>
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
                  <View style={{ flex: 1 }}>
                    <View style={styles.roleHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="briefcase-outline" size={18} color="#FFC107" style={{ marginRight: 8 }} />
                        <Text style={styles.roleCategory}>{role.category}</Text>
                      </View>
                      <Text style={styles.rolePrice}>${role.hourly_rate}/hr</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="time-outline" size={14} color="#A0A0A0" style={{ marginRight: 4 }} />
                      <Text style={styles.roleExp}>{role.experience_years} years exp</Text>
                    </View>
                    {role.description ? (
                      <Text style={styles.roleDesc} numberOfLines={2}>{role.description}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#A0A0A0" style={{ marginLeft: 10, alignSelf: 'center' }} />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#333333' }}>
                <Text style={{ fontSize: 42, fontWeight: 'bold', color: '#FFC107' }}>{profile.rating.toFixed(1)}</Text>
                <View style={{ marginLeft: 15 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>Overall Rating</Text>
                  <Text style={{ color: '#A0A0A0', fontSize: 13 }}>Based on {profile.review_stats.total_reviews} review(s)</Text>
                </View>
              </View>

              <View style={styles.statRow}><Text style={styles.statLabel}>Skill:</Text><View style={[styles.statValueContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}><Ionicons name="star" size={14} color="#FFC107" style={{ marginRight: 4 }} /><Text style={styles.statValue}>{Number(profile.review_stats.skill || 0).toFixed(1)}</Text></View></View>
              <View style={styles.statRow}><Text style={styles.statLabel}>Performance:</Text><View style={[styles.statValueContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}><Ionicons name="star" size={14} color="#FFC107" style={{ marginRight: 4 }} /><Text style={styles.statValue}>{Number(profile.review_stats.performance || 0).toFixed(1)}</Text></View></View>
              <View style={styles.statRow}><Text style={styles.statLabel}>Service Quality:</Text><View style={[styles.statValueContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}><Ionicons name="star" size={14} color="#FFC107" style={{ marginRight: 4 }} /><Text style={styles.statValue}>{Number(profile.review_stats.service_quality || 0).toFixed(1)}</Text></View></View>
              <View style={styles.statRow}><Text style={styles.statLabel}>Friendly:</Text><View style={[styles.statValueContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}><Ionicons name="star" size={14} color="#FFC107" style={{ marginRight: 4 }} /><Text style={styles.statValue}>{Number(profile.review_stats.friendly || 0).toFixed(1)}</Text></View></View>
              <View style={styles.statRow}><Text style={styles.statLabel}>Cost Efficiency:</Text><View style={[styles.statValueContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }]}><Ionicons name="star" size={14} color="#FFC107" style={{ marginRight: 4 }} /><Text style={styles.statValue}>{Number(profile.review_stats.cost_efficiency || 0).toFixed(1)}</Text></View></View>
            </View>
          ) : (
            <Text style={styles.bioText}>No ratings yet.</Text>
          )}

          {reviews.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 15, fontSize: 18, color: '#FFC107' }}>Latest Reviews</Text>
              {reviews.map((rev) => {
                const createdTime = new Date(rev.created_at).getTime();
                const updatedTime = rev.updated_at ? new Date(rev.updated_at).getTime() : createdTime;
                const isEdited = updatedTime - createdTime > 1000;
                const displayDate = new Date(isEdited ? updatedTime : createdTime);
                const dateStr = displayDate.toLocaleDateString() + ' ' + displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (isEdited ? ' (Edited)' : '');

                return (
                  <Pressable key={rev.id} style={styles.reviewCard} onPress={() => router.push(`/ReviewView/${rev.id}` as any)}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFC107', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                          <Text style={{ color: '#121212', fontWeight: 'bold', fontSize: 18 }}>
                            {(rev.customer?.user?.first_name || 'C').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewAuthor}>{rev.customer?.user?.first_name || 'Customer'}</Text>
                          <Text style={{ color: '#A0A0A0', fontSize: 12 }}>{dateStr}</Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: '#1E1E1E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFC107', flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="star" size={12} color="#FFC107" style={{ marginRight: 4 }} />
                        <Text style={styles.reviewStars}>{rev.overall_rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    {rev.review_text ? <Text style={styles.reviewText} numberOfLines={3}>"{rev.review_text}"</Text> : null}
                  </Pressable>
                );
              })}
              <Pressable
                style={styles.viewAllBtn}
                onPress={() => router.push(`/ReviewList/${profile.id}` as any)}
              >
                <Text style={styles.viewAllBtnText}>View All Reviews</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFC107" style={{ marginLeft: 6 }} />
              </Pressable>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#121212', borderBottomWidth: 1, borderColor: '#333333' },
  photo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E1E1E', marginBottom: 15 },
  placeholderPhoto: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#A0A0A0' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  businessName: { fontSize: 16, color: '#A0A0A0', marginTop: 5 },
  ratingBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1E1E1E', borderRadius: 20, borderWidth: 1, borderColor: '#FFC107' },
  ratingText: { color: '#FFC107', fontWeight: 'bold' },
  section: { marginTop: 20, padding: 20, backgroundColor: '#121212', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#333333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#FFC107' },
  bioText: { fontSize: 16, color: '#A0A0A0', lineHeight: 24 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillBadge: { backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FFC107' },
  skillText: { color: '#FFC107', fontWeight: '600' },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
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
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  rolePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  roleExp: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  roleDesc: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
  addressText: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 15,
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
  },
  actionButton: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  actionButtonText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addReviewBtn: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addReviewBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: { color: '#A0A0A0', fontSize: 15 },
  statValueContainer: { width: 60, alignItems: 'flex-end' },
  statValue: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  totalReviewsText: {
    marginTop: 10,
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },
  reviewAuthor: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    color: '#FFFFFF',
  },
  reviewStars: {
    color: '#FFC107',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewText: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  viewAllBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FFC107',
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
  },
  viewAllBtnText: {
    color: '#FFC107',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
