/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DIRECTIVE 13: USABILITY & ACCESSIBILITY BASELINE
 * Responsive navigation bar with active security badges, clear identity display, and tab transitions.
 */

import React from 'react';
import { Shield, BookOpen, Clock, ShieldCheck, Lock, LogOut, TrendingUp } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  activeTab: 'reflect' | 'patterns' | 'history' | 'security';
  onTabChange: (tab: 'reflect' | 'patterns' | 'history' | 'security') => void;
  onSignOut: () => void;
  interactionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onSignOut,
  interactionCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#d8d5c7] bg-[#f8f6f2]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5A5A40] text-white shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-[#5A5A40]">Sentinel</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#efede5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#5D6D5F] border border-[#d8d5c7]">
                  <ShieldCheck className="h-3 w-3 text-[#5D6D5F]" />
                  Sanctuary
                </span>
              </div>
              <p className="hidden sm:block text-[10px] uppercase tracking-widest text-[#6b7a6e] font-medium">
                Thought Sanctuary • Zero Exposure
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[#efede5] border border-[#d8d5c7] p-1 rounded-2xl" aria-label="Main Navigation">
            <button
              id="nav-tab-reflect"
              onClick={() => onTabChange('reflect')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'reflect'
                  ? 'bg-white text-[#3d3d3b] shadow-xs font-semibold'
                  : 'text-[#6b7a6e] hover:text-[#3d3d3b] hover:bg-[#e2dfd4]'
              }`}
            >
              <BookOpen className={`h-3.5 w-3.5 ${activeTab === 'reflect' ? 'text-[#5D6D5F]' : ''}`} />
              <span>Reflect</span>
            </button>

            <button
              id="nav-tab-patterns"
              onClick={() => onTabChange('patterns')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'patterns'
                  ? 'bg-white text-[#3d3d3b] shadow-xs font-semibold'
                  : 'text-[#6b7a6e] hover:text-[#3d3d3b] hover:bg-[#e2dfd4]'
              }`}
            >
              <TrendingUp className={`h-3.5 w-3.5 ${activeTab === 'patterns' ? 'text-[#5D6D5F]' : ''}`} />
              <span>Patterns & Loops</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-[#3d3d3b] shadow-xs font-semibold'
                  : 'text-[#6b7a6e] hover:text-[#3d3d3b] hover:bg-[#e2dfd4]'
              }`}
            >
              <Clock className={`h-3.5 w-3.5 ${activeTab === 'history' ? 'text-[#5D6D5F]' : ''}`} />
              <span>Journal History</span>
              {interactionCount > 0 && (
                <span className="ml-0.5 rounded-full bg-[#e2dfd4] px-1.5 py-0.2 text-[10px] font-bold text-[#3d3d3b]">
                  {interactionCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-security"
              onClick={() => onTabChange('security')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-white text-[#3d3d3b] shadow-xs font-semibold'
                  : 'text-[#6b7a6e] hover:text-[#3d3d3b] hover:bg-[#e2dfd4]'
              }`}
            >
              <Lock className={`h-3.5 w-3.5 ${activeTab === 'security' ? 'text-[#5D6D5F]' : ''}`} />
              <span>Security & Audit</span>
            </button>
          </nav>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-[#d8d5c7]">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-8 w-8 rounded-full ring-1 ring-[#d8d5c7]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5D6D5F] text-white text-xs font-semibold">
                  {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-[#3d3d3b] max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0] || 'Member'}
                </div>
                <div className="text-[10px] text-[#6b7a6e] font-mono">
                  UID: {user.uid.slice(0, 6)}...
                </div>
              </div>
            </div>

            <button
              id="btn-sign-out"
              onClick={onSignOut}
              aria-label="Sign out of account"
              className="flex items-center gap-1.5 rounded-xl border border-[#d8d5c7] bg-white px-3 py-1.5 text-xs font-medium text-[#3d3d3b] hover:bg-[#efede5] transition-colors shadow-xs cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 text-[#5D6D5F]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
