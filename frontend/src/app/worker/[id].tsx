import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Image } from 'expo-image';
import { Galeria } from '@nandorojo/galeria';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Loader } from '../../components/Loader';
import { ErrorText } from '../../components/ErrorText';
import { formatCurrency } from '../../utils/formatters';

export default function WorkerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { push } = useRouter();

  const { data: worker, isLoading, error } = useQuery({
    queryKey: ['worker', id],
    queryFn: async () => (await apiClient.get(`/services/workers/${id}/`)).data
  });

  if (isLoading) return <Loader />;
  if (error || !worker) return <ErrorText message="Failed to load worker profile." />;

  const portfolioUrls = worker.portfolio_images?.map((img: any) => img.image) || [];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{worker.user.first_name} {worker.user.last_name}</Text>
        <Text style={styles.rate}>{formatCurrency(Number(worker.hourly_rate))}/hr</Text>
        <Text style={styles.bio}>{worker.bio}</Text>
      </View>

      {portfolioUrls.length > 0 ? (
        <View style={styles.galleryContainer}>
          <Text style={styles.galleryTitle}>Portfolio</Text>
          <Galeria urls={portfolioUrls}>
            <View style={styles.imageGrid}>
              {portfolioUrls.map((url: string, index: number) => (
                <Galeria.Image index={index} key={url}>
                  <Image source={{ uri: url }} style={styles.thumbnail} contentFit="cover" />
                </Galeria.Image>
              ))}
            </View>
          </Galeria>
        </View>
      ) : null}

      <View style={styles.footer}>
        <PrimaryButton title="Request Booking" onPress={() => push(`/book/${id}`)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', gap: 8 },
  name: { fontSize: 26, fontWeight: '700' },
  rate: { fontSize: 18, color: '#007AFF', fontWeight: 'bold' },
  bio: { fontSize: 16, color: '#444', marginTop: 8 },
  galleryContainer: { padding: 24, gap: 16 },
  galleryTitle: { fontSize: 20, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbnail: { width: 100, height: 100, borderRadius: 8, borderCurve: 'continuous' },
  footer: { padding: 24 }
});