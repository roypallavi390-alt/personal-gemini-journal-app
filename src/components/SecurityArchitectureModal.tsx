import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Server, 
  FileCode, 
  Database, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle,
  Cpu,
  Layers,
  Globe
} from 'lucide-react';

interface SecurityArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityArchitectureModal: React.FC<SecurityArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'threats' | 'rules'>('architecture');

  if (!isOpen) return null;

  const firestoreRulesText = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Default Deny: Reject anything not explicitly matched
    match /{document=**} {
      allow read, write: if false;
    }

    // Strict user isolation: Only authenticated user matching {userId} can read/write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Security & Cloud Architecture Hub
              </h2>
              <p className="text-xs text-slate-500">
                Production-grade isolation, Secret Manager integration, and Firestore zero-trust
              </p>
            </div>
          </div>

          <button
            id="security-modal-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 text-xs font-bold px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture & Data Flow</span>
          </button>
          <button
            onClick={() => setActiveTab('threats')}
            className={`pb-3 text-xs font-bold px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'threats'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Threat Model & Mitigations</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-xs font-bold px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Firestore Security Rules</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              
              {/* Visual Flow Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-bold">
                    <Globe className="w-4 h-4" />
                    <span>1. Client & Auth (Frontend)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    React 19 SPA running in HTTPS sandbox. User authenticates via Firebase Auth (Email/Password or Google OAuth), receiving a cryptographically signed JWT token.
                  </p>
                  <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded font-mono">
                    Client-side key: Public routing identifier only
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold">
                    <Server className="w-4 h-4" />
                    <span>2. Cloud Run & Secret Manager</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Express backend deployed on Google Cloud Run. Sensitive <code className="text-indigo-600 font-mono">GEMINI_API_KEY</code> is injected exclusively via Secret Manager into server environment variables.
                  </p>
                  <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded font-mono">
                    Zero client exposure of API secrets
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <Database className="w-4 h-4" />
                    <span>3. Firestore User Isolation</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    All user journals and insights are partitioned under <code className="text-emerald-600 font-mono">/users/{'{uid}'}/**</code>. Firestore Security Rules enforce zero-trust: no user can query or modify another user&apos;s data.
                  </p>
                  <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded font-mono">
                    request.auth.uid == userId
                  </div>
                </div>

              </div>

              {/* Security Highlights */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Production-Grade Security Safeguards</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Zero Secret Exposure:</strong> Gemini API keys are never bundled in client code or transmitted over the wire.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Zero-Trust Database:</strong> Firestore rules enforce server-validated token authentication for every document read/write.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Data Sovereignty:</strong> Users can permanently delete their journal entries and insights at any time with cascading removal.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Cloud Run Sandbox:</strong> Server executes within Google Cloud Run gVisor kernel isolation with automatic scaling.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Threat: Cross-User Data Access / Multi-Tenant Leakage</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Risk:</strong> In a shared web application, an attacker might forge document IDs to inspect another user&apos;s private journal entries.
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <strong>Mitigation:</strong> Enforced Firestore Security Rules reject any document query outside the user&apos;s authenticated subpath (<code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">/users/$(request.auth.uid)/**</code>). Database rules execute directly inside Google Cloud infrastructure, bypassing application-level vulnerabilities.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                  <KeyRound className="w-4 h-4 text-rose-600" />
                  <span>Threat: Secret Key Theft & Financial Abuse</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Risk:</strong> Exposing AI model API keys in browser Javascript allows malicious users to extract and abuse quotas.
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <strong>Mitigation:</strong> All Gemini API calls are strictly routed through backend endpoints (<code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">/api/chat</code>, <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">/api/summarize</code>, <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">/api/insights</code>). Keys are injected at runtime via Google Cloud Secret Manager into container environment variables.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Threat: Session Hijacking & Insecure Storage</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Risk:</strong> Stolen plaintext passwords or forged session states.
                </p>
                <p className="text-xs text-emerald-700 leading-relaxed bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <strong>Mitigation:</strong> Password authentication is managed by Google Firebase Identity Platform with bcrypt hashing, short-lived JWT credentials, and automatic token refresh mechanisms.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Deployed <code className="text-slate-800 font-mono font-bold">firestore.rules</code>:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Deployed to Firebase Project
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                {firestoreRulesText}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Project ID: <strong className="text-slate-800 font-mono">gen-lang-client-0189597907</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

