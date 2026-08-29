import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  Lock, 
  Lightbulb, 
  Sun, 
  Moon, 
  Compass, 
  Heart, 
  Check, 
  FileCheck, 
  AlertCircle,
  Brain,
  Smile,
  ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, JournalEntry, JournalMode } from '../types';
import { JOURNAL_MODES } from '../data/journalModes';
import { sendChatMessage, generateJournalSummary, getPromptSuggestions } from '../services/geminiService';
import { saveJournalEntry } from '../lib/firebase';
import { VoiceRecorder } from './VoiceRecorder';
import { useAuth } from '../context/AuthContext';

interface JournalChatProps {
  userId: string | null;
  activeEntry: JournalEntry | null;
  onEntrySaved: (entry: JournalEntry) => void;
  onRequireAuth: () => void;
}

export const JournalChat: React.FC<JournalChatProps> = ({
  userId,
  activeEntry,
  onEntrySaved,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<JournalMode>(JOURNAL_MODES[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentTitle, setCurrentTitle] = useState('Today\'s Reflection');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('reflective');
  const [loadingAI, setLoadingAI] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.isAnonymous ? 'GU' : 'SJ');

  useEffect(() => {
    if (activeEntry) {
      setMessages(activeEntry.messages || []);
      setCurrentTitle(activeEntry.title || 'Journal Reflection');
      setSelectedMood(activeEntry.mood || 'reflective');
      setActiveEntryId(activeEntry.id);
      const matchedMode = JOURNAL_MODES.find(m => m.id === activeEntry.mode);
      if (matchedMode) setSelectedMode(matchedMode);
    } else {
      resetToMode(selectedMode);
    }
  }, [activeEntry]);

  useEffect(() => {
    loadPromptSuggestions(selectedMode.title);
  }, [selectedMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingAI]);

  const loadPromptSuggestions = async (topic: string) => {
    const list = await getPromptSuggestions(topic, selectedMode.id);
    setPrompts(list);
  };

  const resetToMode = (mode: JournalMode) => {
    setSelectedMode(mode);
    setActiveEntryId(null);
    setCurrentTitle(`${mode.title} - ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`);
    
    const initialAssistantMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: mode.starterPrompt,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialAssistantMsg]);
    setSaveStatus('idle');
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || loadingAI) return;

    if (!userId) {
      onRequireAuth();
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setLoadingAI(true);
    setSaveStatus('saving');

    try {
      const reply = await sendChatMessage(
        updatedMessages,
        selectedMode.id,
        selectedMode.systemPromptAddition
      );

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      const savedId = await saveJournalEntry(userId, {
        id: activeEntryId || undefined,
        title: currentTitle,
        mood: selectedMood,
        messages: finalMessages,
        mode: selectedMode.id,
        tags: [selectedMode.title],
      });

      if (!activeEntryId) {
        setActiveEntryId(savedId);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3500);
      loadPromptSuggestions(textToSend);
    } catch (err: any) {
      console.error('Chat error:', err);
      setSaveStatus('error');
      
      const errorAssistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: "I'm having a brief connection delay due to high model demand. Your reflection is saved—feel free to click below or send a quick message to continue.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSummarizeAndFinish = async () => {
    if (messages.length < 2) return;
    if (!userId) {
      onRequireAuth();
      return;
    }

    setSummarizing(true);
    try {
      const summaryResult = await generateJournalSummary(messages, currentTitle);
      
      const entryToSave: Partial<JournalEntry> & { id?: string } = {
        id: activeEntryId || undefined,
        title: summaryResult.title || currentTitle,
        summary: summaryResult.summary,
        keyTakeaways: summaryResult.keyTakeaways,
        mood: summaryResult.mood || selectedMood,
        tags: summaryResult.tags,
        messages: messages,
        mode: selectedMode.id,
        updatedAt: new Date().toISOString(),
      };

      const savedId = await saveJournalEntry(userId, entryToSave);
      setActiveEntryId(savedId);
      setCurrentTitle(summaryResult.title);
      setSelectedMood(summaryResult.mood);

      const fullEntry: JournalEntry = {
        id: savedId,
        userId,
        title: summaryResult.title,
        summary: summaryResult.summary,
        keyTakeaways: summaryResult.keyTakeaways,
        mood: summaryResult.mood,
        tags: summaryResult.tags,
        messages,
        mode: selectedMode.id,
        createdAt: activeEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onEntrySaved(fullEntry);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Summarize error:', err);
      setSaveStatus('error');
    } finally {
      setSummarizing(false);
    }
  };

  const getModeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-3.5 h-3.5 text-blue-600" />;
      case 'Moon': return <Moon className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Compass': return <Compass className="w-3.5 h-3.5 text-blue-600" />;
      case 'Heart': return <Heart className="w-3.5 h-3.5 text-rose-500" />;
      case 'Smile': return <Smile className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden text-slate-800">
      
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Title & Mode */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            {getModeIcon(selectedMode.icon)}
          </div>
          <div className="min-w-0">
            <input
              id="journal-title-input"
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none focus:border-b-2 border-blue-600 max-w-full truncate"
              placeholder="Session Title..."
            />
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedMode.title}
              </span>
              <span className="text-slate-300">•</span>
              <select
                id="journal-mood-select"
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value as any)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="reflective">Reflective</option>
                <option value="calm">Calm</option>
                <option value="inspired">Inspired</option>
                <option value="grateful">Grateful</option>
                <option value="energized">Energized</option>
                <option value="anxious">Anxious</option>
                <option value="overwhelmed">Overwhelmed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Sync Status Badge */}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 font-medium animate-in fade-in">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Saved to Firestore</span>
            </span>
          )}

          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 font-medium">
              <div className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </span>
          )}

          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 font-medium">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Sync Error</span>
            </span>
          )}

          {/* Reset button */}
          <button
            id="journal-reset-btn"
            onClick={() => resetToMode(selectedMode)}
            className="p-2 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
            title="Reset to blank session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Summarize & Extract */}
          <button
            id="journal-summarize-btn"
            onClick={handleSummarizeAndFinish}
            disabled={summarizing || messages.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {summarizing ? (
              <>
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Summarize & Takeaways</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* Framework Picker Tabs */}
      <div className="px-4 sm:px-6 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 shrink-0">
          Framework:
        </span>
        {JOURNAL_MODES.map((mode) => {
          const isActive = selectedMode.id === mode.id;
          return (
            <button
              key={mode.id}
              id={`mode-btn-${mode.id}`}
              onClick={() => {
                if (confirm('Switching framework will start a fresh session. Continue?')) {
                  resetToMode(mode);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium shrink-0 transition-all ${
                isActive
                  ? 'bg-white text-blue-700 border border-blue-200 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {getModeIcon(mode.icon)}
              <span>{mode.title}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex gap-4 items-start max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar matching Professional Polish */}
              {isUser ? (
                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-xs flex items-center justify-center shrink-0 text-xs font-bold text-slate-700">
                  {userInitials}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-xs">
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                  </svg>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tr-none'
                    : 'bg-blue-50/70 border border-blue-100 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}

                {/* Follow-up Prompts inside Gemini Response */}
                {!isUser && prompts.length > 0 && index === messages.length - 1 && !loadingAI && (
                  <div className="mt-4 pt-3 border-t border-blue-200/70 flex flex-wrap items-center gap-2">
                    {prompts.slice(0, 2).map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p)}
                        className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] ${
                    isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loadingAI && (
          <div className="flex gap-4 items-start max-w-2xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl rounded-tl-none text-xs text-blue-800 font-medium flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Gemini is thinking and reflecting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Suggested Reflection Prompts Strip */}
      {prompts.length > 0 && !loadingAI && (
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider shrink-0">Explore:</span>
          {prompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              className="text-left text-xs text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 px-3 py-1 rounded-full border border-slate-200 hover:border-blue-200 transition-all shrink-0 max-w-[280px] truncate"
              title={promptText}
            >
              {promptText}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Area matching Design */}
      <div className="h-24 p-4 border-t border-slate-200 flex items-center gap-3 bg-white shrink-0">
        
        <div className="flex-1 relative">
          <input
            id="journal-input-textarea"
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Record a thought or ask Gemini for a prompt..."
            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />

          <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
            <VoiceRecorder
              onTranscript={(transcript) => {
                setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
              }}
              disabled={loadingAI}
            />
          </div>
        </div>

        {/* Send Button */}
        <button
          id="journal-send-btn"
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || loadingAI}
          className="h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          title="Send to Gemini"
        >
          <Send className="w-5 h-5" />
        </button>

      </div>

    </div>
  );
};

