import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient colors={['#121212', '#121212']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
                placeholderTextColor="#666666"
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
                <ActivityIndicator color="#121212" />
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
                    <ActivityIndicator size="small" color="#FFC107" />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerContainer: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFC107', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#A0A0A0', lineHeight: 24 },
  boldEmail: { fontWeight: 'bold', color: '#FFC107' },
  formContainer: { width: '100%' },
  errorText: { color: '#FF6B6B', marginBottom: 16, fontSize: 14 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#A0A0A0', marginBottom: 8 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 16, fontSize: 24, color: '#FFFFFF', borderWidth: 1, borderColor: '#333333', textAlign: 'center', letterSpacing: 8 },
  expiryText: { fontSize: 12, color: '#FF6B6B', marginTop: 8, textAlign: 'right' },
  verifyButton: { backgroundColor: '#FFC107', borderRadius: 30, padding: 18, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#FFC107', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  buttonDisabled: { opacity: 0.5 },
  verifyButtonText: { color: '#121212', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  resendText: { fontSize: 14, color: '#A0A0A0' },
  resendTimerText: { fontSize: 14, color: '#999', fontWeight: '500' },
  resendButtonText: { fontSize: 14, color: '#FFC107', fontWeight: '700' }
});
