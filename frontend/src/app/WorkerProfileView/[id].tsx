import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api, { getImageUrl } from '../../services/axios';

export default function WorkerProfileView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchProfileAndRoles();
  }, [id]);

  const fetchProfileAndRoles = async () => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        api.get(`users/worker-profile/${id}/`),
        api.get(`services/search/job-roles/?worker_id=${id}`)
      ]);
      setProfile(profileRes.data);
      setJobRoles(rolesRes.data);
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{profile.bio || 'No bio provided.'}</Text>
        </View>

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
            jobRoles.map((role) => (
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
            ))
          ) : (
            <Text style={styles.bioText}>No services listed.</Text>
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
  }
});
