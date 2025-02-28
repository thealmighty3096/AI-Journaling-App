# AI Journal - Personal Well-being Assistant

AI Journal is a mobile application that serves as your personal well-being assistant, helping you reflect on your thoughts and feelings through daily journaling.

## Features

- **Daily Journaling**: Chat-like interface for recording your thoughts and feelings
- **AI-Powered Responses**: Empathetic and supportive AI responses powered by OpenAI
- **Journal History**: Review past entries organized by date
- **Privacy-Focused**: All data stored locally on your device

## Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your API keys:
- EXPO_PUBLIC_OPENAI_API_KEY: Get from [OpenAI Dashboard](https://platform.openai.com/api-keys)
- EXPO_PUBLIC_SUPABASE_URL: Get from your Supabase project settings
- EXPO_PUBLIC_SUPABASE_ANON_KEY: Get from your Supabase project settings

Note: Never commit `.env.local` to version control as it contains sensitive information.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Technology Stack

- React Native with Expo
- Expo Router for navigation
- OpenAI API for intelligent responses
- AsyncStorage for local data persistence
- React Native Reanimated for smooth animations

## How It Works

The app uses the OpenAI API to generate empathetic and supportive responses to your journal entries. The AI is designed to act as a personal well-being assistant, helping you reflect on your thoughts and feelings in a safe, non-judgmental space.

If the OpenAI API key is not configured, the app will fall back to using pre-defined responses based on sentiment analysis.

## Privacy

All journal entries are stored locally on your device. No data is sent to any server except for the text sent to OpenAI for generating responses.