import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUrl } from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function CustomerProfileEdit() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('users/customer-profile/');
      setFullName(`${response.data.user.first_name} ${response.data.user.last_name}`.trim());
      if (response.data.profile_photo) {
        setPhotoUri(getImageUrl(response.data.profile_photo));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile details.');
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
    setPhotoFile('REMOVE'); // Special flag to backend
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('full_name', fullName);

      if (photoFile === 'REMOVE') {
        formData.append('profile_photo', '');
      } else if (photoFile) {
        formData.append('profile_photo', {
          uri: photoFile.uri,
          name: 'photo.jpg',
          type: photoFile.mimeType || 'image/jpeg',
        } as any);
      }

      const res = await api.put('users/customer-profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update global user
      if (user) {
        setAuth({
          ...user,
          first_name: res.data.user.first_name,
          last_name: res.data.user.last_name,
          profile_photo: res.data.profile_photo
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Customer profile update failed:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to update profile: ${JSON.stringify(error.response?.data || error.message)}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FFC107" /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <Text style={styles.title}>Edit Customer Profile</Text>

        <View style={styles.photoContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.placeholderPhoto]}>
              <Text style={styles.placeholderText}>No Photo</Text>
            </View>
          )}
          <View style={styles.photoActions}>
            <Pressable style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>Change Photo</Text>
            </Pressable>
            {photoUri && (
              <Pressable style={[styles.photoButton, styles.removeButton]} onPress={removePhoto}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="John Doe"
          placeholderTextColor="#666666"
        />

        <Pressable
          style={[styles.saveButton, isSaving && styles.disabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#FFC107' },
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
  input: { borderWidth: 1, borderColor: '#333333', borderRadius: 16, padding: 15, fontSize: 16, marginBottom: 30, backgroundColor: '#1E1E1E', color: '#FFFFFF' },
  saveButton: { backgroundColor: '#FFC107', padding: 15, borderRadius: 30, alignItems: 'center' },
  saveButtonText: { color: '#121212', fontSize: 18, fontWeight: 'bold' },
  disabled: { opacity: 0.7 },
});
