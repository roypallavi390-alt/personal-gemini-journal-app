import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  MessageSquare, 
  Trash2, 
  Lock,
  Tag,
  Copy,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { JournalEntry } from '../types';

interface JournalEntryViewProps {
  entry: JournalEntry;
  onBack: () => void;
  onContinueChat: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}

export const JournalEntryView: React.FC<JournalEntryViewProps> = ({
  entry,
  onBack,
  onContinueChat,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const exportMarkdown = () => {
    const content = `# ${entry.title}
*Date: ${formattedDate}*
*Mood: ${entry.mood || 'Reflective'}*
*Tags: ${(entry.tags || []).join(', ')}*

## AI Reflection Summary
${entry.summary || 'N/A'}

## Key Takeaways
${(entry.keyTakeaways || []).map(t => `- ${t}`).join('\n')}

## Conversation Transcript
${(entry.messages || []).map(m => `### ${m.role.toUpperCase()} (${new Date(m.timestamp).toLocaleTimeString()})\n${m.content}\n`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_journal.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyTranscript = () => {
    const text = (entry.messages || [])
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto text-slate-800">
      
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-xs">
        
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="view-back-btn"
            onClick={onBack}
            className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Back to Journal Chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {entry.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          
          <button
            id="entry-copy-btn"
            onClick={copyTranscript}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
            title="Copy Transcript"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            id="entry-export-btn"
            onClick={exportMarkdown}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
            title="Export as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            id="entry-continue-btn"
            onClick={() => onContinueChat(entry)}
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Continue Conversation</span>
          </button>

          <button
            id="entry-delete-btn"
            onClick={() => {
              if (confirm(`Delete "${entry.title}"? This cannot be undone.`)) {
                onDelete(entry.id);
              }
            }}
            className="p-1.5 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors"
            title="Delete Entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Summary Card */}
        {entry.summary && (
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI Reflection Synthesis</span>
              </div>

              {/* Mood & Tags */}
              <div className="flex items-center gap-2">
                {entry.mood && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                    {entry.mood}
                  </span>
                )}
                {entry.tags?.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Summary Text */}
            <div className="text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap bg-slate-50/70 p-4 rounded-lg border border-slate-200/60">
              {entry.summary}
            </div>

            {/* Key Takeaways */}
            {entry.keyTakeaways && entry.keyTakeaways.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Key Realizations & Actionable Takeaways</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {entry.keyTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5 shadow-xs"
                    >
                      <span className="w-4.5 h-4.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Full Transcript Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Full Journal Dialogue ({entry.messages?.length || 0} turns)</span>
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" /> Encrypted in Firestore
            </span>
          </div>

          <div className="space-y-4">
            {(entry.messages || []).map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || i}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUser
                      ? 'bg-slate-50 border-slate-200 ml-4 sm:ml-12 text-slate-800'
                      : 'bg-blue-50/70 border-blue-100 mr-4 sm:mr-12 text-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isUser
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isUser ? 'ME' : 'AI'}
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {isUser ? 'You' : 'Gemini Companion'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-sm leading-relaxed text-slate-700">
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

