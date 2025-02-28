export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  settings: {
    notifications: boolean;
    darkMode: boolean;
  };
  created_at: string;
  updated_at: string;
}

export type JournalEntry = {
  id: string;
  user_id: string;
  date: string;
  messages: Array<{
    text: string;
    isUser: boolean;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
} 