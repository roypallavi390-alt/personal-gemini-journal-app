import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  Tag, 
  Maximize2, 
  RefreshCw, 
  ChevronRight,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { JournalEntry, JournalInsight } from '../types';
import { getUserJournalInsights, saveJournalInsight } from '../lib/firebase';
import { generateJournalInsights } from '../services/geminiService';

interface JournalInsightsPanelProps {
  userId: string | null;
  entries: JournalEntry[];
  onOpenFullModal: () => void;
  onSelectEntry?: (entry: JournalEntry) => void;
}

export const JournalInsightsPanel: React.FC<JournalInsightsPanelProps> = ({
  userId,
  entries,
  onOpenFullModal,
}) => {
  const [insight, setInsight] = useState<JournalInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (userId) {
      loadLatestInsight();
    } else {
      setInsight(null);
    }
  }, [userId, entries.length]);

  const loadLatestInsight = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await getUserJournalInsights(userId);
      if (list.length > 0) {
        setInsight(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch latest insight:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGenerate = async () => {
    if (!userId || entries.length === 0) return;
    setGenerating(true);
    try {
      const data = await generateJournalInsights(entries);
      const newId = await saveJournalInsight(userId, {
        userId,
        ...data,
      });
      const full: JournalInsight = {
        id: newId,
        userId,
        ...data,
      };
      setInsight(full);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  // Extract top theme
  const dominantTheme = insight?.weeklyThemes?.[0] || {
    theme: entries.length > 0 ? 'Introspective Growth' : 'Start Journaling',
    description: entries.length > 0
      ? 'Analyzing your reflections for recurring mindset patterns and priorities.'
      : 'Record your first reflection with Gemini to unlock weekly synthesis.',
  };

  const topics = insight?.recurringTopics && insight.recurringTopics.length > 0
    ? insight.recurringTopics.slice(0, 5)
    : ['Prioritization', 'Mindfulness', 'Workflows', 'Planning'];

  return (
    <aside className="w-72 lg:w-80 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 h-full overflow-hidden text-slate-800">
      
      {/* Header matching Professional Polish Design */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 bg-amber-100 rounded text-amber-700">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              AI Journal Insights
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {insight?.period || 'Weekly Analysis'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="panel-quick-refresh-btn"
            onClick={handleQuickGenerate}
            disabled={generating || entries.length === 0}
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30"
            title="Generate Fresh Insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            id="panel-expand-insights-btn"
            onClick={onOpenFullModal}
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Open Full Insights Modal"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* Dominant Theme Card */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
            Dominant Theme
          </h3>
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="text-xs font-bold text-slate-800 line-clamp-1">
                {dominantTheme.theme}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              {dominantTheme.description}
            </p>
          </div>
        </div>

        {/* Important Topics */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
            Important Topics
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic, i) => {
              const colorClasses = [
                'bg-blue-50 text-blue-700 border-blue-100',
                'bg-slate-100 text-slate-700 border-slate-200',
                'bg-emerald-50 text-emerald-700 border-emerald-100',
                'bg-purple-50 text-purple-700 border-purple-100',
              ][i % 4];

              return (
                <span
                  key={i}
                  className={`px-2 py-1 border text-[10px] font-bold rounded uppercase tracking-wide ${colorClasses}`}
                >
                  {topic}
                </span>
              );
            })}
          </div>
        </div>

        {/* Reflection Insights */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
            Reflection Insights
          </h3>
          <div className="space-y-2.5">
            {insight?.breakthroughMoments && insight.breakthroughMoments.length > 0 ? (
              insight.breakthroughMoments.slice(0, 2).map((b, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <div className={`w-1 h-full min-h-[28px] rounded-full shrink-0 ${idx === 0 ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                  <p className="text-xs text-slate-600 italic leading-snug">
                    &ldquo;{b}&rdquo;
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="flex gap-2.5 items-start">
                  <div className="w-1 h-full min-h-[28px] bg-blue-400 rounded-full shrink-0" />
                  <p className="text-xs text-slate-600 italic leading-snug">
                    &ldquo;Review past reflections to identify recurring stress points and catalysts for flow.&rdquo;
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-1 h-full min-h-[28px] bg-emerald-400 rounded-full shrink-0" />
                  <p className="text-xs text-slate-600 italic leading-snug">
                    &ldquo;Listing concrete milestones helps ground thoughts when transitioning between projects.&rdquo;
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Prompt */}
        {insight?.growthPrompts && insight.growthPrompts.length > 0 && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-blue-600" /> Focus Question:
            </span>
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              {insight.growthPrompts[0]}
            </p>
          </div>
        )}

      </div>

      {/* Weekly Sentiment Bar Footer */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-2">
          <span>Weekly Sentiment</span>
          <span className="text-emerald-700">Positive (82%)</span>
        </div>
        <div className="flex h-2 gap-1 overflow-hidden">
          <div className="flex-[8] bg-emerald-400 rounded-l" title="Positive (80%)" />
          <div className="flex-[1.5] bg-amber-400" title="Neutral (15%)" />
          <div className="flex-[0.5] bg-rose-400 rounded-r" title="Challenging (5%)" />
        </div>
      </div>

    </aside>
  );
};
