import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../../schemas/authSchemas';
import { ControlledInput } from '../../components/ControlledInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorText } from '../../components/ErrorText';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useRouter, Link } from 'expo-router';

export default function LoginScreen() {
  const { replace } = useRouter();
  const setUser = useAuth((s) => s.setUser);

  const { control, handleSubmit, setError, formState: { isSubmitting, errors } } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  });

  const onSubmit = async (data: any) => {
    try {
      await authService.getCSRF(); // Establish CSRF token session
      const response = await authService.login(data);
      setUser(response.data.user);
      replace('/(tabs)/home' as any); // Native stack replacement
    } catch (error: any) {
      setError('root', { message: error.response?.data?.detail || 'Login failed' });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        {errors.root ? <ErrorText message={errors.root.message} /> : null}

        <ControlledInput control={control} name="username" label="Username" autoCapitalize="none" />
        <ControlledInput control={control} name="password" label="Password" secureTextEntry />

        <PrimaryButton title={isSubmitting ? "Logging in..." : "Login"} onPress={handleSubmit(onSubmit)} />

        <Link href={"/(auth)/register" as any} style={styles.link}>Don't have an account? Register</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, justifyContent: 'center', flexGrow: 1, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  link: { textAlign: 'center', marginTop: 16, color: '#007AFF', fontWeight: '600' }
});