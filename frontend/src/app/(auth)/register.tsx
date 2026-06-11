import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../../schemas/authSchemas';
import { ControlledInput } from '../../components/ControlledInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorText } from '../../components/ErrorText';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useRouter, Link } from 'expo-router';

export default function RegisterScreen() {
  const { replace } = useRouter();
  const setUser = useAuth((s) => s.setUser);

  const { control, handleSubmit, setError, formState: { isSubmitting, errors } } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', first_name: '', last_name: '', role: 'Client', phone_number: '' }
  });

  const onSubmit = async (data: any) => {
    try {
      await authService.getCSRF();
      const response = await authService.register(data);
      setUser(response.data);
      replace('/' as any);
    } catch (error: any) {
      setError('root', { message: error.response?.data?.detail || 'Registration failed' });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        {errors.root ? <ErrorText message={errors.root.message} /> : null}

        <ControlledInput control={control} name="username" label="Username" autoCapitalize="none" />
        <ControlledInput control={control} name="email" label="Email" autoCapitalize="none" keyboardType="email-address" />
        <ControlledInput control={control} name="password" label="Password" secureTextEntry />
        <ControlledInput control={control} name="first_name" label="First Name" />
        <ControlledInput control={control} name="last_name" label="Last Name" />
        <ControlledInput control={control} name="role" label="Role (Client or Worker)" autoCapitalize="words" />
        <ControlledInput control={control} name="phone_number" label="Phone Number" keyboardType="phone-pad" />

        <PrimaryButton title={isSubmitting ? "Registering..." : "Register"} onPress={handleSubmit(onSubmit)} />

        <Link href={"/(auth)/login" as any} style={styles.link}>Already have an account? Login</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  link: { textAlign: 'center', marginTop: 16, color: '#007AFF', fontWeight: '600' }
});