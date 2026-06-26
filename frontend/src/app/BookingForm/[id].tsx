import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
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
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>Book Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <LocationBanner mode="booking" />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.card}>
          <Text style={styles.label}>Describe the Problem / Job *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={problemDescription}
            onChangeText={setProblemDescription}
            placeholder="Please detail what needs to be done..."
            multiline
            numberOfLines={5}
          />

          <Text style={styles.label}>Offered Price (Optional)</Text>
          <TextInput
            style={styles.input}
            value={negotiatedPrice}
            onChangeText={setNegotiatedPrice}
            placeholder="e.g. 50.00"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Preferred Date (Optional)</Text>
          <TextInput
            style={styles.input}
            value={preferredDate}
            onChangeText={setPreferredDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Preferred Time (Optional)</Text>
          <TextInput
            style={styles.input}
            value={preferredTime}
            onChangeText={setPreferredTime}
            placeholder="HH:MM:SS or HH:MM"
          />

          <Pressable 
            style={[styles.submitButton, isSubmitting && styles.disabled]} 
            onPress={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Confirm Booking Request</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: { padding: 5 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  container: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#34c759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabled: { opacity: 0.7 }
});
