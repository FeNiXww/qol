import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { X, Flag } from 'lucide-react';

const REASONS = [
  { value: 'offensive', label: '🤬 Offensive language' },
  { value: 'harassment', label: '😠 Harassment' },
  { value: 'hate_speech', label: '🚫 Hate speech' },
  { value: 'spam', label: '📢 Spam' },
  { value: 'other', label: '⚠️ Other' },
];

export default function ReportMessageModal({ message, reportedUserId, matchId, currentUserId, onClose }) {
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    await base44.entities.Report.create({
      reporter_id: currentUserId,
      reported_user_id: reportedUserId,
      match_id: matchId,
      message_id: message.id,
      message_text: message.original_text,
      reason,
    });
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 1800);
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
            <p className="font-bold text-gray-800">Report submitted</p>
            <p className="text-gray-400 text-sm mt-1">We'll review it shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                <h2 className="font-black text-gray-900 text-lg">Report message</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4 bg-gray-50 rounded-xl px-3 py-2 italic line-clamp-2">
              "{message.original_text}"
            </p>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Why are you reporting this?</p>
            <div className="space-y-2 mb-6">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className="w-full text-left px-4 py-3 rounded-2xl border-2 font-medium text-sm transition-all"
                  style={reason === r.value
                    ? { borderColor: theme.colors.teal, backgroundColor: `${theme.colors.teal}12`, color: theme.colors.navy }
                    : { borderColor: '#E5E7EB', color: '#374151', backgroundColor: 'white' }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!reason || loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-40 transition-all"
              style={{ backgroundColor: '#EF4444' }}
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}