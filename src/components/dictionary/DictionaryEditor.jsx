import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useDictT } from '@/lib/dictionaryI18n';

export default function DictionaryEditor({ words, userId, onChanged }) {
  const dt = useDictT();
  const [he, setHe] = useState('');
  const [ar, setAr] = useState('');
  const [saving, setSaving] = useState(false);

  const addWord = async () => {
    if (!he.trim() || !ar.trim() || saving) return;
    setSaving(true);
    try {
      await base44.entities.DictionaryWord.create({
        user_id: userId,
        text_he: he.trim(),
        text_ar: ar.trim(),
        known: false,
      });
      setHe('');
      setAr('');
      onChanged();
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
        <div className="flex gap-2 mb-3">
          <input
            value={he}
            onChange={e => setHe(e.target.value)}
            placeholder={dt.hebrewWord}
            dir="rtl"
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2"
          />
          <input
            value={ar}
            onChange={e => setAr(e.target.value)}
            placeholder={dt.arabicWord}
            dir="rtl"
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <button
          onClick={addWord}
          disabled={!he.trim() || !ar.trim() || saving}
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