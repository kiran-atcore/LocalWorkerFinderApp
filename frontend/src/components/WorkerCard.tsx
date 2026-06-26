import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getImageUrl } from '../services/axios';
import { CATEGORIES } from '../constants/categories';

interface WorkerCardProps {
  worker: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
    };
    profile_photo?: string;
    business_name?: string;
    rating: number;
    categories: string[];
  };
  distance?: number;
}

export default function WorkerCard({ worker, distance }: WorkerCardProps) {
  const router = useRouter();

  const handlePress = () => {
    // Route to WorkerProfileView passing the User ID
    router.push(`/WorkerProfileView/${worker.user.id}` as any);
  };

  const displayName = worker.business_name || `${worker.user.first_name} ${worker.user.last_name}`.trim() || 'Worker';

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        {worker.profile_photo ? (
          <Image source={{ uri: getImageUrl(worker.profile_photo) as string }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f1c40f" />
            <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
            {distance !== undefined && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Ionicons name="location" size={14} color="#7f8c8d" />
                <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
              </>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.categoriesContainer}>
        {worker.categories.slice(0, 3).map((catId, index) => {
          const catInfo = CATEGORIES.find(c => c.id === catId || c.name === catId);
          return (
            <View key={index} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{catInfo ? catInfo.name : catId}</Text>
            </View>
          );
        })}
        {worker.categories.length > 3 && (
          <View style={styles.categoryChipMore}>
            <Text style={styles.categoryChipTextMore}>...</Text>
          </View>
        )}
        {worker.categories.length === 0 && (
          <Text style={styles.noCategoryText}>General Services</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 4,
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 14,
    color: '#bdc3c7',
    marginHorizontal: 8,
  },
  distanceText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryChipText: {
    color: '#0288d1',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipMore: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryChipTextMore: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  noCategoryText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
});
