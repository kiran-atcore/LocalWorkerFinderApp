import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';
import { CATEGORIES } from '../../constants/categories';

import CategoryCard from '../../Components/CategoryCard';

export default function JobRoleFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isNew = id === 'new';
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [hourlyRate, setHourlyRate] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchJobRole();
    }
  }, [id]);

  const fetchJobRole = async () => {
    try {
      const res = await api.get(`services/job-roles/${id}/`);
      setCategory(res.data.category);
      setHourlyRate(res.data.hourly_rate.toString());
      setExperience(res.data.experience_years.toString());
      setDescription(res.data.description);
    } catch (error) {
      Alert.alert('Error', 'Failed to load job role.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hourlyRate || !experience) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }

    setIsSaving(true);
    const payload = {
      category,
      hourly_rate: parseFloat(hourlyRate),
      experience_years: parseInt(experience, 10),
      description,
    };

    try {
      if (isNew) {
        await api.post('services/job-roles/', payload);
      } else {
        await api.put(`services/job-roles/${id}/`, payload);
      }
      Alert.alert('Success', 'Job role saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Save job role failed', error.response?.data);
      Alert.alert('Error', 'Failed to save job role.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#FFC107" />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.title}>{isNew ? 'Add Job Role' : 'Edit Job Role'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
        <Text style={styles.label}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              iconName={cat.iconName}
              iconFamily={cat.iconFamily as any}
              color={cat.color}
              onPress={() => setCategory(cat.id)}
              isActive={category === cat.id}
            />
          ))}
        </ScrollView>

        <Text style={styles.label}>Hourly Rate ($)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 25.00"
          placeholderTextColor="#666666"
          value={hourlyRate}
          onChangeText={setHourlyRate}
        />

        <Text style={styles.label}>Experience (Years)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 5"
          placeholderTextColor="#666666"
          value={experience}
          onChangeText={setExperience}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your expertise, certifications, and what you offer..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <Pressable
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#121212" /> : <Text style={styles.saveButtonText}>Save Role</Text>}
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
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
    borderBottomColor: '#333333'
  },
  backButton: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#FFC107' },
  container: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#FFC107' },
  categoryScroll: { marginBottom: 20 },
  categoryPill: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  categoryPillText: { color: '#A0A0A0', fontWeight: '500' },
  categoryPillTextActive: { color: '#121212' },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: '#FFFFFF'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#FFC107',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#121212', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { opacity: 0.7 },
});
