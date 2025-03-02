import OpenAI from 'openai';
import Constants from 'expo-constants';
import config from './config';


//constants
const systemPrompt = `You are a thoughtful, empathetic, and delightfully engaging journaling companion designed to help users process their thoughts, feelings, and experiences. Your primary role is to create a safe, judgment-free space where users can reflect on their lives with the guidance of a supportive friend who knows when to be playful and when to be serious.

Core Principles:
- Be warm, genuine, and present in each interaction
- Mirror the user's energy and emotional state - be upbeat and fun when they are, calm and steady when they need stability
- Use appropriate emojis to add personality and emotional resonance to your responses
- Listen attentively and respond to the emotions beneath the words
- Encourage self-reflection without imposing solutions
- Remember important details from previous conversations
- Balance compassion with gentle encouragement when appropriate

Conversation Style:
- Adapt your tone, vocabulary, and emoji usage to match the user's communication style
- For casual, lighthearted entries, respond with humor, playfulness, and celebratory emojis (🎉, 😊, ✨, 🙌)
- For serious reflections, shift to a more grounded tone with thoughtful, supportive expressions (💭, 🤔, 💪, 🫂)
- For difficult emotions, use empathetic responses with comforting emojis (❤️, 🫂, 🌱, 🌈)
- Ask thoughtful follow-up questions that deepen reflection
- Validate user experiences without making assumptions
- Share occasional insights or gentle reframes when they might help perspective
- Use conversational language that feels like texting with a friend, not like receiving therapy

When users share successes:
- Celebrate their wins with enthusiasm and appropriate celebratory emojis (🎉, 🥳, 🏆, ⭐)
- Help them identify what worked well and why
- Encourage them to acknowledge their own role in positive outcomes
- Match their excitement with upbeat language

When users share challenges:
- Offer genuine empathy first, before any suggestions
- Help them explore the situation from different angles
- When appropriate, guide them toward their own solutions with encouraging emojis (💡, 🌱, 🧭)
- Remind them of past strengths they've demonstrated
- Use hopeful, resilience-focused language and imagery

For regular journaling:
- Help users notice patterns in their thoughts, feelings, and behaviors
- Encourage gratitude and awareness of positive moments with bright emojis (✨, 🌟, 🙏)
- Support meaning-making and values-aligned reflection
- Gently bring attention to growth over time
- Keep conversations fresh by varying your responses and approaches

Important notes:
- Never be judgmental, preachy, or overly directive
- Respect the user's pace and readiness for deeper reflection
- Balance positive psychology with realistic acknowledgment of life's challenges
- If a user expresses serious distress, acknowledge your limitations and suggest professional support when appropriate
- Remember that your primary value is in creating a space for authentic reflection, not in providing answers
- Be adaptable - if your style isn't resonating with a user, adjust your approach

Begin each conversation with genuine interest in the user's current state (using an appropriate greeting emoji), and end with a note of encouragement or a thoughtful question that inspires continued reflection (paired with a fitting emoji).`;







type JournalEntry = {
  text: string;
  isUser: boolean;
};

// Initialize OpenAI client with fallback to ensure it doesn't crash
const getOpenAIClient = () => {
  try {
    const apiKey = Constants.expoConfig?.extra?.openAiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    // Don't initialize with invalid API keys
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return null;
    }
    
    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for React Native web
    });
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return null;
  }
};

const openai = new OpenAI({
  apiKey: config.openai.apiKey || '', // Provide fallback empty string
  dangerouslyAllowBrowser: true // Required for React Native web
});

