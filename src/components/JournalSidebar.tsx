import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  BookOpen, 
  Tag, 
  Smile, 
  ShieldCheck,
  Layers,
  Lock
} from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalSidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  loading: boolean;
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.tags && entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesMood = selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;

    return matchesSearch && matchesMood;
  });

  const formatEntryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) {
      return `Today • ${timeStr}`;
    }
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday • ${timeStr}`;
    }
    return `${date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })} • ${timeStr}`;
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 text-slate-800">
      
      {/* Top Action Button */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <button
          id="sidebar-new-journal-btn"
          onClick={onNewEntry}
          className="w-full py-2.5 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>New Reflection</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search entries & tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Mood filter pill tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {['all', 'reflective', 'calm', 'inspired', 'grateful', 'anxious'].map((mood) => (
            <button
              key={mood}
              id={`filter-mood-${mood}`}
              onClick={() => setSelectedMoodFilter(mood)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize shrink-0 transition-all ${
                selectedMoodFilter === mood
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 border border-transparent'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Header Label */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Recent Entries ({filteredEntries.length})
        </h3>
        <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Encrypted
        </span>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading your reflections...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 text-xs space-y-2">
            <BookOpen className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-600">No reflections found</p>
            <p className="text-[11px] text-slate-400">
              {searchQuery ? 'Try adjusting your search filters' : 'Start a fresh reflection above!'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = activeEntryId === entry.id;
            const formattedDate = formatEntryDate(entry.createdAt);

            return (
              <div
                key={entry.id}
                id={`journal-item-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3 rounded-sm cursor-pointer border-r-2 transition-all text-left ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600'
                    : 'hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs truncate ${isSelected ? 'font-bold text-blue-900' : 'font-medium text-slate-800'}`}>
                    {entry.title || 'Untitled Reflection'}
                  </p>

                  {/* Delete button */}
                  <button
                    id={`delete-entry-${entry.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${entry.title}" permanently? This cannot be undone.`)) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-700 font-medium' : 'text-slate-400'}`}>
                  {formattedDate}
                </p>

                {entry.summary && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 leading-snug">
                    {entry.summary}
                  </p>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {entry.tags.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Vault Status Footer matching Design */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
          <span>Vault Status</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Isolated
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(15, (entries.length * 6) + 12))}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-medium">
          Firestore Zero-Trust Isolation Active
        </p>
      </div>

    </aside>
  );
};

