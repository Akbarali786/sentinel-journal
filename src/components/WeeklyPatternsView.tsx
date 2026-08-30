/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TRUST BOUNDARY DECLARATION:
 * TRUST: Verified weekly report payload from authenticated server endpoint /api/patterns.
 * UNTRUSTED: Model-generated string text nodes, formatted via sanitized React nodes.
 * Numeric mood scores are range-checked (1-10) before feeding Recharts.
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RotateCw,
  CheckCircle2,
  Circle,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  BookOpen,
  Info,
  Check,
  Flame,
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { WeeklyPatternReport, MoodDataPoint, ThemeCount, OpenLoop } from '../types';
import { fetchWeeklyPatterns, toggleOpenLoopStatus, RateLimitError } from '../services/api';

interface WeeklyPatternsViewProps {
  userId: string;
  onNavigateToReflect: () => void;
  entryCount: number;
}

export const WeeklyPatternsView: React.FC<WeeklyPatternsViewProps> = ({
  userId,
  onNavigateToReflect,
  entryCount,
}) => {
  const [report, setReport] = useState<WeeklyPatternReport | null>(null);
  const [hasEnoughEntries, setHasEnoughEntries] = useState<boolean | null>(null);
  const [currentEntryCount, setCurrentEntryCount] = useState<number>(entryCount);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);
  const [selectedTheme, setSelectedTheme] = useState<ThemeCount | null>(null);
  const [loopFilter, setLoopFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [updatingLoopId, setUpdatingLoopId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Rate limit timer countdown
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const loadPatterns = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await fetchWeeklyPatterns(forceRefresh);
      setHasEnoughEntries(response.hasEnoughEntries);
      setCurrentEntryCount(response.entryCount);

      if (response.hasEnoughEntries && response.report) {
        setReport(response.report);
        if (response.report.themes && response.report.themes.length > 0) {
          setSelectedTheme(response.report.themes[0]);
        }
      } else {
        setReport(null);
      }
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        setRateLimitSeconds(err.retryAfterSeconds);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to load pattern synthesis');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatterns(false);
  }, [userId]);

  const handleToggleLoop = async (loop: OpenLoop) => {
    if (!report) return;
    const newStatus: 'open' | 'resolved' = loop.status === 'open' ? 'resolved' : 'open';
    const targetId = loop.id;

    // Optimistic UI update
    setUpdatingLoopId(targetId);
    setReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        openLoops: prev.openLoops.map((l) =>
          l.id === targetId ? { ...l, status: newStatus } : l
        ),
      };
    });

    try {
      await toggleOpenLoopStatus(report.weekKey, targetId, newStatus);
    } catch (err: any) {
      console.error('Failed to sync loop status with Firestore:', err);
      // Revert optimistic update
      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          openLoops: prev.openLoops.map((l) =>
            l.id === targetId ? { ...l, status: loop.status } : l
          ),
        };
      });
      setErrorMessage('Could not update commitment status. Please try again.');
    } finally {
      setUpdatingLoopId(null);
    }
  };

  const handleCopySummary = () => {
    if (!report) return;
    const text = `Sentinel Journal Weekly Synthesis (${report.weekKey})\n\n` +
      `Summary:\n${report.summary}\n\n` +
      `Longitudinal Insight:\n${report.growthInsight}\n\n` +
      `Recurring Themes:\n${report.themes.map((t) => `- ${t.theme} (${t.count}x): ${t.description}`).join('\n')}\n\n` +
      `Open Loops:\n${report.openLoops.map((l) => `[${l.status === 'resolved' ? 'X' : ' '}] ${l.commitment}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Safe Mood Data points range-checked strictly to 1.0 - 10.0
  const chartData = (report?.moodTrajectory || []).map((point: MoodDataPoint, idx: number) => {
    const rawScore = Number(point.score);
    const score = isNaN(rawScore) ? 5 : Math.max(1, Math.min(10, rawScore));
    return {
      index: idx + 1,
      date: point.date,
      displayDate: point.displayDate || point.date,
      score,
      emotion: point.emotion || 'Reflective',
      context: point.context || '',
    };
  });

  // Filter open loops
  const filteredLoops = (report?.openLoops || []).filter((loop) => {
    if (loopFilter === 'open') return loop.status === 'open';
    if (loopFilter === 'resolved') return loop.status === 'resolved';
    return true;
  });

  const totalLoopsCount = report?.openLoops?.length || 0;
  const openLoopsCount = (report?.openLoops || []).filter((l) => l.status === 'open').length;
  const resolvedLoopsCount = totalLoopsCount - openLoopsCount;

  // Compute average mood safely
  const avgMood = chartData.length > 0
    ? (chartData.reduce((acc, curr) => acc + curr.score, 0) / chartData.length).toFixed(1)
    : '—';

  // 1. Initial Full Loading State
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-12 px-4">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-[#d8d5c7] bg-white p-12 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#efede5] text-[#5D6D5F] mb-4 animate-spin">
            <RotateCw className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#3d3d3b]">Synthesizing Longitudinal Patterns</h3>
          <p className="mt-2 text-sm text-[#6b7a6e] max-w-md">
            Scanning recent journal reflections to trace emotional arcs, recurring conceptual themes, and open self-commitments...
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[#5D6D5F]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Running strict schema validation ladder</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Clear Empty State (< 2 reflections)
  if (hasEnoughEntries === false || currentEntryCount < 2) {
    const needed = 2 - currentEntryCount;
    const progressPercent = Math.min(100, Math.round((currentEntryCount / 2) * 100));

    return (
      <div className="mx-auto max-w-5xl py-8 px-4">
        {/* Top Header Card */}
        <div className="rounded-3xl border border-[#d8d5c7] bg-white p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#efede5] px-3 py-1 text-xs font-semibold text-[#5D6D5F] border border-[#d8d5c7]">
                <Layers className="h-3.5 w-3.5" />
                <span>Pattern Engine • Longitudinal Synthesis</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#3d3d3b] pt-1">
                Synthesize Your Growth & Emotional Trajectory
              </h2>
              <p className="text-sm text-[#6b7a6e] max-w-xl">
                The Pattern Engine uncovers recurring behavioral themes, tracks emotional momentum across entries, and extracts open loops you committed to resolving.
              </p>
            </div>

            <button
              id="btn-empty-reflect"
              onClick={onNavigateToReflect}
              className="flex items-center gap-2 rounded-2xl bg-[#5A5A40] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#484833] transition-all cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4" />
              <span>Write a Reflection</span>
            </button>
          </div>
        </div>

        {/* Empty State Instruction & Progress Box */}
        <div className="rounded-3xl border border-[#d8d5c7] bg-[#efede5]/60 p-8 sm:p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#5D6D5F] shadow-xs border border-[#d8d5c7] mb-5">
            <Activity className="h-8 w-8 text-[#5D6D5F]" />
          </div>

          <h3 className="font-serif text-xl font-bold text-[#3d3d3b]">
            More Reflections Needed for Longitudinal Synthesis
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm text-[#6b7a6e] leading-relaxed">
            Longitudinal pattern synthesis requires at least <strong>2 journal entries</strong> to trace recurring themes, mood trajectories, and self-commitments across time.
          </p>

          {/* Progress Tracker */}
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-white border border-[#d8d5c7] p-4 text-left shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-[#3d3d3b] mb-2">
              <span className="flex items-center gap-1.5 font-semibold">
                <Flame className="h-4 w-4 text-[#5D6D5F]" />
                Synthesis Readiness
              </span>
              <span className="font-mono text-[#5D6D5F] font-bold">
                {currentEntryCount} of 2 reflections ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#efede5]">
              <div
                className="h-full rounded-full bg-[#5D6D5F] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2.5 text-[11px] text-[#6b7a6e]">
              {needed > 0
                ? `Record ${needed} more ${needed === 1 ? 'reflection' : 'reflections'} to unlock weekly synthesis charts and open loops tracking.`
                : 'Ready for pattern synthesis!'}
            </p>
          </div>

          {/* Feature Preview Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl border border-[#d8d5c7] bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#efede5] text-[#5D6D5F] mb-3">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#3d3d3b]">1-10 Mood Trajectory</h4>
              <p className="mt-1 text-xs text-[#6b7a6e] leading-normal">
                Visual timeline mapping emotional resilience and shifts across your reflections on a strictly range-checked 1-10 scale.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d8d5c7] bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#efede5] text-[#5D6D5F] mb-3">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#3d3d3b]">Recurring Themes</h4>
              <p className="mt-1 text-xs text-[#6b7a6e] leading-normal">
                Frequency analysis extracting recurring emotional and conceptual topics that surface across separate sessions.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d8d5c7] bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#efede5] text-[#5D6D5F] mb-3">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-[#3d3d3b]">Open Loops Checklist</h4>
              <p className="mt-1 text-xs text-[#6b7a6e] leading-normal">
                Extracts personal commitments made in entries that haven't been resolved yet, syncing directly to Firestore.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Weekly Pattern Synthesis Report
  return (
    <div className="mx-auto max-w-6xl pb-16 px-4 sm:px-6 space-y-8">
      
      {/* Top Banner & Action Bar */}
      <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efede5] px-3 py-1 text-xs font-semibold text-[#5D6D5F] border border-[#d8d5c7]">
                <Calendar className="h-3.5 w-3.5" />
                <span>Week {report?.weekKey || 'Report'}</span>
              </span>

              {report?.isCached && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f8f6f2] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7a6e] border border-[#d8d5c7]">
                  <Info className="h-3 w-3 text-[#5D6D5F]" />
                  Cached weekly report
                </span>
              )}

              <span className="text-xs text-[#6b7a6e]">
                Analyzed across <strong>{report?.entryCount || currentEntryCount}</strong> reflections
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#3d3d3b]">
              Weekly Synthesis & Pattern Engine
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#6b7a6e]">
              Longitudinal analysis of emotional momentum, recurring themes, and personal commitments.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto">
            <button
              id="btn-refresh-patterns"
              onClick={() => loadPatterns(true)}
              disabled={isRefreshing || rateLimitSeconds > 0}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-2xl border border-[#d8d5c7] bg-white px-4 py-2.5 text-xs font-semibold text-[#3d3d3b] hover:bg-[#efede5] transition-all shadow-xs cursor-pointer ${
                isRefreshing || rateLimitSeconds > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Regenerate synthesis from latest entries"
            >
              <RotateCw className={`h-3.5 w-3.5 text-[#5D6D5F] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing
                  ? 'Synthesizing...'
                  : rateLimitSeconds > 0
                  ? `Wait ${rateLimitSeconds}s`
                  : 'Refresh Synthesis'}
              </span>
            </button>

            <button
              id="btn-copy-synthesis"
              onClick={handleCopySummary}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#5A5A40] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#484833] transition-all cursor-pointer"
            >
              {copiedSummary ? <Check className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
              <span>{copiedSummary ? 'Copied' : 'Export Report'}</span>
            </button>
          </div>
        </div>

        {/* Rate limit or general error notice */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Synthesis Executive Summary & Growth Insight */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5D6D5F] mb-2">
                <Sparkles className="h-4 w-4" />
                <span>Weekly Synthesis Overview</span>
              </div>
              <p className="font-serif text-base sm:text-lg text-[#3d3d3b] leading-relaxed">
                "{report.summary}"
              </p>
            </div>

            {report.growthInsight && (
              <div className="mt-6 rounded-2xl border border-[#d8d5c7] bg-[#efede5]/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] mb-1">
                  <Award className="h-4 w-4" />
                  <span>Longitudinal Growth Observation</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3d3d3b] leading-relaxed">
                  {report.growthInsight}
                </p>
              </div>
            )}
          </div>

          {/* Quick Metrics Column */}
          <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7a6e] mb-4">
                Longitudinal Overview
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#efede5] pb-3">
                  <span className="text-xs text-[#6b7a6e]">Average Mood Score</span>
                  <span className="font-serif text-xl font-bold text-[#5A5A40]">{avgMood} <span className="text-xs font-sans text-[#6b7a6e]">/ 10</span></span>
                </div>

                <div className="flex items-center justify-between border-b border-[#efede5] pb-3">
                  <span className="text-xs text-[#6b7a6e]">Recurring Themes</span>
                  <span className="text-sm font-bold text-[#3d3d3b]">{report.themes?.length || 0} identified</span>
                </div>

                <div className="flex items-center justify-between border-b border-[#efede5] pb-3">
                  <span className="text-xs text-[#6b7a6e]">Self-Commitments</span>
                  <span className="text-sm font-bold text-[#3d3d3b]">
                    {openLoopsCount} open <span className="text-xs font-normal text-[#6b7a6e]">({resolvedLoopsCount} done)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6b7a6e]">Time Horizon</span>
                  <span className="text-xs font-mono font-medium text-[#5D6D5F]">
                    {report.startDate} → {report.endDate}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToReflect}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#efede5] py-2.5 text-xs font-semibold text-[#5A5A40] hover:bg-[#e2dfd4] transition-colors cursor-pointer border border-[#d8d5c7]"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Add New Reflection Entry</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: Mood Trajectory (Fixed 1-10 Scale Chart) */}
      <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5D6D5F] mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Emotional Arc</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#3d3d3b]">
              Mood Trajectory (1-10 Scale)
            </h3>
            <p className="text-xs text-[#6b7a6e]">
              Timeline tracking emotional baseline vs flourishing moments across journal reflections.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#6b7a6e]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#5D6D5F]" /> Score (1-10)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-[#d8d5c7]" /> Baseline (5.0)
            </span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-72 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#efede5" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: '#6b7a6e', fontSize: 11 }}
                  axisLine={{ stroke: '#d8d5c7' }}
                  tickLine={{ stroke: '#d8d5c7' }}
                  dy={10}
                />
                <YAxis
                  domain={[1, 10]}
                  ticks={[1, 3, 5, 7, 9, 10]}
                  tick={{ fill: '#6b7a6e', fontSize: 11 }}
                  axisLine={{ stroke: '#d8d5c7' }}
                  tickLine={{ stroke: '#d8d5c7' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-[#d8d5c7] bg-white p-3.5 shadow-md text-xs max-w-xs space-y-1.5 z-40">
                          <div className="flex items-center justify-between gap-2 border-b border-[#efede5] pb-1.5">
                            <span className="font-semibold text-[#3d3d3b]">{data.displayDate}</span>
                            <span className="rounded-full bg-[#efede5] px-2 py-0.5 font-mono text-[11px] font-bold text-[#5D6D5F]">
                              {data.score} / 10
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-[#5A5A40]">
                            Emotion: <span className="font-semibold text-[#3d3d3b]">{data.emotion}</span>
                          </div>
                          {data.context && (
                            <div className="text-[11px] text-[#6b7a6e] leading-snug">
                              "{data.context}"
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={5} stroke="#d8d5c7" strokeDasharray="4 4" label={{ value: 'Baseline', position: 'right', fill: '#8c8a82', fontSize: 10 }} />
                <ReferenceLine y={8} stroke="#85929E" strokeDasharray="3 3" label={{ value: 'Flourishing', position: 'right', fill: '#5D6D5F', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#5D6D5F"
                  strokeWidth={2.5}
                  dot={{ r: 4.5, fill: '#5A5A40', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#5D6D5F', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-[#efede5]/40 text-xs text-[#6b7a6e]">
            No mood trajectory data available.
          </div>
        )}
      </div>

      {/* SECTION 2: Recurring Themes with Frequency Counts */}
      <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5D6D5F] mb-1">
          <Layers className="h-4 w-4" />
          <span>Pattern Extraction</span>
        </div>
        <h3 className="font-serif text-xl font-bold text-[#3d3d3b] mb-1">
          Recurring Themes & Frequency Counts
        </h3>
        <p className="text-xs text-[#6b7a6e] mb-6">
          Topics, mindsets, or stressors that surfaced across multiple journal entries this week.
        </p>

        {report?.themes && report.themes.length > 0 ? (
          <div className="space-y-6">
            {/* Interactive Theme Chips */}
            <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Recurring Themes">
              {report.themes.map((themeObj, i) => {
                const isSelected = selectedTheme?.theme === themeObj.theme;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedTheme(themeObj)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                        : 'bg-[#efede5]/60 text-[#3d3d3b] border-[#d8d5c7] hover:bg-[#e2dfd4]'
                    }`}
                  >
                    <span className="font-semibold">{themeObj.theme}</span>
                    <span
                      className={`inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#d8d5c7] text-[#3d3d3b]'
                      }`}
                    >
                      {themeObj.count}×
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Theme Detail Card */}
            {selectedTheme && (
              <div className="rounded-2xl border border-[#d8d5c7] bg-[#efede5]/40 p-5 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-serif text-base font-bold text-[#3d3d3b]">
                    {selectedTheme.theme}
                  </h4>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#5D6D5F] border border-[#d8d5c7]">
                    Frequency: {selectedTheme.count} occurrences
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#52524e] leading-relaxed">
                  {selectedTheme.description}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#efede5]/40 p-6 text-center text-xs text-[#6b7a6e]">
            No recurring themes detected in this period.
          </div>
        )}
      </div>

      {/* SECTION 3: Open Loops & Self-Commitments Tracker */}
      <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5D6D5F] mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Commitment Tracker</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#3d3d3b]">
              Extracted Open Loops
            </h3>
            <p className="text-xs text-[#6b7a6e]">
              Promises, intentions, and commitments you made to yourself in previous entries.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-2xl bg-[#efede5] p-1 border border-[#d8d5c7]">
            <button
              onClick={() => setLoopFilter('all')}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition-all ${
                loopFilter === 'all'
                  ? 'bg-white text-[#3d3d3b] shadow-xs font-semibold'
                  : 'text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              All ({totalLoopsCount})
            </button>
            <button
              onClick={() => setLoopFilter('open')}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition-all ${
                loopFilter === 'open'
                  ? 'bg-white text-[#3d3d3b] shadow-xs font-semibold'
                  : 'text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              Open ({openLoopsCount})
            </button>
            <button
              onClick={() => setLoopFilter('resolved')}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition-all ${
                loopFilter === 'resolved'
                  ? 'bg-white text-[#3d3d3b] shadow-xs font-semibold'
                  : 'text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              Resolved ({resolvedLoopsCount})
            </button>
          </div>
        </div>

        {filteredLoops.length > 0 ? (
          <div className="space-y-3">
            {filteredLoops.map((loop) => {
              const isResolved = loop.status === 'resolved';
              const isUpdating = updatingLoopId === loop.id;

              return (
                <div
                  key={loop.id}
                  onClick={() => handleToggleLoop(loop)}
                  className={`group flex items-start gap-3.5 rounded-2xl border p-4 transition-all cursor-pointer ${
                    isResolved
                      ? 'border-[#efede5] bg-[#faf9f6] opacity-75'
                      : 'border-[#d8d5c7] bg-white hover:border-[#5D6D5F] hover:shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    aria-label={isResolved ? 'Mark as open' : 'Mark as resolved'}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                      isResolved
                        ? 'border-[#5D6D5F] bg-[#5D6D5F] text-white'
                        : 'border-[#d8d5c7] bg-white group-hover:border-[#5D6D5F]'
                    }`}
                  >
                    {isUpdating ? (
                      <RotateCw className="h-3 w-3 animate-spin text-[#5D6D5F]" />
                    ) : isResolved ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <Circle className="h-3 w-3 text-transparent" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm leading-snug ${
                        isResolved
                          ? 'text-[#8c8a82] line-through decoration-[#d8d5c7]'
                          : 'font-medium text-[#3d3d3b]'
                      }`}
                    >
                      {loop.commitment}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#6b7a6e]">
                      <span className="font-mono">From entry date: {loop.entryDate}</span>
                      {isResolved && (
                        <span className="inline-flex items-center gap-1 text-[#5D6D5F] font-semibold">
                          • Resolved & synced to Firestore
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d8d5c7] bg-[#efede5]/30 p-8 text-center text-xs text-[#6b7a6e]">
            {loopFilter === 'resolved'
              ? 'No resolved self-commitments yet. Tick off open loops above as you complete them.'
              : loopFilter === 'open'
              ? 'All open loops have been marked resolved! Fantastic self-accountability.'
              : 'No open loops extracted from these entries.'}
          </div>
        )}
      </div>

    </div>
  );
};
