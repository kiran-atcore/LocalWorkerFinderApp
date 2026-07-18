import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/axios';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestOTP = async () => {
    if (!email) {
      setError('Please enter your email ID.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('users/forgot-password/', { email });
      setStep(2);
      setResendTimer(60);
      Alert.alert('OTP Sent', `A verification code has been sent to ${email}`);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to send OTP. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await api.post('users/forgot-password/', { email });
      setResendTimer(60);
      Alert.alert('Success', 'A new OTP has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await api.post('users/verify-reset-otp/', { email, otp_code: otp });
      setStep(3);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Invalid OTP. Please try again.';
      setError(errMsg);
      if (errMsg.includes('Max attempts reached') || errMsg.includes('expired')) {
        Alert.alert('Verification Failed', errMsg, [
          { text: 'Try Again', onPress: () => setStep(1) }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.post('users/reset-password/', { 
        email, 
        otp_code: otp, 
        new_password: newPassword 
      });
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'Log In', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to reset password. Please try again.';
      setError(errMsg);
      
      if (errMsg.includes('Max attempts reached') || errMsg.includes('expired')) {
        Alert.alert('Verification Failed', errMsg, [
          { text: 'Try Again', onPress: () => setStep(1) }
        ]);
      }
    } finally {
      setLoading(false);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>
                {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 
                  ? 'Enter your email ID to receive a verification code.' 
                  : step === 2 
                  ? `Enter the code sent to ${email}`
                  : 'Set your new password.'}
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {step === 1 && (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email ID"
                    placeholderTextColor="#666666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRequestOTP}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#7A6000', '#7A6000'] : ['#FFC107', '#FFB300']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Verification Code (OTP)</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 10 }]}
                    placeholder="------"
                    placeholderTextColor="#666666"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      setError('');
                    }}
                  />
                </View>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the code? </Text>
                  {resendTimer > 0 ? (
                    <Text style={styles.timerText}>Wait {formatTime(resendTimer)}</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                      {resendLoading ? (
                        <ActivityIndicator size="small" color="#FFC107" />
                      ) : (
                        <Text style={styles.resendLink}>Resend OTP</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#7A6000', '#7A6000'] : ['#FFC107', '#FFB300']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                  <Text style={styles.backButtonText}>Use a different email</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#666666"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setError('');
                    }}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Re-enter New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#666666"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setError('');
                    }}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#7A6000', '#7A6000'] : ['#FFC107', '#FFB300']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                  <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 35,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFC107',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#A0A0A0',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 8,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 20,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  button: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF6B6B',
    backgroundColor: '#2A1010',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    textAlign: 'center',
    overflow: 'hidden',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -5,
  },
  resendText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  timerText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendLink: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
  },
});