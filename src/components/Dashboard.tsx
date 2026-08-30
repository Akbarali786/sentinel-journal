/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DIRECTIVE 13: MAIN AUTHENTICATED DASHBOARD
 * Orchestrates navigation tabs, journal editor sessions, past interactions cache,
 * and security audit state.
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, JournalInteraction } from '../types';
import { Navbar } from './Navbar';
import { JournalEditor } from './JournalEditor';
import { HistoryBrowser } from './HistoryBrowser';
import { SecurityAuditView } from './SecurityAuditView';
import { WeeklyPatternsView } from './WeeklyPatternsView';
import { fetchInteractions } from '../services/api';

interface DashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'reflect' | 'patterns' | 'history' | 'security'>('reflect');
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [currentInteraction, setCurrentInteraction] = useState<JournalInteraction | null>(null);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(true);

  // Load interactions from isolated Firestore endpoint
  const loadUserInteractions = async () => {
    setIsLoadingInteractions(true);
    try {
      const data = await fetchInteractions();
      setInteractions(data);
    } catch (err) {
      console.warn('Failed to load interactions:', err);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  useEffect(() => {
    loadUserInteractions();
  }, [user.uid]);

  const handleInteractionSaved = (saved: JournalInteraction) => {
    setInteractions((prev) => {
      const existsIndex = prev.findIndex((i) => i.id === saved.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleInteractionDeleted = (id: string) => {
    setInteractions((prev) => prev.filter((i) => i.id !== id));
    if (currentInteraction?.id === id) {
      setCurrentInteraction(null);
    }
  };

  const handleSelectInteraction = (interaction: JournalInteraction) => {
    setCurrentInteraction(interaction);
    setActiveTab('reflect');
  };

  const handleNewSession = () => {
    setCurrentInteraction(null);
    setActiveTab('reflect');
  };

  const handlePurgeSuccess = () => {
    setInteractions([]);
    setCurrentInteraction(null);
    setActiveTab('reflect');
  };

  return (
    <div className="min-h-screen bg-[#f8f6f2] text-[#3d3d3b] flex flex-col selection:bg-[#d8d5c7] selection:text-[#3d3d3b]">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={onSignOut}
        interactionCount={interactions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'reflect' && (
          <JournalEditor
            currentInteraction={currentInteraction}
            onInteractionSaved={handleInteractionSaved}
            onNewSession={handleNewSession}
            userId={user.uid}
          />
        )}

        {activeTab === 'patterns' && (
          <WeeklyPatternsView
            userId={user.uid}
            onNavigateToReflect={() => setActiveTab('reflect')}
            entryCount={interactions.length}
          />
        )}

        {activeTab === 'history' && (
          <HistoryBrowser
            interactions={interactions}
            onSelectInteraction={handleSelectInteraction}
            onInteractionDeleted={handleInteractionDeleted}
            onStartNew={handleNewSession}
          />
        )}

        {activeTab === 'security' && (
          <SecurityAuditView
            userId={user.uid}
            onPurgeSuccess={handlePurgeSuccess}
            onSignOut={onSignOut}
          />
        )}
      </main>

      {/* Discreet Footer */}
      <footer className="border-t border-[#d8d5c7] bg-[#efede5]/80 py-4 text-center text-xs text-[#6b7a6e]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sentinel • Thought Sanctuary • Isolated in Firestore</span>
          <span className="font-mono text-[11px] text-[#5D6D5F]">User: {user.email || user.uid}</span>
        </div>
      </footer>

    </div>
  );
};
