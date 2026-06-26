import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { verifyGoogleToken } from '../services/google';
import { useRouter } from 'expo-router';

// Configure Google Sign-In with the Web Client ID
// Native Android automatically uses the Web Client ID config to fetch the idToken securely
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  // offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
});

export default function GoogleLogin({ type = 'register' }: { type?: 'login' | 'register' }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onPress = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      try {
        // Force account chooser by signing out first
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore error if not signed in
      }
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (idToken) {
           await handleGoogleAuth(idToken);
        } else {
           Alert.alert('Error', 'No ID token found');
           setLoading(false);
        }
      } else {
        // sign in was cancelled by user
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Play Services not available or outdated');
            break;
          default:
             Alert.alert('Google Auth Error', error.message);
        }
      } else {
        Alert.alert('Google Auth Error', error.message || 'Authentication failed');
      }
    }
  };

  const handleGoogleAuth = async (idToken: string) => {
    const res = await verifyGoogleToken(idToken);
    setLoading(false);
    
    if (res.success) {
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Authentication Failed', res.error || 'Failed to authenticate with backend');
    }
  };

  return (
    <Pressable style={styles.button} onPress={onPress} disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#333" />
      ) : (
        <>
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' }} 
            style={styles.icon} 
          />
          <Text style={styles.text}>
            {type === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  text: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
