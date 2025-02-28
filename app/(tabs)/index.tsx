import { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { formatDate } from '@/utils/dateUtils';
import { saveJournalEntry, getTodayEntry } from '@/utils/storage';
import Colors from '@/constants/Colors';
import { generateAIResponse, isOpenAIConfigured } from '@/utils/aiUtils';
import { supabase } from '@/utils/supabase';

export default function TodayScreen() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{text: string, isUser: boolean, timestamp: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [todayDate, setTodayDate] = useState('');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTodayDate(formatDate(new Date()));
    checkApiKey();
    loadTodayConversation();

    const channel = supabase
      .channel('journal_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${supabase.auth.getUser()?.data?.user?.id}`
        },
        () => {
          loadTodayConversation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkApiKey = () => {
    const isConfigured = isOpenAIConfigured();
    setApiKeyMissing(!isConfigured);
    
    if (!isConfigured) {
      console.log("OpenAI API key is not configured. Using fallback responses.");
    }
  };

  const loadTodayConversation = async () => {
    try {
      const savedConversation = await getTodayEntry();
      
      if (!savedConversation || savedConversation.length === 0) {
        // If no conversation exists for today, start with AI greeting
        const initialGreeting = {
          text: "Hello! I'm your AI journaling assistant. How are you feeling today? I'm here to listen and help you reflect on your thoughts and feelings. 🌟",
          isUser: false,
          timestamp: new Date().toISOString()
        };
        
        await saveJournalEntry([initialGreeting]);
        setConversation([initialGreeting]);
      } else {
        setConversation(savedConversation);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (message.trim() === '') return;
    
    const userMessage = { 
      text: message, 
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    setMessage('');
    setIsSending(true);
    
    try {
      // Get latest conversation and update locally first
      const currentConversation = await getTodayEntry();
      const updatedConversation = [...currentConversation, userMessage];
      setConversation(updatedConversation);
      
      // Save the user message
      await saveJournalEntry(updatedConversation);
      
      // Scroll to bottom after user message
      scrollViewRef.current?.scrollToEnd({ animated: true });
      
      // Generate AI response
      const aiResponse = await generateAIResponse(message, currentConversation);
      const aiMessage = { 
        text: aiResponse, 
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      // Update conversation with AI response
      const finalConversation = [...updatedConversation, aiMessage];
      setConversation(finalConversation);
      
      // Save the complete conversation including AI response
      await saveJournalEntry(finalConversation);
      
    } catch (error) {
      console.error('Error in conversation:', error);
      const errorMessage = { 
        text: "I'm having trouble responding right now. Let's continue our conversation a bit later.", 
        isUser: false,
        timestamp: new Date().toISOString()
      };
      const errorConversation = [...await getTodayEntry(), errorMessage];
      setConversation(errorConversation);
      await saveJournalEntry(errorConversation);
    } finally {
      setIsSending(false);
      // Scroll to bottom after response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View 
        entering={FadeInDown.duration(500)} 
        style={styles.header}
      >
        <Text style={styles.dateText}>{todayDate}</Text>
        <Text style={styles.title}>Journal</Text>
        {apiKeyMissing && (
          <Text style={styles.apiWarning}>Using fallback AI (OpenAI API key not configured)</Text>
        )}
      </Animated.View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {conversation.map((entry, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.duration(300).delay(index * 50)}
              style={[
                styles.messageBubble,
                entry.isUser ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text style={[
                styles.messageText,
                entry.isUser ? styles.userText : styles.aiText
              ]}>
                {entry.text}
              </Text>
            </Animated.View>
          ))}
          
          {isSending && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}
            >
              <ActivityIndicator color={Colors.primary} />
            </Animated.View>
          )}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Share your thoughts..."
            placeholderTextColor={Colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled
            ]} 
            onPress={handleSend}
            disabled={!message.trim() || isSending}
          >
            <Send size={20} color={!message.trim() ? Colors.textSecondary : Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    color: Colors.text,
    fontWeight: 'bold',
  },
  apiWarning: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.cardBackground,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  aiText: {
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    fontSize: 16,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});