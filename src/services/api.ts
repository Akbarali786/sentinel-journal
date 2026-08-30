/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TRUST BOUNDARY DECLARATION:
 * Client API & Firestore Data Layer.
 * Model calls proxy to Cloud Run backend (keeping GEMINI_API_KEY server-side).
 * User data CRUD routes directly through Firestore client SDK enforcing strict security rules.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { ClassificationResult, ReflectResponsePayload, JournalInteraction, AuditEvent, PatternEngineResponse, OpenLoop } from '../types';

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  correlationId: string;

  constructor(message: string, retryAfterSeconds: number = 60, correlationId: string = 'N/A') {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
    this.correlationId = correlationId;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated. Please sign in to continue.');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function checkServerHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch('/healthz');
  if (!res.ok) {
    throw new Error('Health check failed');
  }
  return res.json();
}

// 1. Gemini Content Classifier (Server-side proxy)
export async function classifyContent(
  text: string
): Promise<ClassificationResult> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/journal/classify', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, idempotencyKey: crypto.randomUUID() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Classification failed' }));
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10) || (err.retryAfterSeconds ?? 60);
      throw new RateLimitError(err.error || 'Rate limit reached', retryAfter, err.correlationId);
    }
    throw new Error(err.error || `Classification request failed with status ${res.status}`);
  }

  return res.json();
}

// 2. Gemini Reflective Thinking Partner (Server-side proxy)
export async function requestReflection(params: {
  interactionId: string;
  prompt: string;
  referenceMaterial?: string;
  history: Array<{ sender: 'user' | 'gemini'; text: string }>;
  tone: string;
  overrideQuarantine?: boolean;
  idempotencyKey?: string;
}): Promise<ReflectResponsePayload> {
  const headers = await getAuthHeaders();
  const idempotencyKey = params.idempotencyKey || crypto.randomUUID();

  const res = await fetch('/api/journal/reflect', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...params, idempotencyKey }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Reflection generation failed' }));
    const correlationId = err.correlationId || 'N/A';
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10) || (err.retryAfterSeconds ?? 60);
      throw new RateLimitError(
        err.error || `Rate limit reached. Please wait ${retryAfter}s.`,
        retryAfter,
        correlationId
      );
    }
    const errorMsg = err.error || `Server error (${res.status})`;
    throw new Error(`${errorMsg} (Correlation ID: ${correlationId})`);
  }

  return res.json();
}

// 3. User Journal Interactions (Isolated /users/{uid}/interactions in Firestore)
export async function fetchInteractions(): Promise<JournalInteraction[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = `users/${user.uid}/interactions`;
  try {
    const q = query(
      collection(db, 'users', user.uid, 'interactions'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<JournalInteraction, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveInteraction(
  interaction: Partial<JournalInteraction> & { id: string }
): Promise<JournalInteraction> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated');
  }

  const path = `users/${user.uid}/interactions/${interaction.id}`;
  try {
    const cleanData: JournalInteraction = {
      id: interaction.id,
      uid: user.uid,
      title: interaction.title || 'Untitled Thought',
      summary: interaction.summary || '',
      keyThemes: interaction.keyThemes || [],
      suggestedQuestions: interaction.suggestedQuestions || [],
      messages: interaction.messages || [],
      modelFallbackDepth: interaction.modelFallbackDepth,
      primaryModelUsed: interaction.primaryModelUsed,
      quarantineTriggered: Boolean(interaction.quarantineTriggered),
      wellbeingFlag: Boolean(interaction.wellbeingFlag),
      createdAt: interaction.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Strip undefined fields
    const sanitized = JSON.parse(JSON.stringify(cleanData));

    await setDoc(doc(db, 'users', user.uid, 'interactions', interaction.id), sanitized, { merge: true });
    
    // Log audit event asynchronously
    addAuditEvent({
      eventType: 'save_interaction' as any,
      details: `Saved interaction ${interaction.id}`,
    }).catch((e) => console.warn('Non-blocking audit write:', e));

    return cleanData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInteraction(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User is not authenticated');

  const path = `users/${user.uid}/interactions/${id}`;
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'interactions', id));
    
    addAuditEvent({
      eventType: 'delete_interaction',
      details: `Deleted interaction ${id}`,
    }).catch((e) => console.warn('Non-blocking audit write:', e));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 4. Audit Trail (Isolated /users/{uid}/audit in Firestore)
export async function addAuditEvent(event: { eventType: AuditEvent['eventType'] | 'save_interaction'; details: string; metadata?: Record<string, any> }): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/audit`;
  try {
    await addDoc(collection(db, 'users', user.uid, 'audit'), {
      ...event,
      uid: user.uid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Non-blocking log
    console.warn('Audit log write failed:', error);
  }
}

// 4.5 Record Sign-In Event in Audit Trail (Directive 11)
export async function recordSignInAuditEvent(): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.warn('[Audit] Non-blocking sign-in audit notice:', err);
  }
}

export async function fetchAuditLogs(): Promise<AuditEvent[]> {
  const user = auth.currentUser;
  if (!user) return [];

  // Primary: Fetch from backend API endpoint
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/user/audit', {
      method: 'GET',
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.logs)) {
        return data.logs;
      }
    }
  } catch {
    // Fallback to Firestore client read
  }

  const path = `users/${user.uid}/audit`;
  try {
    const q = query(
      collection(db, 'users', user.uid, 'audit'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<AuditEvent, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 5. Directive 13: Data Rights (Export My Data & Delete My Account)
export interface CompleteDataExport {
  exportMetadata: {
    application: string;
    version: string;
    exportedAt: string;
    tenantUid: string;
    totalInteractions: number;
    totalWeeklyReports: number;
    totalAuditEvents: number;
  };
  interactions: JournalInteraction[];
  weeklyReports: any[];
  auditLogs: AuditEvent[];
}

export async function exportUserData(): Promise<CompleteDataExport> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/user/export', {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(err.error || 'Failed to export user journal data');
  }

  return res.json();
}

export async function deleteAccountData(confirmationText: string): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/user/delete-account', {
    method: 'POST',
    headers,
    body: JSON.stringify({ confirmationText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Account deletion failed' }));
    throw new Error(err.error || 'Failed to delete account');
  }

  return res.json();
}

// 6. Pattern Engine: Longitudinal Synthesis & Open Loops
export async function fetchWeeklyPatterns(
  forceRefresh: boolean = false,
  weekKey?: string
): Promise<PatternEngineResponse> {
  const headers = await getAuthHeaders();
  const queryParams = new URLSearchParams();
  if (forceRefresh) queryParams.set('forceRefresh', 'true');
  if (weekKey) queryParams.set('weekKey', weekKey);

  const res = await fetch(`/api/patterns?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Pattern synthesis failed' }));
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10) || (err.retryAfterSeconds ?? 60);
      throw new RateLimitError(err.error || 'Rate limit reached', retryAfter, err.correlationId);
    }
    throw new Error(err.error || `Pattern synthesis request failed with status ${res.status}`);
  }

  return res.json();
}

export async function toggleOpenLoopStatus(
  weekKey: string,
  loopId: string,
  status: 'open' | 'resolved'
): Promise<{ success: boolean; loop: OpenLoop; weekKey: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/patterns/toggle-loop', {
    method: 'POST',
    headers,
    body: JSON.stringify({ weekKey, loopId, status }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update commitment' }));
    throw new Error(err.error || 'Failed to update commitment status');
  }

  return res.json();
}


