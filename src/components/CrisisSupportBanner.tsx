/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DIRECTIVE 12: USER WELLBEING & SAFETY
 * When acute distress or crisis signals are detected, prioritize the person over the task.
 * Respond with warmth and surface supportive resources in a calm, non-alarming panel.
 */

import React from 'react';
import { Heart, Phone, MessageSquare, ShieldAlert, X } from 'lucide-react';

interface CrisisSupportBannerProps {
  onDismiss?: () => void;
}

export const CrisisSupportBanner: React.FC<CrisisSupportBannerProps> = ({ onDismiss }) => {
  return (
    <div className="rounded-3xl border border-[#d8d5c7] bg-[#efede5] p-5 sm:p-6 text-[#3d3d3b] shadow-xs transition-all animate-fadeIn mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e2dfd4] text-[#a67c52] shadow-xs">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#5A5A40]">
              We care about your wellbeing
            </h3>
            <p className="text-xs sm:text-sm text-[#6b7a6e] mt-0.5 leading-relaxed font-sans">
              Writing can bring up heavy emotions. If you are experiencing overwhelming distress, you don't have to carry it alone. Free, confidential support is available 24/7.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss notice"
            className="rounded-xl p-1.5 text-[#6b7a6e] hover:bg-[#d8d5c7] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#d8d5c7]">
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#d8d5c7] shadow-xs">
          <div className="h-9 w-9 rounded-xl bg-[#efede5] text-[#5D6D5F] flex items-center justify-center shrink-0">
            <Phone className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-[#3d3d3b]">988 Suicide & Crisis Lifeline</div>
            <div className="text-[#6b7a6e]">Call or text <span className="font-mono font-bold text-[#5A5A40]">988</span> (US & Canada, Free/24/7)</div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#d8d5c7] shadow-xs">
          <div className="h-9 w-9 rounded-xl bg-[#efede5] text-[#5D6D5F] flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-[#3d3d3b]">Crisis Text Line</div>
            <div className="text-[#6b7a6e]">Text <span className="font-mono font-bold text-[#5A5A40]">HOME</span> to <span className="font-mono font-bold text-[#5A5A40]">741741</span> (Free/24/7)</div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-[#6b7a6e] flex items-center gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[#a67c52]" />
        <span>Outside North America? Visit <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="underline font-bold text-[#5A5A40] hover:text-black">findahelpline.com</a> for free support in 130+ countries.</span>
      </div>
    </div>
  );
};
