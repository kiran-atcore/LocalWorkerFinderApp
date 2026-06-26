import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CategoryCardProps {
  id: string;
  name: string;
  iconName: any;
  iconFamily?: 'Ionicons' | 'MaterialIcons' | 'FontAwesome5' | 'MaterialCommunityIcons';
  color?: string;
  onPress?: () => void;
  isActive?: boolean;
}

export default function CategoryCard({ id, name, iconName, iconFamily = 'Ionicons', color = '#007AFF', onPress, isActive = false }: CategoryCardProps) {
  const router = useRouter();

  const renderIcon = () => {
    switch (iconFamily) {
      case 'MaterialIcons':
        return <MaterialIcons name={iconName} size={28} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={28} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName} size={28} color={color} />;
      case 'Ionicons':
      default:
        return <Ionicons name={iconName} size={28} color={color} />;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      (router.push as any)(`/CategoryList/${id}`);
    }
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        isActive && styles.activeCard,
        pressed && styles.pressed
      ]}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {renderIcon()}
      </View>
      <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 85,
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCard: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  }
});
