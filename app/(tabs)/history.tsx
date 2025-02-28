import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { getAllJournalDates, getJournalEntryByDate } from '@/utils/storage';
import { formatDate, formatRelativeTime } from '@/utils/dateUtils';
import Colors from '@/constants/Colors';

type JournalPreview = {
  date: string;
  formattedDate: string;
  relativeTime: string;
  preview: string;
  messageCount: number;
};

export default function HistoryScreen() {
  const [journalPreviews, setJournalPreviews] = useState<JournalPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadJournalHistory();
  }, []);

  const loadJournalHistory = async () => {
    setIsLoading(true);
    try {
      const dates = await getAllJournalDates();
      
      // Sort dates in descending order (newest first)
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      const previews = await Promise.all(
        dates.map(async (date) => {
          const entries = await getJournalEntryByDate(date);
          
          // Get the first user message for preview
          const userMessages = entries.filter(entry => entry.isUser);
          const preview = userMessages.length > 0 
            ? userMessages[0].text.substring(0, 80) + (userMessages[0].text.length > 80 ? '...' : '')
            : 'No entries for this day';
          
          return {
            date,
            formattedDate: formatDate(new Date(date)),
            relativeTime: formatRelativeTime(new Date(date)),
            preview,
            messageCount: entries.filter(entry => entry.isUser).length,
          };
        })
      );
      
      setJournalPreviews(previews);
    } catch (error) {
      console.error('Failed to load journal history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJournalSelect = (date: string) => {
    router.push(`/journal/${date}`);
  };

  const renderJournalItem = ({ item, index }: { item: JournalPreview, index: number }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <TouchableOpacity
        style={styles.journalCard}
        onPress={() => handleJournalSelect(item.date)}
        activeOpacity={0.7}
      >
        <View style={styles.journalCardContent}>
          <View style={styles.journalCardHeader}>
            <Text style={styles.journalDate}>{item.formattedDate}</Text>
            <Text style={styles.journalRelativeTime}>{item.relativeTime}</Text>
          </View>
          <Text style={styles.journalPreview}>{item.preview}</Text>
          <View style={styles.journalCardFooter}>
            <Text style={styles.messageCount}>
              {item.messageCount} {item.messageCount === 1 ? 'entry' : 'entries'}
            </Text>
            <ChevronRight size={16} color={Colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View 
        entering={FadeInDown.duration(500)} 
        style={styles.header}
      >
        <Text style={styles.title}>Journal History</Text>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : journalPreviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No journal entries yet</Text>
          <Text style={styles.emptySubtext}>
            Your journal entries will appear here once you start writing.
          </Text>
        </View>
      ) : (
        <FlatList
          data={journalPreviews}
          renderItem={renderJournalItem}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  title: {
    fontSize: 28,
    color: Colors.text,
    marginTop: 4,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
  },
  journalCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  journalCardContent: {
    padding: 16,
  },
  journalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  journalRelativeTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  journalPreview: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  journalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});