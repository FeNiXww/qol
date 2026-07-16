import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { getMessages, sendMessage } from '@/lib/matchesApi';
import ChatBubble from '@/components/qol/ChatBubble';
import ReportMessageModal from '@/components/qol/ReportMessageModal';
import { theme } from '@/lib/theme';
import { ArrowLeft, Send, Globe, Eraser } from 'lucide-react';

const MAX_CHARS = 200;

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem(`qol_chat_${matchId}`);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearedAt, setClearedAt] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      let m = null;
      try { m = await base44.entities.Match.get(matchId); } catch { return; }
      const otherId = m.user_a_id === currentUser.id ? m.user_b_id : m.user_a_id;
      const profiles = await base44.entities.Profile.filter({ user_id: otherId });
      setOtherProfile(profiles[0] || null);
      const isUserA = m.user_a_id === currentUser.id;
      const myClearedAt = isUserA ? m.user_a_cleared_at : m.user_b_cleared_at;
      if (myClearedAt) setClearedAt(myClearedAt);
      const msgs = await getMessages(matchId);
      setMessages(msgs);
      try { localStorage.setItem(`qol_chat_${matchId}`, JSON.stringify(msgs)); } catch {}
    };
    load();
  }, [matchId, currentUser?.id]);

  useEffect(() => {
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.match_id !== matchId) return;
      if (event.type === 'create') {
        setMessages(prev => {
          if (prev.find(m => m.id === event.data.id)) return prev;
          const updated = [...prev, event.data];
          try { localStorage.setItem(`qol_chat_${matchId}`, JSON.stringify(updated)); } catch {}
          return updated;
        });
      } else if (event.type === 'update') {
        // Translation arrived — patch the existing message in place
        setMessages(prev => {
          const updated = prev.map(m => m.id === event.data.id ? { ...m, ...event.data } : m);
          try { localStorage.setItem(`qol_chat_${matchId}`, JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    });
    return unsub;
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending || !profile || !currentUser) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    const optimistic = {
      id: `opt-${Date.now()}`,
      match_id: matchId,
      sender_id: currentUser.id,
      original_text: msgText,
      original_lang: profile.nationality === 'israeli' ? 'he' : 'ar',
      translated_text: '',
      created_date: new Date().toISOString(),
      status: 'sending',
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const receiverNat = otherProfile?.nationality || (profile.nationality === 'israeli' ? 'palestinian' : 'israeli');
      const saved = await sendMessage({
        matchId,
        senderId: currentUser.id,
        text: msgText,
        senderNationality: profile.nationality,
        receiverNationality: receiverNat,
      });
      // Replace optimistic with the real saved message
      setMessages(prev => {
        const updated = prev.map(m => m.id === optimistic.id ? { ...saved, status: 'sent' } : m);
        try { localStorage.setItem(`qol_chat_${matchId}`, JSON.stringify(updated)); } catch {}
        return updated;
      });
    } catch {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!currentUser) return;
    const match = await base44.entities.Match.get(matchId);
    const isUserA = match.user_a_id === currentUser.id;
    const field = isUserA ? 'user_a_cleared_at' : 'user_b_cleared_at';
    const clearedAt = new Date().toISOString();
    await base44.entities.Match.update(matchId, { [field]: clearedAt });
    setClearedAt(clearedAt);
    setConfirmClear(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const name = otherProfile?.display_name || 'Connection';
  const flag = otherProfile?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const isRTLInput = profile?.nationality === 'israeli' || profile?.nationality === 'palestinian';
  const placeholder = profile?.nationality === 'israeli' ? '…כתוב בעברית' : 'اكتب بالعربية…';

  return (
    <div className="relative flex flex-col max-w-md mx-auto" style={{ background: '#F0F7F6', height: '100dvh' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-md"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy}, #1a2a5e)` }}
      >
        <button onClick={() => navigate('/matches')} className="text-white/70 hover:text-white transition-colors p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherProfile?.avatar_url ? (
          <img src={otherProfile.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/30"
            style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
          >
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white truncate">{flag} {name}</h2>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-white/50" />
            <p className="text-xs text-white/50">Auto-translated</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmClear(true)}
          className="text-white/50 hover:text-white/80 transition-colors p-1"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* Confirm clear dialog */}
      {confirmClear && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Clear chat?</h3>
            <p className="text-gray-500 text-sm mb-5">All messages will be permanently deleted for both users.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm"
                style={{ backgroundColor: '#EF4444' }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-gray-500 font-medium">Say hello!</p>
            <p className="text-gray-400 text-sm mt-1">Your message will be auto-translated.</p>
          </div>
        )}
        {messages.filter(msg => !clearedAt || new Date(msg.created_date) > new Date(clearedAt)).map(msg => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender_id === currentUser?.id}
            onReport={setReportingMessage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 bg-white border-t border-gray-100 flex-shrink-0 shadow-lg">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKey}
              placeholder={placeholder}
              rows={1}
              dir={isRTLInput ? 'rtl' : 'ltr'}
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 text-sm resize-none"
              style={{ minHeight: 46, maxHeight: 120 }}
            />
            <span className="absolute bottom-2.5 right-3 text-xs text-gray-300">{text.length}/{MAX_CHARS}</span>
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-40 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, #0f7a6e)` }}
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {reportingMessage && (
        <ReportMessageModal
          message={reportingMessage}
          reportedUserId={reportingMessage.sender_id}
          matchId={matchId}
          currentUserId={currentUser?.id}
          onClose={() => setReportingMessage(null)}
        />
      )}
    </div>
  );
}