import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'exp://192.168.29.137:8081',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url);
        
        if (result.type === 'success') {
          // After successful OAuth, manually set the session
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: result.url.split('access_token=')[1].split('&')[0],
            refresh_token: result.url.split('refresh_token=')[1].split('&')[0],
          });

          if (sessionError) throw sessionError;

          if (session) {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(300)} 
        style={styles.content}
      >
        {/* App Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Happy Mind</Text>
          <Text style={styles.subtitle}>Your AI journal companion</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.cardContainer}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.welcomeSubtext}>
            Sign in to continue your journaling journey
          </Text>

          {/* Google Sign In Button */}
          <TouchableOpacity 
            style={[
              styles.googleButton,
              isLoading && styles.googleButtonDisabled
            ]}
            activeOpacity={0.7}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image 
              source={require('@/assets/images/google-icon.png')} 
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms and Privacy Section */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
          </Text>
          <TouchableOpacity>
            <Text style={styles.termsLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> & </Text>
          <TouchableOpacity>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Version Number */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFF',
    width: '100%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    width: '100%',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  termsLink: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
}); 