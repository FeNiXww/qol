import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { base44 } from '@/api/base44Client';
import { getMessages, sendMessage } from '@/lib/matchesApi';
import { markMatchRead } from '@/lib/unread';
import ChatBubble from '@/components/qol/ChatBubble';
import ReportMessageModal from '@/components/qol/ReportMessageModal';
import GroupInfoSheet from '@/components/qol/GroupInfoSheet';
import { getGroup, setGroupClearedAt } from '@/lib/groupsApi';
import { theme } from '@/lib/theme';
import { ArrowLeft, Send, Globe, Eraser, GlobeLock, Users } from 'lucide-react';
import { useDictT } from '@/lib/dictionaryI18n';

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
  const [match, setMatch] = useState(null);
  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearedAt, setClearedAt] = useState(null);
  const [translationOn, setTranslationOn] = useState(true);
  const [sendError, setSendError] = useState(null);
  const [dictToast, setDictToast] = useState(false);
  const [unknownToast, setUnknownToast] = useState(false);
  const dt = useDictT();
  const bottomRef = useRef(null);

  // Screenshot deterrence: blur the whole page whenever the window/tab loses
  // focus or visibility, so switching to a screen-capture tool hides the chat.
  // On native Capacitor builds a real FLAG_SECURE plugin can be wired in later;
  // this keeps the web app safe without an unresolvable native import.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const obscure = () => { root.style.filter = 'blur(14px)'; };
    const reveal = () => { root.style.filter = ''; };
    const onVis = () => document.hidden ? obscure() : reveal();
    const onBlur = () => obscure();
    const onFocus = () => reveal();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      reveal();
    };
  }, []);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const loadInFlight = useRef(false);
  useEffect(() => {
    if (!currentUser) return;
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    const load = async () => {
      try {
        let m = null;
        try { m = await base44.entities.Match.get(matchId); } catch { return; }
        setMatch(m);
        if (m.is_group) {
          const info = await getGroup(matchId);
          setGroup(info);
          const pids = m.participant_ids || [];
          if (pids.length) {
            const [prof, profByCreator] = await Promise.all([
              base44.entities.Profile.filter({ user_id: { $in: pids } }),
              base44.entities.Profile.filter({ created_by_id: { $in: pids } }),
            ]);
            const map = {};
            profByCreator.concat(prof).forEach((p) => { const k = p.user_id || p.created_by_id; if (k) map[k] = p; });
            setParticipants(pids.map((id) => map[id]).filter(Boolean));
          }
          const clearedAtMap = m.cleared_at_map || {};
          if (clearedAtMap[currentUser.id]) setClearedAt(clearedAtMap[currentUser.id]);
        } else {
          const otherId = m.user_a_id === currentUser.id ? m.user_b_id : m.user_a_id;
          const profiles = await base44.entities.Profile.filter({ user_id: otherId });
          setOtherProfile(profiles[0] || null);
          const isUserA = m.user_a_id === currentUser.id;
          const myClearedAt = isUserA ? m.user_a_cleared_at : m.user_b_cleared_at;
          if (myClearedAt) setClearedAt(myClearedAt);
        }
        const msgs = await getMessages(matchId);
        setMessages(msgs);
        try { localStorage.setItem(`qol_chat_${matchId}`, JSON.stringify(msgs)); } catch {}
      } catch (e) {
        console.warn('Chat load failed, using cached messages', e);
      } finally {
        loadInFlight.current = false;
      }
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
        setMessages(prev => {
          const updated = prev.map(m => m.id === event.data.id ? { ...m, ...event.data } : m);
          try { localStorage.setItem(`qol_chat_${matchId}`, JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    });

    return () => { unsub(); };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    markMatchRead(matchId);
  }, [messages, matchId]);

  const handleSend = async () => {
    if (!text.trim() || sending || !profile || !currentUser) return;
    const msgText = text.trim();
    setSendError(null);
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
        receiverId: otherProfile?.user_id || null,
        text: msgText,
        senderNationality: profile.nationality,
        receiverNationality: receiverNat,
        isGroup: !!match?.is_group,
      });
      setMessages(prev => {
        const withoutDup = prev.filter(m => m.id !== saved.id);
        const updated = withoutDup.map(m => m.id === optimistic.id ? { ...saved, status: 'sent' } : m);
        try { localStorage.setItem(`qol_chat_${matchId}`, JSON.stringify(updated)); } catch {}
        return updated;
      });
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(msgText);
      if (err?.message === 'TRANSLATION_FAILED') {
        setSendError("Your message wasn't clear and couldn't be translated — it was not sent. Please rephrase it.");
      } else {
        setSendError('Failed to send message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleAddToDictionary = async (msg) => {
    if (!currentUser || !msg.translated_text) return;
    const textHe = msg.original_lang === 'israeli' || msg.original_lang === 'he' ? msg.original_text : msg.translated_text;
    const textAr = msg.original_lang === 'palestinian' || msg.original_lang === 'ar' ? msg.original_text : msg.translated_text;
    const { getTransliterations } = await import('@/lib/translate');
    const translits = await getTransliterations(textHe, textAr);
    await base44.entities.DictionaryWord.create({
      user_id: currentUser.id,
      text_he: textHe,
      text_ar: textAr,
      ...translits,
      known: false,
    });
    setDictToast(true);
    setTimeout(() => setDictToast(false), 2000);
  };

  const handleMarkUnknown = async (word, message) => {
    if (!currentUser) return;
    const fLang = message.original_lang;
    const field = fLang === 'he' ? 'text_he' : 'text_ar';
    try {
      const matches = await base44.entities.DictionaryWord.filter({
        user_id: currentUser.id,
        [field]: word,
        known: true,
      });
      if (matches[0]) {
        await base44.entities.DictionaryWord.update(matches[0].id, { known: false });
        setUnknownToast(true);
        setTimeout(() => setUnknownToast(false), 2000);
      }
    } catch {}
  };

  const handleClearChat = async () => {
    if (!currentUser || !match) return;
    const clearedAtTime = new Date().toISOString();
    if (match.is_group) {
      await setGroupClearedAt({ matchId, userId: currentUser.id });
    } else {
      const isUserA = match.user_a_id === currentUser.id;
      const field = isUserA ? 'user_a_cleared_at' : 'user_b_cleared_at';
      await base44.entities.Match.update(matchId, { [field]: clearedAtTime });
    }
    setClearedAt(clearedAtTime);
    setConfirmClear(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isGroup = !!match?.is_group;
  const displayName = isGroup ? (group?.name || 'Group') : (otherProfile?.display_name || 'Connection');
  const displayAvatar = isGroup ? group?.avatar_url : otherProfile?.avatar_url;
  const otherFlag = otherProfile?.nationality === 'israeli' ? '🇮🇱' : '🇵🇸';
  const isRTLInput = profile?.nationality === 'israeli' || profile?.nationality === 'palestinian';
  const placeholder = profile?.nationality === 'israeli' ? '…כתוב בעברית' : 'اكتب بالعربية…';

  return (
    <div 
      className="relative flex flex-col w-full select-none" 
      style={{ background: '#F0F7F6', height: '100dvh', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0 shadow-md"
        style={{ paddingTop: '52px', background: `linear-gradient(135deg, ${theme.colors.navy}, #1a2a5e)` }}
      >
        <button onClick={() => navigate('/matches')} className="text-white/70 hover:text-white transition-colors p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {displayAvatar ? (
          <img src={displayAvatar} alt={displayName} className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/30"
            style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}
          >
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white truncate">{isGroup ? `👥 ${displayName}` : `${otherFlag} ${displayName}`}</h2>
          {isGroup && (
            <p className="text-xs text-white/60 truncate">{participants.length || (match?.participant_ids?.length || 0)} members</p>
          )}
        </div>
        {isGroup && (
          <button
            onClick={() => setShowGroupInfo(true)}
            className="text-white/70 hover:text-white transition-colors p-1"
            title="Group info"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setTranslationOn(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0"
          style={translationOn
            ? { background: 'rgba(22,164,153,0.25)', color: '#5EEAD4', border: '1px solid rgba(22,164,153,0.5)' }
            : { background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)' }}
        >
          {translationOn ? <Globe className="w-3.5 h-3.5" /> : <GlobeLock className="w-3.5 h-3.5" />}
          {translationOn ? 'Translation ON' : 'Translation OFF'}
        </button>
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
            onAddWord={handleAddToDictionary}
            onMarkUnknown={handleMarkUnknown}
            translationOn={translationOn}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Added to dictionary toast */}
      {dictToast && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg" style={{ bottom: 110, background: theme.colors.teal }}>
          📖 {dt.addedToDictionary}
        </div>
      )}

      {/* Marked as "don't know" toast */}
      {unknownToast && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg" style={{ bottom: 110, background: '#B45309' }}>
          {dt.markedUnknown}
        </div>
      )}

      {/* Send error */}
      {sendError && (
        <div className="px-4 py-2 flex items-center gap-2 text-sm" style={{ background: '#FEF2F2' }}>
          <span className="text-red-500 flex-1">{sendError}</span>
          <button onClick={() => setSendError(null)} className="text-red-400 font-bold text-base leading-none">×</button>
        </div>
      )}

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
              style={{ minHeight: 46, maxHeight: 120, userSelect: 'text', WebkitUserSelect: 'text' }}
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

      {isGroup && showGroupInfo && (
        <GroupInfoSheet
          matchId={matchId}
          currentUserId={currentUser?.id}
          myAgeBand={profile?.age_band}
          group={group}
          onClose={() => setShowGroupInfo(false)}
          onLeftGroup={() => navigate('/matches')}
        />
      )}
    </div>
  );
}