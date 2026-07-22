import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/contexts/ProfileContext';
import DictionaryCard from '@/components/dictionary/DictionaryCard';
import DictionaryEditor from '@/components/dictionary/DictionaryEditor';
import { ArrowLeft, Pencil, X } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useDictT } from '@/lib/dictionaryI18n';
import { useLang } from '@/contexts/LanguageContext';

export default function DictionaryPractice() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const dt = useDictT();
  const { t } = useLang();
  const dir = t.dir || 'ltr';
  const [currentUser, setCurrentUser] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const loadWords = useCallback(async () => {
    if (!currentUser) return;
    const list = await base44.entities.DictionaryWord.filter({ user_id: currentUser.id }, '-created_date', 200);
    setWords(list);
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { loadWords(); }, [loadWords]);

  // My native language → front of the card shows the foreign word
  const myLang = profile?.nationality === 'palestinian' ? 'ar' : 'he';
  const foreignLang = myLang === 'he' ? 'ar' : 'he';

  const handleSwipe = async (word, dir) => {
    setIndex(i => i + 1);
    base44.entities.DictionaryWord.update(word.id, { known: dir === 'know' }).catch(() => {});
  };

  const current = words[index];
  const done = !loading && words.length > 0 && index >= words.length;

  return (
    <div className="flex flex-col h-full" dir={dir} style={{ background: '#E6E2D8' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4 flex-shrink-0"
        style={{ paddingTop: '52px', background: 'linear-gradient(145deg, #132E4C 0%, #0D6470 100%)' }}
      >
        <button onClick={() => navigate('/games')} className="text-white/70 hover:text-white p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-white text-lg truncate">📖 {dt.dictionaryName}</h1>
          <p className="text-xs" style={{ color: '#268ECE' }}>{words.length} {dt.wordsCount}</p>
        </div>
        <button
          onClick={() => setEditing(e => !e)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: editing ? theme.colors.orange : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {editing ? <X className="w-4 h-4 text-white" /> : <Pencil className="w-4 h-4 text-white/80" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: theme.colors.teal }} />
          </div>
        ) : editing ? (
          <DictionaryEditor words={words} userId={currentUser?.id} myLang={myLang} onChanged={loadWords} />
        ) : words.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📖</p>
            <p className="text-gray-500 text-sm mb-6">{dt.emptyDictionary}</p>
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
            >
              {dt.addWord}
            </button>
          </div>
        ) : done ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-gray-800 font-black text-xl mb-6">{dt.allDone}</p>
            <button
              onClick={() => setIndex(0)}
              className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, ${theme.colors.orange})` }}
            >
              {dt.practiceAgain}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center pt-4">
            <p className="text-xs font-bold text-gray-400 mb-4">{index + 1} / {words.length}</p>
            <DictionaryCard
              key={current.id}
              word={current}
              front={foreignLang === 'he' ? current.text_he : current.text_ar}
              back={myLang === 'he' ? current.text_he : current.text_ar}
              frontTranslit={foreignLang === 'he' ? current.translit_he : current.translit_ar}
              onSwipe={(dir) => handleSwipe(current, dir)}
            />
            <div className="flex justify-between w-full mt-6 px-2">
              <span className="text-rose-400 text-xs font-bold">✗ {dt.dontKnowIt}</span>
              <span className="text-emerald-500 text-xs font-bold">{dt.knowIt} ✓</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}