import { Text, StyleSheet } from 'react-native';

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  
  return (
    <Text style={styles.error}>{message}</Text>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#D32F2F', // Softer red for better accessibility
    fontSize: 12,
    fontWeight: '500',
  }
});