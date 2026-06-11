import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { bookingSchema } from '../../schemas/bookingSchema';
import { ControlledInput } from '../../components/ControlledInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorText } from '../../components/ErrorText';
import { jobService } from '../../services/jobService';

export default function BookingFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { push } = useRouter();

  const { control, handleSubmit, setError, formState: { isSubmitting, errors } } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: { date: '', time: '', address: '', description: '' }
  });

  const onSubmit = async (data: any) => {
    try {
      await jobService.createJob({ ...data, worker: id });
      push('/(tabs)/bookings' as any);
    } catch (error: any) {
      setError('root', { message: error.response?.data?.detail || 'Failed to request booking.' });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Book Worker</Text>
        {errors.root ? <ErrorText message={errors.root.message} /> : null}

        <ControlledInput control={control} name="date" label="Date (YYYY-MM-DD)" />
        <ControlledInput control={control} name="time" label="Time (HH:MM)" />
        <ControlledInput control={control} name="address" label="Address" />
        <ControlledInput control={control} name="description" label="Description of work" multiline numberOfLines={4} textAlignVertical="top" />

        <PrimaryButton title={isSubmitting ? "Submitting..." : "Submit Request"} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, justifyContent: 'center', flexGrow: 1, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 }
});