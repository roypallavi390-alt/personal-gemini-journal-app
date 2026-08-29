import { ChatMessage, JournalEntry, JournalInsight } from '../types';

export interface SummarizeResponse {
  title: string;
  summary: string;
  keyTakeaways: string[];
  mood: 'calm' | 'inspired' | 'reflective' | 'anxious' | 'energized' | 'grateful' | 'overwhelmed' | 'neutral';
  tags: string[];
}

export async function sendChatMessage(
  messages: ChatMessage[],
  mode: string,
  modeInstruction?: string
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, mode, modeInstruction }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to communicate with AI' }));
    throw new Error(data.error || `Server responded with status ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

export async function generateJournalSummary(
  messages: ChatMessage[],
  currentTitle?: string
): Promise<SummarizeResponse> {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, title: currentTitle }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to generate summary' }));
    throw new Error(data.error || `Server responded with status ${res.status}`);
  }

  return await res.json();
}

export async function generateJournalInsights(
  entries: JournalEntry[]
): Promise<Omit<JournalInsight, 'id' | 'userId'>> {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to synthesize insights' }));
    throw new Error(data.error || `Server responded with status ${res.status}`);
  }

  return await res.json();
}

export async function getPromptSuggestions(
  currentTopic: string,
  mode: string
): Promise<string[]> {
  try {
    const res = await fetch('/api/prompt-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentTopic, mode }),
    });
    if (!res.ok) throw new Error('Prompt suggestion failed');
    const data = await res.json();
    return data.prompts || [];
  } catch (err) {
    console.error('Error fetching prompts:', err);
    return [
      'What was the most pivotal moment of your day today?',
      'How does this situation align with what truly matters to you?',
      'What advice would your future self give you about this right now?',
    ];
  }
}
