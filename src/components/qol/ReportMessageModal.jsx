import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { X, Flag, ShieldCheck } from 'lucide-react';

const REASONS = [
  { value: 'offensive', label: '🤬 Offensive language' },
  { value: 'harassment', label: '😠 Harassment' },
  { value: 'hate_speech', label: '🚫 Hate speech' },
  { value: 'spam', label: '📢 Spam' },
  { value: 'other', label: '⚠️ Other' },
];

export default function ReportMessageModal({ message, reportedUserId, matchId, currentUserId, onClose }) {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const toggleReason = (value) => {
    setReasons(prev => prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]);
  };

  const handleSubmit = async () => {
    if (reasons.length === 0) return;
    setLoading(true);
    // Submit one report per reason so existing schema is preserved
    await Promise.all(reasons.map(reason =>
      base44.entities.Report.create({
        reporter_id: currentUserId,
        reported_user_id: reportedUserId,
        match_id: matchId,
        message_id: message.id,
        message_text: message.original_text,
        reason,
      })
    ));
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-bold text-gray-800 text-lg">Report submitted</p>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Our moderation team reviews every report. If we find a violation, we'll take action — including warnings or bans.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Your report is anonymous</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                <h2 className="font-black text-gray-900 text-lg">Report User</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              You're reporting <span className="font-semibold text-gray-600">the person</span> who sent this message — not just the message itself.
            </p>

            <p className="text-sm text-gray-400 mb-4 bg-gray-50 rounded-xl px-3 py-2 italic line-clamp-2">
              "{message.original_text}"
            </p>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Why are you reporting? <span className="normal-case font-normal text-gray-400">(select all that apply)</span>
            </p>
            <div className="space-y-2 mb-5">
              {REASONS.map(r => {
                const selected = reasons.includes(r.value);
                return (
                  <button
                    key={r.value}
                    onClick={() => toggleReason(r.value)}
                    className="w-full text-left px-4 py-3 rounded-2xl border-2 font-medium text-sm transition-all flex items-center justify-between"
                    style={selected
                      ? { borderColor: theme.colors.teal, backgroundColor: `${theme.colors.teal}12`, color: theme.colors.navy }
                      : { borderColor: '#E5E7EB', color: '#374151', backgroundColor: 'white' }}
                  >
                    <span>{r.label}</span>
                    {selected && <span className="text-teal-500 font-bold">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 mb-5">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 leading-relaxed">
                Our team reviews every report. Violations result in warnings or bans. Your report is anonymous.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={reasons.length === 0 || loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-40 transition-all"
              style={{ backgroundColor: '#EF4444' }}
            >
              {loading ? 'Submitting…' : `Submit Report${reasons.length > 1 ? ` (${reasons.length})` : ''}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}