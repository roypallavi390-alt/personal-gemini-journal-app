import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  User, 
  Lock, 
  ChevronDown,
  Layers,
  Server,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenInsights: () => void;
  onOpenSecurity: () => void;
  onOpenAuth: () => void;
  onNewSession: () => void;
  entriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInsights,
  onOpenSecurity,
  onOpenAuth,
  onNewSession,
  entriesCount,
}) => {
  const { user, logOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'GU';
  };

  const displayName = user?.displayName || (user?.isAnonymous ? 'Guest User' : user?.email?.split('@')[0] || 'Member');

  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
      
      {/* Brand & Left Section */}
      <div className="flex items-center gap-3">
        <button
          id="nav-brand-btn"
          onClick={onNewSession}
          className="flex items-center gap-3 text-left group transition-all cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800">
            Gemini Journal <span className="text-blue-600">Pro</span>
          </h1>
        </button>

        {/* End-to-End Encrypted Pill */}
        <div 
          onClick={onOpenSecurity}
          className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded text-[11px] font-medium text-emerald-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100/70 transition-colors"
          title="Click to view Security Architecture & Firestore Zero-Trust Rules"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      {/* Center & Right Status and User Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Live Infrastructure Sync Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Firestore Sync Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Cloud Run Instance: LHR-01</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-7 w-[1px] bg-slate-200" />

        {/* Security Architecture Trigger */}
        <button
          id="nav-security-btn"
          onClick={onOpenSecurity}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all text-xs font-semibold"
          title="View Security & Firestore Rules Isolation"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Security Hub</span>
        </button>

        {/* AI Journal Insights Trigger */}
        <button
          id="nav-insights-btn"
          onClick={onOpenInsights}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-all text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden xs:inline">AI Insights</span>
          {entriesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold text-[10px]">
              {entriesCount}
            </span>
          )}
        </button>

        {/* User Account / Profile */}
        {user ? (
          <div className="relative">
            <button
              id="nav-user-dropdown-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 text-left p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold leading-tight text-slate-900 truncate max-w-[120px]">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {user.isAnonymous ? 'Guest Vault' : 'Pro Member'}
                </p>
              </div>

              <div className="w-9 h-9 bg-slate-200 rounded-full border-2 border-white shadow-xs flex items-center justify-center font-bold text-xs text-slate-700">
                {getInitials(user.displayName, user.email)}
              </div>
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Signed in as</p>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                    {user.displayName || (user.isAnonymous ? 'Guest User' : user.email)}
                  </p>
                  {user.email && (
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    <Lock className="w-3 h-3 shrink-0 text-emerald-600" />
                    <span>UID Isolated: {user.uid.slice(0, 8)}...</span>
                  </div>
                </div>

                <button
                  id="user-menu-security-btn"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenSecurity();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Security Architecture & Rules
                </button>

                <button
                  id="user-menu-insights-btn"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenInsights();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Historical Insights Archive
                </button>

                <button
                  id="user-menu-logout-btn"
                  onClick={() => {
                    setDropdownOpen(false);
                    logOut();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            id="nav-signin-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

      </div>

    </nav>
  );
};

