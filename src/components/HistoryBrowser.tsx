/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DIRECTIVE 3, 6, 13: PAST JOURNAL INTERACTIONS BROWSER
 * Enables browsing history of past entries isolated per user in Firestore,
 * filtering by themes, searching content, and viewing full transcripts.
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Trash2, 
  BookOpen, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Filter, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { JournalInteraction } from '../types';
import { deleteInteraction } from '../services/api';

interface HistoryBrowserProps {
  interactions: JournalInteraction[];
  onSelectInteraction: (interaction: JournalInteraction) => void;
  onInteractionDeleted: (id: string) => void;
  onStartNew: () => void;
}

export const HistoryBrowser: React.FC<HistoryBrowserProps> = ({
  interactions,
  onSelectInteraction,
  onInteractionDeleted,
  onStartNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewInteraction, setPreviewInteraction] = useState<JournalInteraction | null>(null);

  // Extract all unique themes from user interactions
  const allThemes = useMemo(() => {
    const themeSet = new Set<string>();
    interactions.forEach((item) => {
      item.keyThemes?.forEach((t) => themeSet.add(t));
    });
    return Array.from(themeSet);
  }, [interactions]);

  // Filter interactions based on search text and theme
  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.messages?.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTheme =
        !selectedTheme || item.keyThemes?.includes(selectedTheme);

      return matchesSearch && matchesTheme;
    });
  }, [interactions, searchQuery, selectedTheme]);

  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      await deleteInteraction(id);
      onInteractionDeleted(id);
      if (previewInteraction?.id === id) {
        setPreviewInteraction(null);
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setIsDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      
      {/* Header with Search and Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A5A40]">
            Journal History
          </h2>
          <p className="text-xs text-[#6b7a6e] mt-0.5">
            {interactions.length} isolated reflection{interactions.length === 1 ? '' : 's'} stored under your authenticated sanctuary
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6b7a6e]" />
          <input
            id="input-history-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections, thoughts..."
            className="w-full rounded-2xl border border-[#d8d5c7] bg-white pl-10 pr-4 py-2.5 text-xs text-[#3d3d3b] placeholder:text-[#6b7a6e]/60 placeholder:italic focus:border-[#5D6D5F] focus:outline-hidden shadow-xs"
          />
        </div>
      </div>

      {/* Theme Filters */}
      {allThemes.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <span className="text-xs font-bold text-[#6b7a6e] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" /> Themes:
          </span>
          <button
            onClick={() => setSelectedTheme(null)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              selectedTheme === null
                ? 'bg-[#5D6D5F] text-white shadow-xs'
                : 'bg-[#e2dfd4] text-[#3d3d3b] hover:bg-[#d8d5c7]'
            }`}
          >
            All ({interactions.length})
          </button>
          {allThemes.map((theme) => (
            <button
              key={theme}
              onClick={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                selectedTheme === theme
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-white border border-[#d8d5c7] text-[#3d3d3b] hover:border-[#5D6D5F]'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Interactions */}
      {filteredInteractions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d8d5c7] bg-[#efede5]/60 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-[#6b7a6e] mb-3" />
          <h3 className="font-serif text-xl font-bold text-[#5A5A40]">
            No reflections found
          </h3>
          <p className="text-xs text-[#6b7a6e] max-w-sm mx-auto mt-1 leading-relaxed">
            {searchQuery || selectedTheme
              ? 'Try changing your search keywords or clearing theme filters.'
              : 'You have not created any journal entries yet. Start your first reflection with the thinking partner.'}
          </p>
          <button
            onClick={onStartNew}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5D6D5F] hover:bg-[#5A5A40] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>Begin New Reflection</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInteractions.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl border border-[#d8d5c7] bg-white p-5 sm:p-6 shadow-xs hover:border-[#5D6D5F] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Header: Date & Controls */}
                <div className="flex items-center justify-between text-[11px] text-[#6b7a6e] mb-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-[#5D6D5F]" />
                    <span>{new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.primaryModelUsed && (
                      <span className="rounded-full bg-[#efede5] border border-[#d8d5c7] px-2 py-0.5 text-[10px] font-mono text-[#5D6D5F]">
                        {item.primaryModelUsed.replace('gemini-', '')}
                      </span>
                    )}

                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                        <span className="text-[10px] text-rose-800 font-semibold px-1">Delete?</span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeletingId === item.id}
                          className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded hover:bg-rose-700"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[10px] text-[#3d3d3b] px-1 hover:text-black"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#6b7a6e] hover:text-rose-600 rounded-md transition-all"
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-serif text-lg font-bold text-[#3d3d3b] group-hover:text-[#5A5A40] transition-colors line-clamp-1">
                  {item.title || 'Untitled Reflection'}
                </h3>

                {/* Summary */}
                {item.summary && (
                  <p className="mt-1.5 text-xs text-[#3d3d3b]/80 line-clamp-2 leading-relaxed italic font-serif">
                    "{item.summary}"
                  </p>
                )}

                {/* Message count snippet */}
                <div className="mt-2 text-[11px] text-[#6b7a6e]">
                  {item.messages?.length || 0} reflection turn{(item.messages?.length || 0) === 1 ? '' : 's'}
                </div>

                {/* Themes chips */}
                {item.keyThemes && item.keyThemes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.keyThemes.slice(0, 3).map((theme, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-[#e2dfd4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3d3d3b]"
                      >
                        {theme}
                      </span>
                    ))}
                    {item.keyThemes.length > 3 && (
                      <span className="rounded-md bg-[#efede5] px-1.5 py-0.5 text-[10px] text-[#6b7a6e]">
                        +{item.keyThemes.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-[#efede5] flex items-center justify-between">
                <button
                  onClick={() => setPreviewInteraction(item)}
                  className="text-xs text-[#6b7a6e] hover:text-[#3d3d3b] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>View Transcript</span>
                </button>

                <button
                  onClick={() => onSelectInteraction(item)}
                  className="flex items-center gap-1.5 rounded-full bg-[#efede5] hover:bg-[#5D6D5F] px-4 py-1.5 text-xs font-semibold text-[#3d3d3b] hover:text-white transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript Inspection Modal Drawer */}
      {previewInteraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#f8f6f2] shadow-2xl flex flex-col overflow-hidden border border-[#d8d5c7] animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#d8d5c7] flex items-start justify-between gap-4 bg-[#efede5]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#5A5A40]">
                  {previewInteraction.title}
                </h3>
                <div className="text-xs text-[#6b7a6e] mt-1 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#5D6D5F]" />
                  <span>{new Date(previewInteraction.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>{previewInteraction.messages?.length || 0} turns</span>
                </div>
              </div>

              <button
                onClick={() => setPreviewInteraction(null)}
                className="rounded-xl p-1.5 text-[#6b7a6e] hover:bg-[#d8d5c7] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {previewInteraction.summary && (
                <div className="rounded-2xl bg-white border border-[#d8d5c7] p-4 text-xs shadow-xs">
                  <div className="font-bold text-[#a67c52] uppercase tracking-wider mb-1">Core Reflection Summary</div>
                  <p className="text-[#3d3d3b] font-serif italic text-sm leading-relaxed">{previewInteraction.summary}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {previewInteraction.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#e2dfd4] text-[#3d3d3b] ml-4'
                        : 'bg-white text-[#3d3d3b] border border-[#d8d5c7] mr-4 shadow-xs'
                    }`}
                  >
                    <div className={`font-bold mb-1 uppercase tracking-wider text-[10px] ${msg.sender === 'user' ? 'text-[#5A5A40]' : 'text-[#5D6D5F]'}`}>
                      {msg.sender === 'user' ? 'You' : 'Sentinel'}
                    </div>
                    <div className={`${msg.sender === 'gemini' ? 'font-serif text-sm' : ''} text-[#3d3d3b] whitespace-pre-wrap`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#d8d5c7] bg-[#efede5] flex items-center justify-between">
              <button
                onClick={() => setPreviewInteraction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6b7a6e] hover:bg-[#d8d5c7] transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const target = previewInteraction;
                  setPreviewInteraction(null);
                  onSelectInteraction(target);
                }}
                className="flex items-center gap-2 rounded-full bg-[#5D6D5F] hover:bg-[#5A5A40] px-5 py-2 text-xs font-semibold text-white transition-colors"
              >
                <span>Continue This Reflection</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
