import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Lock, 
  LogIn, 
  Layers, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Zap,
  Clock
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { JournalSidebar } from './components/JournalSidebar';
import { JournalChat } from './components/JournalChat';
import { JournalEntryView } from './components/JournalEntryView';
import { JournalInsightsModal } from './components/JournalInsightsModal';
import { SecurityArchitectureModal } from './components/SecurityArchitectureModal';
import { AuthModal } from './components/AuthModal';
import { JournalEntry } from './types';
import { getUserJournalEntries, deleteJournalEntry } from './lib/firebase';

function MainApp() {
  const { user, loading: authLoading, signInAsGuest } = useAuth();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Fetch entries when user changes
  useEffect(() => {
    if (user) {
      loadEntries();
    } else {
      setEntries([]);
      setActiveEntry(null);
      setViewingEntry(null);
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    setLoadingEntries(true);
    try {
      const userEntries = await getUserJournalEntries(user.uid);
      setEntries(userEntries);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setViewingEntry(entry);
    setSidebarOpenMobile(false);
  };

  const handleNewSession = () => {
    setActiveEntry(null);
    setViewingEntry(null);
    setSidebarOpenMobile(false);
  };

  const handleContinueChat = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setViewingEntry(null);
  };

  const handleEntrySaved = (savedEntry: JournalEntry) => {
    setEntries((prev) => {
      const index = prev.findIndex((e) => e.id === savedEntry.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = savedEntry;
        return updated;
      }
      return [savedEntry, ...prev];
    });
    setActiveEntry(savedEntry);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteJournalEntry(user.uid, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (activeEntry?.id === entryId) setActiveEntry(null);
      if (viewingEntry?.id === entryId) setViewingEntry(null);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans">
      
      {/* Global Navigation Bar */}
      <Navbar
        onOpenInsights={() => setIsInsightsOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNewSession={handleNewSession}
        entriesCount={entries.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Sidebar Toggle Button */}
        <div className="md:hidden absolute top-3 left-3 z-30">
          <button
            id="mobile-sidebar-toggle"
            onClick={() => setSidebarOpenMobile(!sidebarOpenMobile)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs"
          >
            {sidebarOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`fixed md:relative inset-y-0 left-0 z-40 md:z-auto transition-transform duration-300 ease-in-out md:translate-x-0 ${
            sidebarOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <JournalSidebar
            entries={entries}
            activeEntryId={viewingEntry?.id || activeEntry?.id || null}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewSession}
            onDeleteEntry={handleDeleteEntry}
            loading={loadingEntries}
          />
        </div>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpenMobile && (
          <div
            className="md:hidden fixed inset-0 bg-slate-900/60 z-30 backdrop-blur-xs"
            onClick={() => setSidebarOpenMobile(false)}
          />
        )}

        {/* Main Content Area: Chat or Entry Detail */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
          {!user ? (
            /* Unauthenticated Landing / Quick Start Screen */
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-white via-slate-50 to-slate-100">
              <div className="max-w-xl w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-md shadow-blue-600/20 text-white">
                  <BookOpen className="w-8 h-8 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Personal Gemini Journal
                  </h1>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    A private, conversational AI journal with multi-turn reflections, automated summary extraction, and deep weekly insights.
                  </p>
                </div>

                {/* Security pill callout */}
                <div className="p-5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 text-left space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Strict User Isolation & Firestore Security</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your journal entries and insights are strictly isolated to your authenticated UID via Firebase security rules. API keys are safely held on the Cloud Run server.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    id="welcome-signin-btn"
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In or Create Account</span>
                  </button>

                  <button
                    id="welcome-guest-btn"
                    onClick={async () => {
                      try {
                        await signInAsGuest();
                      } catch (e) {
                        setIsAuthOpen(true);
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Instant Demo Session</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>

              </div>
            </div>
          ) : viewingEntry ? (
            /* Selected Journal Entry Detail View */
            <JournalEntryView
              entry={viewingEntry}
              onBack={() => setViewingEntry(null)}
              onContinueChat={handleContinueChat}
              onDelete={(id) => {
                handleDeleteEntry(id);
                setViewingEntry(null);
              }}
            />
          ) : (
            /* Active Live Journal Chat */
            <JournalChat
              userId={user.uid}
              activeEntry={activeEntry}
              onEntrySaved={handleEntrySaved}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          )}
        </main>

      </div>

      {/* AI Journal Insights Modal (Original Feature) */}
      <JournalInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        userId={user?.uid || null}
        entries={entries}
        onOpenEntry={(entry) => {
          setIsInsightsOpen(false);
          setViewingEntry(entry);
        }}
      />

      {/* Security Architecture & Firestore Rules Modal */}
      <SecurityArchitectureModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
