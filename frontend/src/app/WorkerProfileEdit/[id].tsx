import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUrl } from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { CATEGORIES } from '../../constants/categories';
import LocationBanner from '../../Components/LocationBanner';

export default function WorkerProfileEdit() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, setAuth, pendingWorkerLocation, setPendingWorkerLocation } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchProfile();
    return () => setPendingWorkerLocation(null);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('users/worker-profile/');
      if (response.data && response.data.user) {
        setFullName(`${response.data.user.first_name || ''} ${response.data.user.last_name || ''}`.trim());
        setBusinessName(response.data.business_name || '');
        setBio(response.data.bio || '');
        setSkills(response.data.skills || []);

        if (response.data.profile_photo) {
          setPhotoUri(getImageUrl(response.data.profile_photo));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch worker profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoFile(result.assets[0]);
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoFile('REMOVE');
  };

  const handleSave = async () => {
    if (user?.worker_profile_status === 'permanently_rejected') {
      Alert.alert('Error', 'Your profile has been permanently rejected.');
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('business_name', businessName);
      formData.append('bio', bio);

      formData.append('skills', JSON.stringify(skills));

      if (photoFile === 'REMOVE') {
        formData.append('profile_photo', '');
      } else if (photoFile) {
        formData.append('profile_photo', {
          uri: photoFile.uri,
          name: 'photo.jpg',
          type: photoFile.mimeType || 'image/jpeg',
        } as any);
      }

      if (pendingWorkerLocation) {
        formData.append('latitude', pendingWorkerLocation.latitude.toString());
        formData.append('longitude', pendingWorkerLocation.longitude.toString());
        formData.append('address_text', pendingWorkerLocation.address_text);
      }

      const res = await api.put('users/worker-profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (user) {
        setAuth({
          ...user,
          first_name: res.data.user?.first_name || user.first_name,
          last_name: res.data.user?.last_name || user.last_name,
          profile_photo: res.data.profile_photo || user.profile_photo,
          has_worker_profile: true,
          worker_profile_status: !user.has_worker_profile ? 'pending' : (user.worker_profile_status || 'pending')
        });
      }

      Alert.alert('Success', 'Profile saved successfully! If this is your first time, please wait for admin approval before switching to worker mode.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Worker profile update failed:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to update worker profile: ${JSON.stringify(error.response?.data || error.message)}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#FFC107" /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <Text style={styles.title}>Edit Worker Profile</Text>
        <View style={styles.photoContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.placeholderPhoto]}>
              <Text style={styles.placeholderText}>No Photo</Text>
            </View>
          )}
          <View style={styles.photoActions}>
            <Pressable style={styles.photoButton} onPress={pickImage}><Text style={styles.photoButtonText}>Change Photo</Text></Pressable>
            {photoUri && (
              <Pressable style={[styles.photoButton, styles.removeButton]} onPress={removePhoto}><Text style={styles.removeButtonText}>Remove</Text></Pressable>
            )}
          </View>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter full name" placeholderTextColor="#666666" />

        <Text style={styles.label}>Business Name</Text>
        <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="E.g., John's Plumbing" placeholderTextColor="#666666" />

        <Text style={styles.label}>Service Location</Text>
        <View style={{ marginBottom: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' }}>
          <LocationBanner mode="profile" />
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Describe your experience..." placeholderTextColor="#666666" multiline numberOfLines={4} />

        <Text style={styles.label}>Skills / Services Offered</Text>
        <View style={styles.skillsContainer}>
          {CATEGORIES.map(cat => {
            const isSelected = skills.includes(cat.name);
            return (
              <Pressable
                key={cat.id}
                style={[styles.skillChip, isSelected && styles.skillChipSelected]}
                onPress={() => {
                  if (isSelected) {
                    setSkills(skills.filter(s => s !== cat.name));
                  } else {
                    setSkills([...skills, cat.name]);
                  }
                }}
              >
                <Text style={[styles.skillChipText, isSelected && styles.skillChipTextSelected]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={[styles.saveButton, isSaving && styles.disabled]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>{!user?.has_worker_profile ? 'Request Access' : 'Save Changes'}</Text>}
        </Pressable>
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#FFC107' },
  photoContainer: { alignItems: 'center', marginBottom: 30 },
  photo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E1E1E' },
  placeholderPhoto: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#A0A0A0' },
  photoActions: { flexDirection: 'row', marginTop: 15, gap: 10 },
  photoButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1E1E1E', borderRadius: 20, borderWidth: 1, borderColor: '#FFC107' },
  removeButton: { borderColor: '#FF6B6B' },
  photoButtonText: { color: '#FFC107', fontWeight: '600' },
  removeButtonText: { color: '#FF6B6B', fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#FFC107' },
  input: { borderWidth: 1, borderColor: '#333333', borderRadius: 16, padding: 15, fontSize: 16, marginBottom: 20, backgroundColor: '#1E1E1E', color: '#FFFFFF' },
  textArea: { height: 100, textAlignVertical: 'top' },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  skillChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333333' },
  skillChipSelected: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
  skillChipText: { color: '#A0A0A0', fontSize: 14, fontWeight: '500' },
  skillChipTextSelected: { color: '#121212', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#FFC107', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#121212', fontSize: 18, fontWeight: 'bold' },
  disabled: { opacity: 0.7 },
});
