import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
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
      setFullName(`${response.data.user.first_name} ${response.data.user.last_name}`.trim());
      setBusinessName(response.data.business_name || '');
      setBio(response.data.bio || '');
      setSkills(response.data.skills || []);
      
      if (response.data.profile_photo) {
        setPhotoUri(getImageUrl(response.data.profile_photo));
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
          first_name: res.data.user.first_name, 
          last_name: res.data.user.last_name,
          profile_photo: res.data.profile_photo 
        });
      }
      
      Alert.alert('Success', 'Worker profile updated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Worker profile update failed:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to update worker profile: ${JSON.stringify(error.response?.data || error.message)}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#007aff" /></View>;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
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
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
        
        <Text style={styles.label}>Business Name</Text>
        <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="E.g., John's Plumbing" />

        <Text style={styles.label}>Service Location</Text>
        <View style={{ marginBottom: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' }}>
          <LocationBanner mode="profile" />
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Describe your experience..." multiline numberOfLines={4} />

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
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </Pressable>
        <View style={{height: 50}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  photoContainer: { alignItems: 'center', marginBottom: 30 },
  photo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
  placeholderPhoto: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#888' },
  photoActions: { flexDirection: 'row', marginTop: 15, gap: 10 },
  photoButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  removeButton: { backgroundColor: '#ffeeee' },
  photoButtonText: { color: '#007aff', fontWeight: '600' },
  removeButtonText: { color: '#ff3b30', fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: 'top' },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  skillChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  skillChipSelected: { backgroundColor: '#007aff', borderColor: '#007aff' },
  skillChipText: { color: '#333', fontSize: 14, fontWeight: '500' },
  skillChipTextSelected: { color: '#fff' },
  saveButton: { backgroundColor: '#007aff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabled: { opacity: 0.7 },
});