// Fallback responses in case API calls fail
const fallbackResponses = {
  positive: [
    "I'm glad to hear you're feeling good! What's been contributing to your positive mood?",
    "That's wonderful! Celebrating these positive moments is important. Would you like to reflect on what made today special?",
    "It's great that you're in a positive state. How can you carry this energy forward into tomorrow?",
    "I'm happy for you! Taking note of what brings you joy can help you create more of these moments.",
    "That's excellent news. Is there something specific you'd like to focus on to maintain this positive feeling?"
  ],
  neutral: [
    "Thank you for sharing. How would you like to use our conversation today?",
    "I appreciate you taking time to journal. Is there anything specific on your mind that you'd like to explore?",
    "Journaling regularly is a great habit. Is there a particular area of your life you'd like to reflect on today?",
    "I'm here to listen. Would you like to dive deeper into any particular thoughts or feelings?",
    "Thanks for checking in. Is there something specific you'd like guidance or perspective on today?"
  ],
  challenging: [
    "I'm sorry to hear you're going through a difficult time. Would it help to talk more about what's troubling you?",
    "That sounds challenging. Remember that it's okay to have these feelings. What do you think might help you feel a bit better?",
    "I hear that you're struggling. Sometimes naming our emotions can help us process them. Can you describe what you're feeling?",
    "Thank you for sharing something difficult. Is there a small step you could take today that might bring some relief?",
    "It takes courage to acknowledge challenging feelings. Would it help to explore some coping strategies together?"
  ],
  followUp: [
    "Thank you for sharing that. How does talking about this make you feel?",
    "I appreciate your openness. Is there more you'd like to explore about this topic?",
    "That's insightful. What do you think would be a good next step for you?",
    "I understand. Sometimes just putting thoughts into words can bring clarity. Has this been helpful?",
    "Thank you for trusting me with your thoughts. Is there anything else on your mind today?"
  ]
};

// Function to get a random response from an array
const getRandomResponse = (responses: string[]): string => {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// Function to analyze text sentiment (simplified fallback)
const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'challenging' => {
  const positiveWords = ['happy', 'good', 'great', 'excellent', 'joy', 'excited', 'love', 'wonderful', 'amazing', 'fantastic'];
  const challengingWords = ['sad', 'bad', 'terrible', 'awful', 'depressed', 'anxious', 'worried', 'stress', 'angry', 'upset', 'hate', 'difficult', 'hard', 'struggle'];
  
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let challengingCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  challengingWords.forEach(word => {
    if (lowerText.includes(word)) challengingCount++;
  });
  
  if (positiveCount > challengingCount) return 'positive';
  if (challengingCount > positiveCount) return 'challenging';
  return 'neutral';
};

// Create a system message for the AI
const createSystemMessage = () => {
  return {
    role: "system",

       
    content: systemPrompt
    
  };
};

// Format conversation history for OpenAI
const formatConversationHistory = (conversation: JournalEntry[]) => {
  return conversation.map(entry => ({
    role: entry.isUser ? "user" : "assistant",
    content: entry.text
  }));
};

// Generate a fallback response
const generateFallbackResponse = (userMessage: string, conversation: JournalEntry[]): string => {
  const isFollowUp = conversation.filter(entry => entry.isUser).length > 1;
  
  if (isFollowUp) {
    return getRandomResponse(fallbackResponses.followUp);
  }
  
  const sentiment = analyzeSentiment(userMessage);
  
  switch (sentiment) {
    case 'positive':
      return getRandomResponse(fallbackResponses.positive);
    case 'challenging':
      return getRandomResponse(fallbackResponses.challenging);
    default:
      return getRandomResponse(fallbackResponses.neutral);
  }
};

// Main function to generate AI response
export const generateAIResponse = async (
  userMessage: string,
  conversation: JournalEntry[]
): Promise<string> => {
  // If OpenAI client isn't available, use fallback responses
  if (!openai) {
    return generateFallbackResponse(userMessage, conversation);
  }
  
  try {
    // Format the conversation history for OpenAI
    const messages = [
      createSystemMessage(),
      ...formatConversationHistory(conversation),
      { role: "user", content: userMessage }
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
    });

    // Return the AI response
    return response.choices[0]?.message?.content || "I'm not sure how to respond to that. Could you try expressing that differently?";
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return generateFallbackResponse(userMessage, conversation);
  }
};

// Function to check if OpenAI API is properly configured
export const isOpenAIConfigured = (): boolean => {
  return openai !== null;
};