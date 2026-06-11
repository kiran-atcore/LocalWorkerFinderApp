import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { RatingStars } from './RatingStars';

interface WorkerCardProps {
  name: string;
  category: string;
  hourlyRate?: number | string;
  rating?: number;
  avatarUrl?: string;
}

export function WorkerCard({ name, category, hourlyRate, rating = 0, avatarUrl }: WorkerCardProps) {
  return (
    <View style={styles.card}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.category}>{category}</Text>
        <View style={styles.footer}>
          {hourlyRate ? <Text style={styles.rate}>${hourlyRate}/hr</Text> : null}
          <RatingStars rating={rating} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 12, borderCurve: 'continuous', flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  placeholder: { backgroundColor: '#e5e5e5' },
  info: { flex: 1, gap: 4 },
  name: { fontWeight: '600', fontSize: 18, color: '#111' },
  category: { color: '#666', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  rate: { color: '#007AFF', fontWeight: 'bold', fontSize: 15 },
});