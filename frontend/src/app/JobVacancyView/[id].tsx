import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, Image, LayoutAnimation, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ExpandableComment = ({ comment }: { comment: string }) => {
  const [expanded, setExpanded] = useState(false);

  // Heuristic for showing expand button: more than 70 chars or has multiple newlines
  const shouldShowExpand = comment.length > 70 || (comment.match(/\n/g) || []).length >= 2;

  const toggleExpand = () => {
    LayoutAnimation.configureNext({
      duration: 400,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setExpanded(!expanded);
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={styles.applicantComment}
        numberOfLines={expanded ? undefined : 2}
      >
        "{comment}"
      </Text>
      {shouldShowExpand && (
        <TouchableOpacity onPress={toggleExpand} style={{ alignItems: 'center', marginTop: 4, paddingVertical: 4 }}>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#007AFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function JobVacancyViewDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { activeRole } = useAuthStore();

  const [vacancy, setVacancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Worker state
  const [comment, setComment] = useState('');
  const [applying, setApplying] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Customer state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVacancy = async () => {
    try {
      setLoading(true);
      const res = await api.get(`bookings/vacancies/${id}/`);
      setVacancy(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load vacancy details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchVacancy();
      }
    }, [id])
  );

  const handleApply = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a cover letter or comment.');
      return;
    }
    try {
      setApplying(true);
      await api.post(`bookings/vacancies/${id}/apply/`, { comment });
      Alert.alert('Success', 'Application submitted successfully!');
      fetchVacancy();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelApplication = () => {
    Alert.alert(
      "Withdraw Application",
      "Are you sure you want to withdraw your application?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Withdraw",
          style: "destructive",
          onPress: async () => {
            if (!vacancy?.application_id) return;
            try {
              setCanceling(true);
              await api.delete(`bookings/applications/${vacancy.application_id}/?role=worker`);
              Alert.alert("Success", "Your application has been withdrawn.");
              fetchVacancy();
            } catch (error) {
              console.error("Failed to cancel application:", error);
              Alert.alert("Error", "Could not withdraw application. Please try again.");
            } finally {
              setCanceling(false);
            }
          }
        }
      ]
    );
  };

  const handleApplicationAction = async (appId: number, action: 'accept' | 'reject') => {
    setActionLoading(`${action}-${appId}`);
    try {
      await api.post(`bookings/applications/${appId}/${action}/`);
      Alert.alert('Success', `Application ${action}ed.`);
      fetchVacancy();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || `Failed to ${action} application.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteVacancy = () => {
    Alert.alert('Delete Job', 'Are you sure you want to delete this job vacancy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`bookings/vacancies/${id}/`);
            Alert.alert('Success', 'Job vacancy deleted.');
            router.replace('/JobVacancy/list');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete job vacancy.');
          }
        }
      }
    ]);
  };

  const handleCloseVacancy = () => {
    Alert.alert('Close Job', 'Are you sure you want to close this job vacancy? It will no longer be visible to workers.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Job',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`bookings/vacancies/${id}/`, { is_active: false });
            Alert.alert('Success', 'Job vacancy closed.');
            fetchVacancy();
          } catch (err) {
            Alert.alert('Error', 'Failed to close job vacancy.');
          }
        }
      }
    ]);
  };

  const handleReopenVacancy = () => {
    Alert.alert('Reopen Job', 'Are you sure you want to reopen this job vacancy? It will become visible to workers again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reopen Job',
        style: 'default',
        onPress: async () => {
          try {
            await api.patch(`bookings/vacancies/${id}/`, { is_active: true });
            Alert.alert('Success', 'Job vacancy reopened.');
            fetchVacancy();
          } catch (err) {
            Alert.alert('Error', 'Failed to reopen job vacancy.');
          }
        }
      }
    ]);
  };

  if (loading || !vacancy) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const isCustomer = activeRole === 'customer';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Job Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.category, { flexShrink: 1 }]} numberOfLines={1}>{vacancy.title}</Text>
                {!vacancy.is_active && (
                  <Text style={{ fontSize: 11, color: '#C62828', fontWeight: 'bold', backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>CLOSED</Text>
                )}
                {vacancy.is_active && (
                  <Text style={{ fontSize: 11, color: '#2E7D32', fontWeight: 'bold', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>ACTIVE</Text>
                )}
              </View>
              <Text style={styles.remuneration}>${vacancy.remuneration}</Text>
            </View>
            <Text style={styles.location}>📍 {vacancy.address_text || 'Location not specified'}</Text>
            {!!vacancy.contact_email && (
              <Text style={[styles.location, { marginTop: 4 }]}>✉️ {vacancy.contact_email}</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{vacancy.description}</Text>

            <Text style={styles.sectionTitle}>Experience Required</Text>
            <Text style={styles.text}>{vacancy.experience_required}</Text>

            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skillsContainer}>
              {vacancy.skills_required.map((skill: string, idx: number) => (
                <View key={idx} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>

            {!isCustomer && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Posted By</Text>
                <View style={styles.clientProfileContainer}>
                  {vacancy.customer_details.profile_photo ? (
                    <Image source={{ uri: vacancy.customer_details.profile_photo }} style={styles.clientAvatar} />
                  ) : (
                    <View style={styles.clientAvatarPlaceholder}>
                      <Text style={styles.clientAvatarText}>{vacancy.customer_details.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{vacancy.customer_details.name}</Text>
                    <Text style={styles.clientEmail}>{vacancy.customer_details.email}</Text>
                  </View>
                </View>
              </>
            )}

            {isCustomer && (
              <View style={styles.manageActions}>
                <TouchableOpacity
                  style={[styles.manageBtn, styles.editBtn]}
                  onPress={() => router.push(`/JobVacancyForm/${vacancy.id}`)}
                >
                  <Text style={styles.manageBtnText}>Edit</Text>
                </TouchableOpacity>
                {vacancy.is_active ? (
                  <TouchableOpacity
                    style={[styles.manageBtn, styles.closeBtn]}
                    onPress={handleCloseVacancy}
                  >
                    <Text style={[styles.manageBtnText, { color: '#E65100' }]}>Close</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.manageBtn, styles.reopenBtn]}
                    onPress={handleReopenVacancy}
                  >
                    <Text style={[styles.manageBtnText, { color: '#2E7D32' }]}>Reopen</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.manageBtn, styles.deleteBtn]}
                  onPress={handleDeleteVacancy}
                >
                  <Text style={[styles.manageBtnText, { color: '#C62828' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isCustomer ? (
            <View style={styles.applicationsSection}>
              <Text style={styles.applicationsTitle}>Applicants ({vacancy.applications_count})</Text>
              {vacancy.applications.length === 0 ? (
                <Text style={styles.noApplicants}>No one has applied yet.</Text>
              ) : (
                vacancy.applications.map((app: any) => (
                  <View key={app.id} style={styles.applicantCard}>
                    <View style={styles.applicantHeader}>
                      {app.worker_details.profile_photo ? (
                        <Image source={{ uri: app.worker_details.profile_photo }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder} />
                      )}
                      <View style={styles.applicantInfo}>
                        <Text style={styles.applicantName}>{app.worker_details.name}</Text>
                        <Text style={styles.applicantRating}>⭐ {app.worker_details.rating}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.viewProfileBtn}
                        onPress={() => router.push(`/WorkerProfileView/${app.worker_details.user_id}`)}
                      >
                        <Text style={styles.viewProfileText}>View Profile</Text>
                      </TouchableOpacity>
                    </View>

                    <ExpandableComment comment={app.comment} />

                    <View style={styles.applicantActions}>
                      <Text style={[styles.statusBadge, styles[`status${app.status}` as keyof typeof styles]]}>
                        {app.status}
                      </Text>
                      {app.status === 'PENDING' && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => handleApplicationAction(app.id, 'reject')}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === `reject-${app.id}` ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Reject</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn]}
                            onPress={() => handleApplicationAction(app.id, 'accept')}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === `accept-${app.id}` ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Accept</Text>}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.applySection}>
              {vacancy.has_applied ? (
                <View style={styles.appliedCardWrapper}>
                  <View style={[styles.appliedCard, vacancy.application_status === 'PENDING' ? styles.appliedCardPENDING : vacancy.application_status === 'ACCEPTED' ? styles.appliedCardACCEPTED : vacancy.application_status === 'REJECTED' ? styles.appliedCardREJECTED : null]}>
                    <Text style={[styles.appliedText, vacancy.application_status === 'PENDING' ? styles.appliedTextPENDING : vacancy.application_status === 'ACCEPTED' ? styles.appliedTextACCEPTED : vacancy.application_status === 'REJECTED' ? styles.appliedTextREJECTED : null]}>
                      {vacancy.application_status === 'PENDING' && '⏳ Your application is pending.'}
                      {vacancy.application_status === 'ACCEPTED' && '✅ Your application has been accepted!'}
                      {vacancy.application_status === 'REJECTED' && '❌ Your application was rejected.'}
                      {!vacancy.application_status && '✅ You have applied for this job.'}
                    </Text>
                  </View>
                  {vacancy.application_status === 'ACCEPTED' && (
                    <TouchableOpacity
                      style={[styles.cancelAppBtn, { backgroundColor: '#007AFF', borderColor: '#007AFF', marginBottom: 10 }]}
                      onPress={() => (router.push as any)(`/ChatInbox/new?other_user_id=${vacancy.customer_details.user_id}&name=${encodeURIComponent(vacancy.customer_details.name)}`)}
                    >
                      <Text style={[styles.cancelAppText, { color: '#fff' }]}>💬 Chat with Client</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.cancelAppBtn}
                    onPress={handleCancelApplication}
                    disabled={canceling}
                  >
                    {canceling ? <ActivityIndicator color="#F44336" size="small" /> : <Text style={styles.cancelAppText}>Withdraw Application</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Apply for this Job</Text>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a brief cover letter or comment..."
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                  />
                  <TouchableOpacity
                    style={[styles.applyButton, applying && styles.applyButtonDisabled]}
                    onPress={handleApply}
                    disabled={applying}
                  >
                    {applying ? <ActivityIndicator color="#fff" /> : <Text style={styles.applyButtonText}>Submit Application</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 16, color: '#007AFF' },
  title: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 15, paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  remuneration: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  location: { fontSize: 14, color: '#666', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 15 },
  text: { fontSize: 15, color: '#555', marginBottom: 15 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  skillChip: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  skillText: { color: '#1976D2', fontSize: 13, fontWeight: '600' },
  applicationsSection: { marginTop: 10 },
  applicationsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  noApplicants: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  applicantCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  applicantHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ddd' },
  applicantInfo: { flex: 1, marginLeft: 15 },
  applicantName: { fontSize: 16, fontWeight: 'bold' },
  applicantRating: { fontSize: 14, color: '#F5A623', marginTop: 4 },
  viewProfileBtn: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 8 },
  viewProfileText: { color: '#007AFF', fontSize: 12, fontWeight: 'bold' },
  applicantComment: { fontSize: 14, color: '#555', fontStyle: 'italic', backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, marginBottom: 15 },
  applicantActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  statusPENDING: { backgroundColor: '#FFF3E0', color: '#F57C00' },
  statusACCEPTED: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  statusREJECTED: { backgroundColor: '#FFEBEE', color: '#C62828' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, minWidth: 70, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#4CAF50' },
  rejectBtn: { backgroundColor: '#F44336' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  applySection: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  commentInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 15, height: 100, textAlignVertical: 'top', marginBottom: 15, backgroundColor: '#F9F9F9' },
  applyButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' },
  applyButtonDisabled: { opacity: 0.6 },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  appliedCardWrapper: { gap: 10 },
  appliedCard: { backgroundColor: '#E8F5E9', padding: 15, borderRadius: 8, alignItems: 'center' },
  appliedText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 15 },
  appliedCardPENDING: { backgroundColor: '#FFF3E0' },
  appliedTextPENDING: { color: '#F57C00' },
  appliedCardACCEPTED: { backgroundColor: '#E8F5E9' },
  appliedTextACCEPTED: { color: '#2E7D32' },
  appliedCardREJECTED: { backgroundColor: '#FFEBEE' },
  appliedTextREJECTED: { color: '#C62828' },
  cancelAppBtn: { padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' },
  cancelAppText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 15 },
  clientProfileContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, marginBottom: 15 },
  clientAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  clientAvatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007AFF20', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  clientAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  clientEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  manageActions: { flexDirection: 'row', marginTop: 20, gap: 10 },
  manageBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  editBtn: { backgroundColor: '#F0F0F0' },
  closeBtn: { backgroundColor: '#FFF3E0' },
  reopenBtn: { backgroundColor: '#E8F5E9' },
  deleteBtn: { backgroundColor: '#FFEBEE' },
  manageBtnText: { fontWeight: 'bold', fontSize: 14, color: '#333' }
});
