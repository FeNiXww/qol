import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useDictT } from '@/lib/dictionaryI18n';
import { translateText } from '@/lib/translate';

export default function DictionaryEditor({ words, userId, myLang = 'he', onChanged }) {
  const dt = useDictT();
  const [word, setWord] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const addWord = async () => {
    if (!word.trim() || saving) return;
    setSaving(true);
    setError(null);
    const foreignLang = myLang === 'he' ? 'ar' : 'he';
    try {
      const translated = await translateText(word.trim(), myLang, foreignLang);
      await base44.entities.DictionaryWord.create({
        user_id: userId,
        text_he: myLang === 'he' ? word.trim() : translated,
        text_ar: myLang === 'ar' ? word.trim() : translated,
        known: false,
      });
      setWord('');
      onChanged();
    } catch (e) {
      setError(dt.wordTranslateFailed);
    } finally {
      setSaving(false);
    }
  };

  const removeWord = async (id) => {
    await base44.entities.DictionaryWord.delete(id);
    onChanged();
  };

  return (
    <div className="space-y-5">
      {/* Add word form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{dt.addWord}</p>
        <div className="mb-3">
          <input
            value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addWord(); }}
            placeholder={dt.wordPlaceholder}
            dir="rtl"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2"
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
        <button
          onClick={addWord}
          disabled={!word.trim() || saving}
          className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ background: theme.colors.teal }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> {dt.save}</>}
        </button>
      </div>

      {/* Word list */}
      <div className="space-y-2">
        {words.map(w => (
          <div key={w.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate" dir="rtl">{w.text_he}</p>
              <p className="text-gray-400 text-sm truncate" dir="rtl">{w.text_ar}</p>
            </div>
            {w.known && <span className="text-emerald-500 text-xs font-bold flex-shrink-0">✓</span>}
            <button onClick={() => removeWord(w.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {words.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">{dt.emptyDictionary}</p>
        )}
      </div>
    </div>
  );
}