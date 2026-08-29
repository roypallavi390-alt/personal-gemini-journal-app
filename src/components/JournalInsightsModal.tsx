import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  Lightbulb, 
  Tag, 
  Calendar, 
  RefreshCw, 
  Heart, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { JournalEntry, JournalInsight } from '../types';
import { generateJournalInsights } from '../services/geminiService';
import { saveJournalInsight, getUserJournalInsights } from '../lib/firebase';

interface JournalInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  entries: JournalEntry[];
  onOpenEntry: (entry: JournalEntry) => void;
}

export const JournalInsightsModal: React.FC<JournalInsightsModalProps> = ({
  isOpen,
  onClose,
  userId,
  entries,
  onOpenEntry,
}) => {
  const [currentInsight, setCurrentInsight] = useState<JournalInsight | null>(null);
  const [pastInsights, setPastInsights] = useState<JournalInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(0);

  // Load existing insights from Firestore
  useEffect(() => {
    if (isOpen && userId) {
      loadInsights();
    }
  }, [isOpen, userId]);

  const loadInsights = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await getUserJournalInsights(userId);
      setPastInsights(list);
      if (list.length > 0) {
        setCurrentInsight(list[0]);
        setSelectedHistoryIndex(0);
      }
    } catch (err) {
      console.error('Failed to load past insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFreshInsights = async () => {
    if (!userId || entries.length === 0) return;

    setGenerating(true);
    try {
      const insightData = await generateJournalInsights(entries);
      
      const newInsightId = await saveJournalInsight(userId, {
        userId,
        ...insightData,
      });

      const fullInsight: JournalInsight = {
        id: newInsightId,
        userId,
        ...insightData,
      };

      setPastInsights(prev => [fullInsight, ...prev]);
      setCurrentInsight(fullInsight);
      setSelectedHistoryIndex(0);
    } catch (err) {
      console.error('Failed to generate insights:', err);
      alert('Could not generate insights right now. Please ensure your journal entries have content.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  AI Journal Insights & Synthesis
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Pro Feature
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Deep analytical reflection synthesized across your personal journal history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Generate button */}
            <button
              id="generate-insights-btn"
              onClick={handleGenerateFreshInsights}
              disabled={generating || entries.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Synthesizing...' : 'Generate Fresh Insights'}</span>
            </button>

            <button
              id="insights-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* History / Version Bar if multiple reports exist */}
          {pastInsights.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Insight Reports:</span>
              {pastInsights.map((insight, idx) => (
                <button
                  key={insight.id}
                  onClick={() => {
                    setCurrentInsight(insight);
                    setSelectedHistoryIndex(idx);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition-all ${
                    selectedHistoryIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {new Date(insight.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ({insight.analyzedEntriesCount} entries)
                </button>
              ))}
            </div>
          )}

          {/* Empty State if no entries or insights */}
          {entries.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-xl border border-slate-200 p-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Journal Entries to Analyze Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Write a few conversational journal reflections with Gemini first. The AI Insights engine will then extract recurring themes, emotional arcs, and growth questions.
              </p>
            </div>
          ) : !currentInsight ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-slate-200 p-8">
              <Sparkles className="w-12 h-12 text-blue-600 mx-auto animate-pulse" />
              <h3 className="text-base font-bold text-slate-800">Ready to Analyze {entries.length} Journal Entries</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click below to have Gemini analyze your private journal entries and reveal recurring themes, emotional trajectories, and tailored reflection prompts.
              </p>
              <button
                onClick={handleGenerateFreshInsights}
                disabled={generating}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                {generating ? 'Analyzing Reflections...' : 'Generate My First AI Insights Report'}
              </button>
            </div>
          ) : (
            <>
              {/* Top Overview Card */}
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      {currentInsight.period}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Synthesized from <strong className="text-slate-800">{currentInsight.analyzedEntriesCount}</strong> private journal entries
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {currentInsight.summary}
                </p>
              </div>

              {/* Weekly Themes Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Key Reflection Themes</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentInsight.weeklyThemes.map((theme, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          {theme.theme}
                        </h4>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {theme.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotional Trends & Breakthroughs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Emotional Trajectory */}
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Emotional Trajectory & Mindset</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentInsight.emotionalTrends}
                  </p>
                </div>

                {/* Breakthrough Moments */}
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Breakthroughs & Realizations</span>
                  </div>
                  <div className="space-y-1.5">
                    {currentInsight.breakthroughMoments && currentInsight.breakthroughMoments.length > 0 ? (
                      currentInsight.breakthroughMoments.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Steady introspection and self-discovery across reflections.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Recurring Topics Tags */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-2">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recurring Focus Areas:</span>
                </span>
                {currentInsight.recurringTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded text-xs bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                  >
                    #{topic}
                  </span>
                ))}
              </div>

              {/* Growth & Inquiry Prompts */}
              <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span>Actionable Growth Prompts for the Coming Week</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentInsight.growthPrompts.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-white border border-blue-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5 shadow-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{prompt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Insights synthesized exclusively from your isolated Firestore journal entries</span>
                </span>
                <span>Report ID: {currentInsight.id.slice(0, 8)}...</span>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

