import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';
import LocationBanner from '../../Components/LocationBanner';
import { useAuthStore } from '../../store/useAuthStore';

export default function BookingFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingLocation } = useAuthStore();

  const [problemDescription, setProblemDescription] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!problemDescription.trim()) {
      Alert.alert('Error', 'Please describe the problem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        job_role: id,
        problem_description: problemDescription,
      };

      if (bookingLocation && bookingLocation.latitude && bookingLocation.longitude) {
        payload.latitude = bookingLocation.latitude;
        payload.longitude = bookingLocation.longitude;
        payload.address_text = bookingLocation.address_text;
      }

      if (negotiatedPrice.trim()) {
        payload.negotiated_price = parseFloat(negotiatedPrice);
      }
      if (preferredDate.trim()) {
        payload.preferred_date = preferredDate;
      }
      if (preferredTime.trim()) {
        payload.preferred_time = preferredTime;
      }

      await api.post('bookings/', payload);
      Alert.alert('Success', 'Booking request sent successfully!');
      // Navigate to activity tab
      router.replace('/(tabs)/activity');
    } catch (error: any) {
      console.error(error);
      let errMsg = 'Failed to submit booking request.';
      if (error.response?.data) {
        const data = error.response.data;
        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          errMsg = `${firstKey}: ${data[firstKey][0]}`;
        } else if (data.error) {
          errMsg = data.error;
        } else if (typeof data === 'string') {
          errMsg = data;
        }
      }
      Alert.alert('Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFC107" />
        </Pressable>
        <Text style={styles.title}>Book Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <LocationBanner mode="booking" />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.card}>
          <Text style={styles.label}>Describe the Problem / Job *</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <Ionicons name="clipboard-outline" size={20} color="#FFC107" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={problemDescription}
              onChangeText={setProblemDescription}
              placeholder="Please detail what needs to be done..."
              placeholderTextColor="#666666"
              multiline
              numberOfLines={5}
            />
          </View>

          <Text style={styles.label}>Offered Price (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#FFC107" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={negotiatedPrice}
              onChangeText={setNegotiatedPrice}
              placeholder="e.g. 50.00"
              placeholderTextColor="#666666"
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.label}>Preferred Date (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#FFC107" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={preferredDate}
              onChangeText={setPreferredDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666666"
            />
          </View>

          <Text style={styles.label}>Preferred Time (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="time-outline" size={20} color="#FFC107" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={preferredTime}
              onChangeText={setPreferredTime}
              placeholder="HH:MM"
              placeholderTextColor="#666666"
            />
          </View>

          <Pressable
            style={[styles.submitButton, isSubmitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <Text style={styles.submitButtonText}>Confirm Booking Request</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#FFC107' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFFFFF'
  },
  textArea: {
    height: 100,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FFC107',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabled: { opacity: 0.7 }
});
