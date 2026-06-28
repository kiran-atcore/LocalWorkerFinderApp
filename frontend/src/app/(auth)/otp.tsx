import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function OTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');

  const [resendTimer, setResendTimer] = useState(60);
  const [expiryTimer, setExpiryTimer] = useState(240); // 4 minutes

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/register');
    }
  }, [email]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (expiryTimer > 0) {
      interval = setInterval(() => {
        setExpiryTimer((prev) => prev - 1);
      }, 1000);
    } else {
      Alert.alert('OTP Expired', 'Please request a new OTP.');
    }
    return () => clearInterval(interval);
  }, [expiryTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('users/verify-otp/', { email, otp_code: otp });
      setAuth(response.data.user);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Verification failed. Please try again.';
      setError(errMsg);
      
      if (errMsg.includes('Max attempts reached') || errMsg.includes('expired')) {
        Alert.alert('Verification Failed', errMsg, [
          { text: 'OK', onPress: () => router.replace('/(auth)/register') }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await api.post('users/resend-otp/', { email });
      setResendTimer(60);
      setExpiryTimer(240);
      Alert.alert('Success', 'A new OTP has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to <Text style={styles.boldEmail}>{email}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>OTP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/[^0-9]/g, ''));
                  setError('');
                }}
              />
              <Text style={styles.expiryText}>Code expires in: {formatTime(expiryTimer)}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.verifyButton, (!otp || loading || expiryTimer === 0) && styles.buttonDisabled]} 
              onPress={handleVerify}
              disabled={!otp || loading || expiryTimer === 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimerText}>Resend in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerContainer: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 24 },
  boldEmail: { fontWeight: 'bold', color: '#1a1a1a' },
  formContainer: { width: '100%' },
  errorText: { color: '#FF3B30', marginBottom: 16, fontSize: 14 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, fontSize: 24, color: '#1a1a1a', borderWidth: 1, borderColor: '#e0e0e0', textAlign: 'center', letterSpacing: 8 },
  expiryText: { fontSize: 12, color: '#FF3B30', marginTop: 8, textAlign: 'right' },
  verifyButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  resendText: { fontSize: 14, color: '#666' },
  resendTimerText: { fontSize: 14, color: '#999', fontWeight: '500' },
  resendButtonText: { fontSize: 14, color: '#007AFF', fontWeight: '600' }
});
