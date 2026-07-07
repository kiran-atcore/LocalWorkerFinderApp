import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Pressable, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import GoogleLogin from '../../Components/GoogleLogin';
import { LinearGradient } from 'expo-linear-gradient';

const registerSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, 'Full name must be at least 2 characters.')
    .required('Full name is required.'),
  email: Yup.string()
    .email('Please enter a valid email address.')
    .required('Email is required.'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .required('Password is required.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'Passwords must match.')
    .required('Please confirm your password.'),
});

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [globalError, setGlobalError] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    setGlobalError('');
    try {
      await api.get('users/csrf/');
      const payload = {
        full_name: data.fullName,
        email: data.email,
        password: data.password
      };

      const response = await api.post('users/register/', payload);

      router.replace({
        pathname: '/(auth)/otp',
        params: { email: data.email }
      });
    } catch (error: any) {
      if (error.response?.data) {
        setGlobalError(JSON.stringify(error.response.data));
      } else {
        setGlobalError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <LinearGradient colors={['#121212', '#121212']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.spacer} />

            <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              <View style={styles.headerContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Sign up to get started</Text>
              </View>

              {globalError ? <Text style={styles.globalErrorText}>{globalError}</Text> : null}

              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={[styles.input, errors.fullName && styles.inputError]}
                      placeholder="John Doe"
                      placeholderTextColor="#666666"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="words"
                    />
                    {errors.fullName ? <Text style={styles.errorText}>{errors.fullName.message}</Text> : null}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="example@mail.com"
                      placeholderTextColor="#666666"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={[styles.input, errors.password && styles.inputError]}
                      placeholder="Create a password"
                      placeholderTextColor="#666666"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                    />
                    {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <TextInput
                      style={[styles.input, errors.confirmPassword && styles.inputError]}
                      placeholder="Confirm your password"
                      placeholderTextColor="#666666"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                    />
                    {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword.message}</Text> : null}
                  </View>
                )}
              />

              <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 20 }}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={isSubmitting ? ['#7A6000', '#7A6000'] : ['#FFC107', '#FFB300']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#121212" />
                    ) : (
                      <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialContainer}>
                <GoogleLogin type="register" />
              </View>

              <Pressable style={styles.linkButton} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Log In</Text></Text>
              </Pressable>

            </Animated.View>

            <View style={styles.spacer} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  headerContainer: {
    marginBottom: 35,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFC107',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0A0A0',
    fontWeight: '500',
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
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#2A1010',
  },
  globalErrorText: {
    color: '#FF6B6B',
    backgroundColor: '#2A1010',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    textAlign: 'center',
    overflow: 'hidden',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 6,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#121212',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  socialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  linkButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#FFC107',
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginTop: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
  }
});
