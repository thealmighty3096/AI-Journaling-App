import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import config from './config';

if (!config.supabase.url || !config.supabase.anonKey) {
  console.warn('Supabase configuration missing. Some features may not work.');
}

export const supabase = createClient(
  config.supabase.url || '', // Provide fallback empty string
  config.supabase.anonKey || '', // Provide fallback empty string
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
); 