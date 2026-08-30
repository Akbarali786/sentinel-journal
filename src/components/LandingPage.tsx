/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DIRECTIVE 13: LANDING PAGE & SECURITY DISCLOSURE
 * Explains clearly what Sentinel Journal is, what happens to user data,
 * and enables one-click Google Sign-In with zero password friction.
 */

import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  Lock, 
  Database, 
  Compass, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  FileText
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#f8f6f2] text-[#3d3d3b] selection:bg-[#e2dfd4] selection:text-[#3d3d3b]">
      
      {/* Top Banner */}
      <div className="border-b border-[#d8d5c7] bg-[#efede5]/80 px-4 py-2.5 text-center text-xs text-[#6b7a6e]">
        <span className="font-bold text-[#5A5A40]">Sentinel Journal</span> — Built on Google Cloud Run with Firestore data isolation and resilient Gemini fallback models.
      </div>

      {/* Main Hero Section */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        
        {/* Centered Brand Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d5c7] bg-white px-3.5 py-1.5 shadow-xs mb-6">
            <Shield className="h-3.5 w-3.5 text-[#5D6D5F]" />
            <span className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
              Zero-Trust Reflective Journaling
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#5A5A40] leading-[1.15]">
            A private space to clarify your mind and think deeper.
          </h1>

          <p className="mt-6 text-lg text-[#3d3d3b]/90 leading-relaxed font-normal">
            Sentinel Journal acts as your thoughtful, reflective thinking partner. Instead of generic chatbot banter, it asks poignant questions, maps recurring themes, and respects your privacy with strict per-user database isolation.
          </p>

          {/* Authentication Action Box */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3">
            {errorMessage && (
              <div className="w-full max-w-md rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-2.5 text-left mb-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication Notice:</span> {errorMessage}
                </div>
              </div>
            )}

            <button
              id="btn-google-signin"
              onClick={onSignIn}
              disabled={isLoading}
              className="group relative flex items-center justify-center gap-3 rounded-full bg-[#5D6D5F] hover:bg-[#5A5A40] px-8 py-4 text-sm font-semibold text-white shadow-md active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Connecting securely...</span>
                </div>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <p className="text-xs text-[#6b7a6e] flex items-center gap-1.5 mt-1">
              <Lock className="h-3 w-3 text-[#6b7a6e]" />
              <span>Google Identity only • No password storage • Isolated Firestore tenant</span>
            </p>
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="rounded-3xl border border-[#d8d5c7] bg-white p-7 shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efede5] text-[#5D6D5F] mb-4">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#5A5A40]">
              Reflective Thinking Partner
            </h3>
            <p className="mt-2 text-sm text-[#3d3d3b]/80 leading-relaxed">
              Powered by Gemini with multi-model fallback resiliency. Designed to stimulate deep reflection, question your assumptions, and summarize core emotional insights.
            </p>
          </div>

          <div className="rounded-3xl border border-[#d8d5c7] bg-white p-7 shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efede5] text-[#a67c52] mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#5A5A40]">
              Isolated User Sanctuary
            </h3>
            <p className="mt-2 text-sm text-[#3d3d3b]/80 leading-relaxed">
              Entries are restricted to your verified UID path in Cloud Firestore (<code className="text-xs bg-[#e2dfd4] px-1 py-0.5 rounded font-mono text-[#3d3d3b]">/users/&#123;uid&#125;/interactions</code>). No cross-user exposure.
            </p>
          </div>

          <div className="rounded-3xl border border-[#d8d5c7] bg-white p-7 shadow-xs">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efede5] text-[#5D6D5F] mb-4">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#5A5A40]">
              Injection Firewall & Zero Logging
            </h3>
            <p className="mt-2 text-sm text-[#3d3d3b]/80 leading-relaxed">
              Pasted articles and notes are wrapped in nonce-delimited data envelopes and inspected by a pre-classification pass before reaching the model. Your private words are never written to server logs.
            </p>
          </div>

        </div>

        {/* Data Protection & Transparency Agreement */}
        <div className="mt-16 rounded-3xl border border-[#d8d5c7] bg-[#efede5] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[#5A5A40] font-bold mb-4">
            <KeyRound className="h-5 w-5 text-[#5D6D5F]" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold">How Sentinel Journal Handles Your Data</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#3d3d3b]/90">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#5D6D5F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#3d3d3b]">No Hardcoded or Client Keys:</strong> The Gemini API key is managed via Google Secret Manager and kept strictly on the Cloud Run server.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#5D6D5F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#3d3d3b]">Cryptographic Auth Verification:</strong> Every API call decodes your Firebase JWT and enforces that actions match your authenticated identity.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#5D6D5F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#3d3d3b]">Export & Purge Rights:</strong> You can export your full interaction and audit log in JSON at any time or permanently wipe your account records in one click.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#5D6D5F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#3d3d3b]">Empathetic Safety Net:</strong> In-request distress detection surfaces supportive crisis resources without creating punitive or permanent tracking flags.
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#d8d5c7] bg-white py-8 text-center text-xs text-[#6b7a6e]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-serif font-bold text-[#5A5A40]">
            <Shield className="h-4 w-4 text-[#5D6D5F]" />
            <span>Sentinel Journal</span>
          </div>
          <div>
            Built with Google Cloud Run, Cloud Firestore & Google Gemini API
          </div>
          <div className="font-mono text-[11px] text-[#6b7a6e]">
            v1.0.0 • Strict Per-UID Isolation
          </div>
        </div>
      </footer>

    </div>
  );
};
