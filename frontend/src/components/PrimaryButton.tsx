import { Pressable, Text, StyleSheet } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ title, onPress, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable 
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  disabled: { backgroundColor: '#999' },
  pressed: { opacity: 0.8 },
  text: { color: 'white', fontWeight: '600' },
});