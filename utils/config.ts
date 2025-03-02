import Constants from 'expo-constants';

// Get environment variables from Expo config
const extra = Constants.expoConfig?.extra;

// Server-side only configuration
const config = {
  supabase: {
    url: extra?.SUPABASE_URL || process.env['SUPABASE_URL'] || '',
    anonKey: extra?.SUPABASE_ANON_KEY || process.env['SUPABASE_ANON_KEY'] || '',
  },
  openai: {
    apiKey: extra?.OPENAI_API_KEY || process.env['OPENAI_API_KEY'] || '',
  }
};

// Validate required environment variables
const requiredVars = [
  ['SUPABASE_URL', config.supabase.url],
  ['SUPABASE_ANON_KEY', config.supabase.anonKey],
  ['OPENAI_API_KEY', config.openai.apiKey],
];

for (const [name, value] of requiredVars) {
  if (!value) {
    console.warn(`Missing required environment variable: ${name}`);
  }
}

export default config; 