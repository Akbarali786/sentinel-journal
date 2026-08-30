/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TRUST BOUNDARY DECLARATION:
 * Client-side domain types. UNTRUSTED: server responses and user text inputs.
 * All properties are verified via runtime Zod contracts where applicable.
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type ReflectionTone = 'reflective' | 'socratic' | 'clarifying' | 'synthesizing' | 'philosophical';

export interface JournalMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string; // ISO string
  modelUsed?: string;
  referenceMaterial?: string;
  quarantined?: boolean;
  injectionVerdict?: 'clean' | 'suspicious' | 'injection';
  injectionSignals?: string[];
  quarantineOverridden?: boolean;
}

export interface JournalInteraction {
  id: string;
  uid: string;
  title: string;
  summary: string;
  keyThemes: string[];
  suggestedQuestions: string[];
  messages: JournalMessage[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  modelFallbackDepth?: number;
  primaryModelUsed?: string;
  quarantineTriggered?: boolean;
  wellbeingFlag?: boolean;
}

export interface ClassificationResult {
  verdict: 'clean' | 'suspicious' | 'injection';
  signals: string[];
  confidence: number;
}

export interface ReflectResponsePayload {
  reply: string;
  summary: string;
  keyThemes: string[];
  deepeningQuestions: string[];
  modelUsed: string;
  fallbackDepth: number;
  wellbeingNotice?: boolean;
  quarantined?: boolean;
  injectionVerdict?: 'clean' | 'suspicious' | 'injection';
  injectionSignals?: string[];
  correlationId: string;
}

export type AuditEventType = 
  | 'sign_in' 
  | 'quarantine_trigger' 
  | 'quarantine_override' 
  | 'pattern_report_generated' 
  | 'data_export' 
  | 'account_deletion'
  | 'reflect_entry'
  | 'toggle_loop';

export interface AuditEvent {
  id: string;
  uid?: string;
  eventType: AuditEventType | string;
  details: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  timestamp: string;
  ipHash?: string;
}

export interface RateLimitState {
  remaining: number;
  resetSeconds: number;
  total: number;
}

export interface ThemeCount {
  theme: string;
  count: number;
  description: string;
}

export interface MoodDataPoint {
  date: string;
  displayDate: string;
  score: number; // strictly 1 to 10
  emotion: string;
  context: string;
}

export interface OpenLoop {
  id: string;
  commitment: string;
  entryId: string;
  entryDate: string;
  status: 'open' | 'resolved';
  resolvedInEntryId?: string;
  notes?: string;
}

export interface WeeklyPatternReport {
  id: string;
  uid: string;
  weekKey: string;
  startDate: string;
  endDate: string;
  summary: string;
  growthInsight: string;
  themes: ThemeCount[];
  moodTrajectory: MoodDataPoint[];
  openLoops: OpenLoop[];
  entryCount: number;
  createdAt: string;
  updatedAt: string;
  isCached?: boolean;
}

export interface PatternEngineResponse {
  hasEnoughEntries: boolean;
  entryCount: number;
  minRequired: number;
  message?: string;
  report?: WeeklyPatternReport;
  cached?: boolean;
  correlationId?: string;
}

