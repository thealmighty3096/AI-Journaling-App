import { supabase } from './supabase';
import { formatDateForStorage } from './dateUtils';
import { JournalEntry } from '@/types/supabase';

export async function saveJournalEntry(messages: Array<{ text: string; isUser: boolean; timestamp: string }>) {
  const date = formatDateForStorage(new Date());
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) throw new Error('No authenticated user');

  try {
    // Use upsert instead of separate insert/update
    const { error } = await supabase
      .from('journal_entries')
      .upsert(
        {
          user_id: userId,
          date,
          messages,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    throw error;
  }
}

export async function getJournalEntryByDate(date: string) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('messages')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Fetch error:', error);
      return [];
    }

    return data?.messages || [];
  } catch (error) {
    console.error('Error getting journal entry:', error);
    return [];
  }
}

export async function getTodayEntry() {
  const date = formatDateForStorage(new Date());
  return getJournalEntryByDate(date);
}

export async function getAllJournalDates() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return [];
    }

    return data.map(entry => entry.date);
  } catch (error) {
    console.error('Error getting journal dates:', error);
    return [];
  }
}

export async function clearAllJournalEntries() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) throw new Error('No authenticated user');

  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error clearing journal entries:', error);
    throw error;
  }
}