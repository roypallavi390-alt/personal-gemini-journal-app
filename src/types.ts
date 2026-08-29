export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  keyTakeaways?: string[];
  mood?: 'calm' | 'inspired' | 'reflective' | 'anxious' | 'energized' | 'grateful' | 'overwhelmed' | 'neutral';
  tags?: string[];
  messages: ChatMessage[];
  mode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalInsight {
  id: string;
  userId: string;
  period: string;
  summary: string;
  weeklyThemes: {
    theme: string;
    description: string;
    sentiment: 'positive' | 'neutral' | 'reflective' | 'growth';
  }[];
  recurringTopics: string[];
  emotionalTrends: string;
  growthPrompts: string[];
  breakthroughMoments?: string[];
  analyzedEntriesCount: number;
  createdAt: string;
}

export interface JournalMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  starterPrompt: string;
  systemPromptAddition: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  createdAt: string;
}
