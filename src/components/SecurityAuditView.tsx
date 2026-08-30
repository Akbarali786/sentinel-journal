/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DIRECTIVE 11 & 13: SECURITY AUDIT TRAIL & DATA RIGHTS
 * Append-only cryptographic audit stream, metadata-only trust view,
 * user-controlled data export (JSON), and verified account deletion with recursive wipe.
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Download, 
  Trash2, 
  RefreshCw, 
  Activity, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  LogIn,
  ShieldAlert,
  Flame,
  Sparkles,
  FileSpreadsheet,
  Info,
  Check,
  Calendar,
  Search
} from 'lucide-react';
import { AuditEvent, AuditEventType } from '../types';
import { fetchAuditLogs, exportUserData, deleteAccountData } from '../services/api';

interface SecurityAuditViewProps {
  userId: string;
  onPurgeSuccess?: () => void;
  onSignOut?: () => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  userId,
  onPurgeSuccess,
  onSignOut,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notifications
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await fetchAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.warn('[AuditView] Audit fetch notification:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userId]);

  // Handle Export My Data (Directive 13)
  const handleExecuteExport = async () => {
    setIsExporting(true);
    setStatusNotification(null);
    try {
      const exportData = await exportUserData();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      setStatusNotification({
        type: 'success',
        message: 'Complete journal history successfully downloaded. A data export audit event was recorded.',
      });
      // Refresh audit logs to show newly created export audit record
      loadLogs();
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: err.message || 'Data export failed. Please retry.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Delete My Account (Directive 13)
  const handleExecuteAccountDeletion = async () => {
    if (deleteConfirmationText.trim() !== 'DELETE MY ACCOUNT') {
      setDeleteError('Confirmation string mismatch. Please type exactly "DELETE MY ACCOUNT".');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccountData(deleteConfirmationText.trim());
      setShowDeleteModal(false);
      if (onPurgeSuccess) onPurgeSuccess();
      if (onSignOut) {
        onSignOut();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Account deletion failed. Please check your connection.');
      setIsDeleting(false);
    }
  };

  // Helper to format audit events for human readability
  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'sign_in':
        return {
          icon: <LogIn className="h-3.5 w-3.5 text-emerald-700" />,
          label: 'Sign In',
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'quarantine_trigger':
      case 'quarantine_flag':
        return {
          icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-700" />,
          label: 'Quarantine Triggered',
          bgColor: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'quarantine_override':
        return {
          icon: <Flame className="h-3.5 w-3.5 text-amber-700" />,
          label: 'Quarantine Overridden',
          bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'pattern_report_generated':
      case 'pattern_synthesis':
        return {
          icon: <Sparkles className="h-3.5 w-3.5 text-[#5D6D5F]" />,
          label: 'Pattern Synthesis',
          bgColor: 'bg-[#efede5] text-[#5A5A40] border-[#d8d5c7]',
        };
      case 'data_export':
      case 'export_data':
        return {
          icon: <Download className="h-3.5 w-3.5 text-blue-700" />,
          label: 'Data Export',
          bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'account_deletion':
      case 'delete_account':
        return {
          icon: <Trash2 className="h-3.5 w-3.5 text-rose-700" />,
          label: 'Account Deletion',
          bgColor: 'bg-rose-100 text-rose-900 border-rose-300',
        };
      case 'toggle_loop':
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-[#5D6D5F]" />,
          label: 'Commitment Update',
          bgColor: 'bg-[#f4f2ea] text-[#3d3d3b] border-[#d8d5c7]',
        };
      default:
        return {
          icon: <Activity className="h-3.5 w-3.5 text-[#6b7a6e]" />,
          label: eventType.replace(/_/g, ' '),
          bgColor: 'bg-[#efede5] text-[#3d3d3b] border-[#d8d5c7]',
        };
    }
  };

  // Filtered logs
  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== 'all') {
      if (filterType === 'auth' && log.eventType !== 'sign_in') return false;
      if (filterType === 'quarantine' && !['quarantine_trigger', 'quarantine_flag', 'quarantine_override'].includes(log.eventType)) return false;
      if (filterType === 'patterns' && !['pattern_report_generated', 'pattern_synthesis', 'toggle_loop'].includes(log.eventType)) return false;
      if (filterType === 'data_rights' && !['data_export', 'export_data', 'account_deletion', 'delete_account'].includes(log.eventType)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchType = log.eventType?.toLowerCase().includes(q);
      return matchDetails || matchType;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      
      {/* Top Banner & Trust Header */}
      <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#5A5A40] text-[#efede5] flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-2xl font-bold text-[#5A5A40]">
                  Security & Audit Sanctuary
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="h-3 w-3" />
                  Zero Exposure
                </span>
              </div>
              <p className="text-xs text-[#6b7a6e] mt-1 max-w-xl leading-relaxed">
                Your journal entries are isolated to your private tenancy. This append-only audit trail logs essential security metadata while guaranteeing your journal plaintext is never logged.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5D6D5F] font-mono">
                <span>Tenant ID:</span>
                <span className="bg-[#efede5] px-2 py-0.5 rounded border border-[#d8d5c7] font-semibold text-[#3d3d3b]">
                  {userId}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons for Directive 13 Data Rights */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              id="btn-open-export-modal"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 rounded-2xl border border-[#d8d5c7] bg-[#efede5] hover:bg-[#e2dfd4] px-4 py-2.5 text-xs font-semibold text-[#3d3d3b] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Download full journal archive"
            >
              <Download className="h-4 w-4 text-[#5D6D5F]" />
              <span>Export My Data</span>
            </button>

            <button
              id="btn-open-delete-modal"
              onClick={() => {
                setDeleteError(null);
                setDeleteConfirmationText('');
                setShowDeleteModal(true);
              }}
              className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 text-xs font-semibold text-rose-700 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Permanently remove account and data"
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>

        {statusNotification && (
          <div className={`mt-5 rounded-2xl border p-3.5 text-xs flex items-center gap-2.5 animate-fadeIn ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusNotification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-[#efede5] border-[#d8d5c7] text-[#3d3d3b]'
          }`}>
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : statusNotification.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-[#5D6D5F] shrink-0" />
            )}
            <span>{statusNotification.message}</span>
          </div>
        )}
      </div>

      {/* Security Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Model Resiliency Ladder */}
        <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5A5A40] mb-3">
              <Layers className="h-4 w-4 text-[#a67c52]" />
              <span>Resilient Fallback Ladder</span>
            </div>
            <p className="text-[11px] text-[#6b7a6e] mb-3 leading-relaxed">
              Automated 4-stage availability cascade wraps all Gemini API calls with zero hardcoded model fallbacks.
            </p>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#efede5] border border-[#d8d5c7]">
                <span className="font-bold text-[#5D6D5F]">1. gemini-3.6-flash</span>
                <span className="text-[9px] font-bold uppercase bg-[#5D6D5F] text-white px-2 py-0.5 rounded-full">Primary</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8f6f2] border border-[#d8d5c7] text-[#6b7a6e]">
                <span>2. gemini-3.1-flash-lite</span>
                <span className="text-[9px] uppercase">HA Lite</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8f6f2] border border-[#d8d5c7] text-[#6b7a6e]">
                <span>3. gemini-flash-latest</span>
                <span className="text-[9px] uppercase">Alias</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8f6f2] border border-[#d8d5c7] text-[#6b7a6e]">
                <span>4. gemini-3.7-flash</span>
                <span className="text-[9px] uppercase">Reasoning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Firestore Security Rules State */}
        <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5A5A40] mb-3">
              <Lock className="h-4 w-4 text-[#5D6D5F]" />
              <span>Server-Only Audit Rules</span>
            </div>
            <p className="text-[11px] text-[#6b7a6e] mb-3 leading-relaxed">
              Firestore security rules restrict client direct write operations on the audit trail to prevent log tampering.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#efede5] border border-[#d8d5c7] font-mono text-[10px] text-[#3d3d3b]">
                <div className="text-[#5D6D5F] font-semibold">/users/{'{userId}'}/audit/{'{auditId}'}</div>
                <div className="mt-1 text-[#6b7a6e]">allow read: if request.auth.uid == userId;</div>
                <div className="text-[#a67c52] font-semibold">allow write: if false;</div>
              </div>
              <p className="text-[11px] leading-relaxed text-[#3d3d3b]">
                Audit events are authenticated server-side via Firebase Admin SDK and ID tokens.
              </p>
            </div>
          </div>
        </div>

        {/* Injection Boundary & Rate Limiter */}
        <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5A5A40] mb-3">
              <Server className="h-4 w-4 text-[#a67c52]" />
              <span>Injection Firewall &amp; Defense</span>
            </div>
            <p className="text-[11px] text-[#6b7a6e] mb-3 leading-relaxed">
              Untrusted content is framed within inert nonce-delimited envelopes and pre-classified before generation.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#efede5] border border-[#d8d5c7] text-[10px] font-mono text-[#a67c52]">
                &lt;&lt;&lt;UNTRUSTED_DATA id="[nonce]"&gt;&gt;&gt;
              </div>
              <p className="text-[11px] leading-relaxed text-[#3d3d3b]">
                Quarantined blocks are segregated from model reasoning context with user override capabilities.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Append-Only Audit Log Stream (Directive 11) */}
      <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Stream Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#efede5] pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#efede5] text-[#5D6D5F] flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#5A5A40]">
                Cryptographic Audit Stream
              </h3>
              <p className="text-xs text-[#6b7a6e]">
                Append-only log of security-relevant events for your account (most recent first)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadLogs}
              disabled={isLoadingLogs}
              className="flex items-center gap-1.5 rounded-xl border border-[#d8d5c7] bg-white px-3 py-1.5 text-xs text-[#3d3d3b] hover:bg-[#efede5] transition-colors cursor-pointer font-medium shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLogs ? 'animate-spin text-[#5D6D5F]' : 'text-[#6b7a6e]'}`} />
              <span>Refresh Trail</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Filter Audit Logs">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-colors shrink-0 ${
                filterType === 'all'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-[#efede5] text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              All Events ({auditLogs.length})
            </button>
            <button
              onClick={() => setFilterType('auth')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-colors shrink-0 ${
                filterType === 'auth'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-[#efede5] text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              Sign-Ins
            </button>
            <button
              onClick={() => setFilterType('quarantine')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-colors shrink-0 ${
                filterType === 'quarantine'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-[#efede5] text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              Quarantine &amp; Firewall
            </button>
            <button
              onClick={() => setFilterType('patterns')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-colors shrink-0 ${
                filterType === 'patterns'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-[#efede5] text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              Patterns &amp; Synthesis
            </button>
            <button
              onClick={() => setFilterType('data_rights')}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-colors shrink-0 ${
                filterType === 'data_rights'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-[#efede5] text-[#6b7a6e] hover:text-[#3d3d3b]'
              }`}
            >
              Data Rights
            </button>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7a6e]" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 rounded-xl border border-[#d8d5c7] bg-[#f8f6f2] pl-8 pr-3 py-1.5 text-xs text-[#3d3d3b] focus:bg-white focus:border-[#5D6D5F] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Audit Log Stream Listing */}
        {isLoadingLogs ? (
          <div className="py-12 text-center text-xs text-[#6b7a6e] space-y-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8d5c7] border-t-[#5D6D5F] mx-auto" />
            <div>Loading verified audit trail from cloud storage...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6b7a6e] rounded-2xl bg-[#f8f6f2] border border-dashed border-[#d8d5c7]">
            No audit records match your active search or filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-[#efede5] max-h-96 overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const badge = getEventBadge(log.eventType);
              const eventDate = new Date(log.timestamp);
              const formattedDate = eventDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = eventDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-[#faf9f5] px-2 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold ${badge.bgColor}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="font-medium text-[#3d3d3b]">{log.details}</span>
                    </div>

                    {/* Metadata chips */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {Object.entries(log.metadata).map(([key, val]) => {
                          if (val === null || val === undefined) return null;
                          return (
                            <span key={key} className="inline-flex items-center gap-1 bg-[#efede5] border border-[#d8d5c7] px-2 py-0.5 rounded-md text-[10px] font-mono text-[#5A5A40]">
                              <span className="text-[#6b7a6e]">{key}:</span>
                              <span className="font-semibold">{String(val)}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono text-[11px] text-[#6b7a6e] self-end sm:self-center">
                    <div>{formattedTime}</div>
                    <div className="text-[10px] text-[#8c9c8f]">{formattedDate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-[11px] text-[#6b7a6e] border-t border-[#efede5]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#5D6D5F]" />
            <span>Append-only guarantee: Log events cannot be mutated or purged individually.</span>
          </div>
          <span>Showing {filteredLogs.length} events</span>
        </div>

      </div>

      {/* Threat Summary & Mitigations Table */}
      <div className="rounded-3xl border border-[#d8d5c7] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-[#5D6D5F]" />
          <h3 className="font-serif text-lg font-bold text-[#5A5A40]">
            Sentinel Threat Model & Enforcement Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#d8d5c7] text-[11px] uppercase tracking-wider text-[#6b7a6e] font-bold">
                <th className="pb-3 pr-4">Threat Zone</th>
                <th className="pb-3 pr-4">Scenario</th>
                <th className="pb-3 pr-4">Likelihood</th>
                <th className="pb-3 pr-4">Impact</th>
                <th className="pb-3 pr-4">Countermeasure</th>
                <th className="pb-3">Where Enforced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efede5] text-[#3d3d3b]">
              <tr>
                <td className="py-3 pr-4 font-semibold text-[#5D6D5F]">Input Surfaces</td>
                <td className="py-3 pr-4">Indirect prompt injection via pasted articles/notes</td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">High</span></td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">High</span></td>
                <td className="py-3 pr-4">Inert envelope protocol with random nonces &amp; pre-flight classification</td>
                <td className="py-3 font-mono text-[10px] text-[#5A5A40]">server.ts: wrapUntrustedData</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-[#5D6D5F]">Planning &amp; Reasoning</td>
                <td className="py-3 pr-4">System instruction bypass to alter persona or exfiltrate prompts</td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Medium</span></td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">High</span></td>
                <td className="py-3 pr-4">Strict JSON schema validation &amp; system instruction precedence</td>
                <td className="py-3 font-mono text-[10px] text-[#5A5A40]">server.ts: ReflectRequestSchema</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-[#5D6D5F]">Tool Execution</td>
                <td className="py-3 pr-4">Privilege escalation / SSRF via unvalidated model outputs</td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Low</span></td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Critical</span></td>
                <td className="py-3 pr-4">Zero outbound HTTP execution from model outputs; text rendering only</td>
                <td className="py-3 font-mono text-[10px] text-[#5A5A40]">JournalEditor.tsx: ReactMarkdown</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-[#5D6D5F]">Memory &amp; State</td>
                <td className="py-3 pr-4">Cross-user journal snooping or unauthorized document overwrites</td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">High</span></td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Critical</span></td>
                <td className="py-3 pr-4">Strict owner-bound path security rules &amp; Admin SDK token verification</td>
                <td className="py-3 font-mono text-[10px] text-[#5A5A40]">firestore.rules &amp; server.ts: requireAuth</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-[#5D6D5F]">Inter-System Egress</td>
                <td className="py-3 pr-4">Gemini API key leakage via client bundle inclusion</td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">High</span></td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Critical</span></td>
                <td className="py-3 pr-4">Server-side proxy exclusively via Secret Manager / env, zero client keys</td>
                <td className="py-3 font-mono text-[10px] text-[#5A5A40]">server.ts: accessSecret</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-[#5D6D5F]">Abuse &amp; Cost Control</td>
                <td className="py-3 pr-4">Resource or cost exhaustion by an authenticated user</td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Medium</span></td>
                <td className="py-3 pr-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">High</span></td>
                <td className="py-3 pr-4">Per-UID token-bucket rate limiting (15 burst, 10/min), payload caps (128kb/20k chars/10k untrusted), context recency truncation, and Retry-After countdowns</td>
                <td className="py-3 font-mono text-[10px] text-[#5A5A40]">server.ts: checkRateLimit &amp; JournalEditor.tsx</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Confirmation Modal (Directive 13) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#d8d5c7] space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#efede5] text-[#5D6D5F] flex items-center justify-center shrink-0">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#5A5A40]">
                  Export Journal History
                </h3>
                <p className="text-xs text-[#6b7a6e]">Full JSON export of your personal data</p>
              </div>
            </div>

            <p className="text-xs text-[#3d3d3b] leading-relaxed">
              This will package and download your entire journal archive, including:
            </p>

            <ul className="text-xs space-y-1.5 text-[#3d3d3b] bg-[#f8f6f2] p-3 rounded-2xl border border-[#d8d5c7]">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#5D6D5F]" />
                <span>All journal reflections &amp; multi-turn conversations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#5D6D5F]" />
                <span>Weekly pattern synthesis reports &amp; open loop commitments</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#5D6D5F]" />
                <span>Complete audit trail metadata</span>
              </li>
            </ul>

            <p className="text-[11px] text-[#6b7a6e]">
              A <code>data_export</code> event will be written to your permanent audit trail.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#6b7a6e] hover:bg-[#efede5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-export"
                onClick={handleExecuteExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#5A5A40] hover:bg-[#484833] disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {isExporting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Preparing JSON Export...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download JSON Archive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal (Directive 13) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-rose-900">
                  Delete Account &amp; Wipe Data
                </h3>
                <p className="text-xs text-rose-700">Irreversible destructive action</p>
              </div>
            </div>

            <p className="text-xs text-[#3d3d3b] leading-relaxed">
              This action will permanently and recursively delete all your subcollections in Cloud Firestore:
            </p>

            <ul className="text-xs space-y-1.5 text-rose-900 bg-rose-50/70 p-3 rounded-2xl border border-rose-200">
              <li className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>All journal entries &amp; AI reflection records</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>All weekly synthesis reports &amp; commitments</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>All audit trail records &amp; tenant settings</span>
              </li>
            </ul>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6b7a6e] mb-1.5">
                Type <span className="font-mono font-bold text-rose-700 select-all">DELETE MY ACCOUNT</span> to confirm:
              </label>
              <input
                id="input-delete-account-confirm"
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full rounded-2xl border border-[#d8d5c7] bg-[#f8f6f2] p-3 text-xs font-mono focus:bg-white focus:border-rose-600 focus:outline-hidden"
              />
            </div>

            {deleteError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#6b7a6e] hover:bg-[#efede5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-account"
                onClick={handleExecuteAccountDeletion}
                disabled={deleteConfirmationText.trim() !== 'DELETE MY ACCOUNT' || isDeleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Wiping Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
