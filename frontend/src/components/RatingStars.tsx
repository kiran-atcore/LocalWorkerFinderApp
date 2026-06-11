import { View, Text, StyleSheet } from 'react-native';

export function RatingStars({ rating }: { rating: number }) {
  if (typeof rating !== 'number') return null;

  return (
    <View style={styles.container}>
      <Text style={styles.star}>★</Text>
      <Text style={styles.text}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontWeight: 'bold', color: '#FFD700', fontSize: 16 },
  text: { fontWeight: '600', color: '#444', fontSize: 14 }
});