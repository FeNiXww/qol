import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { getMessages, sendMessage } from '@/lib/matchesApi';
import ChatBubble from '@/components/qol/ChatBubble';
import { theme } from '@/lib/theme';
import { ArrowLeft, Send } from 'lucide-react';

const MAX_CHARS = 200;


export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [match, setMatch] = useState(null);
  const bottomRef = useRef(null);




  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Load match + other profile
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      let m = null;
      try {
        m = await base44.entities.Match.get(matchId);
        setMatch(m);
      } catch { return; }

      const otherId = m.user_a_id === currentUser.id ? m.user_b_id : m.user_a_id;
      const profiles = await base44.entities.Profile.filter({ created_by_id: otherId });
      setOtherProfile(profiles[0]);

      const msgs = await getMessages(matchId);
      setMessages(msgs);
    };
    load();
  }, [matchId, currentUser?.id]);

  // Realtime subscription
  useEffect(() => {
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.match_id !== matchId) return;
      if (event.type === 'create') {
        setMessages(prev => {
          if (prev.find(m => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
      }
    });
    return unsub;
  }, [matchId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending || !profile || !otherProfile || !currentUser) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    // Optimistic bubble
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
      await sendMessage({
        matchId,
        senderId: currentUser.id,
        text: msgText,
        senderNationality: profile.nationality,
        receiverNationality: otherProfile.nationality,
      });
      // Remove optimistic (realtime will add real one)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'failed' } : m));
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const name = otherProfile?.display_name || 'Connection';
  const flag = otherProfile?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <button onClick={() => navigate('/matches')} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-6 h-6" />
        </button>
        {otherProfile?.avatar_url ? (
          <img src={otherProfile.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.colors.teal }}>
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 truncate">{flag} {name}</h2>
          <p className="text-xs text-gray-400 capitalize">{otherProfile?.nationality || ''}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-gray-400 text-sm">Say hello! Your message will be automatically translated.</p>
          </div>
        )}
        {messages.map(msg => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isMine={msg.sender_id === currentUser?.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Translation note */}
      <div className="px-4 py-1.5 text-center">
        <p className="text-xs text-gray-400">✨ Messages are auto-translated • Write in your language</p>
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKey}
              placeholder={profile?.nationality === 'israeli' ? 'Write in Hebrew…' : 'Write in Arabic…'}
              rows={1}
              dir={profile?.nationality === 'israeli' || profile?.nationality === 'palestinian' ? 'rtl' : 'ltr'}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none"
              style={{ minHeight: 44, maxHeight: 120 }}
            />
            <span className="absolute bottom-2 right-3 text-xs text-gray-300">{text.length}/{MAX_CHARS}</span>
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 transition-all disabled:opacity-50"
            style={{ backgroundColor: theme.colors.teal }}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}