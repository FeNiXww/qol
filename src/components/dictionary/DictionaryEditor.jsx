import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Plus, Loader2, Info, X } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useDictT } from '@/lib/dictionaryI18n';
import { translateText, getTransliterations, explainWord } from '@/lib/translate';
import { useLang } from '@/contexts/LanguageContext';
import { getSubscription, isPremiumActive, DICT_WORD_LIMIT } from '@/lib/subscription';
import DictionaryLimitModal from './DictionaryLimitModal';

export default function DictionaryEditor({ words, userId, myLang = 'he', onChanged }) {
  const dt = useDictT();
  const { t, lang } = useLang();
  const dir = t.dir || 'ltr';
  const [word, setWord] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showLimit, setShowLimit] = useState(false);

  // Explanation modal state
  const [explainTarget, setExplainTarget] = useState(null); // the word object
  const [explainText, setExplainText] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState(null);

  const addWord = async () => {
    if (!word.trim() || saving) return;
    setError(null);
    // Free users are capped at DICT_WORD_LIMIT saved words.
    const sub = await getSubscription(userId);
    if (!isPremiumActive(sub) && words.length >= DICT_WORD_LIMIT) {
      setShowLimit(true);
      return;
    }
    setSaving(true);
    const foreignLang = myLang === 'he' ? 'ar' : 'he';
    try {
      const translated = await translateText(word.trim(), myLang, foreignLang);
      const textHe = myLang === 'he' ? word.trim() : translated;
      const textAr = myLang === 'ar' ? word.trim() : translated;
      const translits = await getTransliterations(textHe, textAr);
      await base44.entities.DictionaryWord.create({
        user_id: userId,
        text_he: textHe,
        text_ar: textAr,
        ...translits,
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
    try {
      await base44.entities.DictionaryWord.delete(id);
    } catch {
      // Word was already deleted — just refresh the list
    }
    onChanged();
  };

  const openExplanation = async (w) => {
    setExplainTarget(w);
    setExplainText('');
    setExplainError(null);
    setExplainLoading(true);
    try {
      const explanation = await explainWord(w.text_he, w.text_ar, myLang);
      setExplainText(explanation);
    } catch (e) {
      setExplainError(dt.wordExplainFailed || 'Failed to load explanation');
    } finally {
      setExplainLoading(false);
    }
  };

  const closeExplanation = () => {
    setExplainTarget(null);
    setExplainText('');
    setExplainError(null);
  };

  return (
    <div className="space-y-5">
      <DictionaryLimitModal open={showLimit} onClose={() => setShowLimit(false)} />

      {/* Add word form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{dt.addWord}</p>
        <div className="mb-3">
          <input
            value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addWord(); }}
            placeholder={dt.wordPlaceholder}
            dir={dir}
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
              <p className="font-bold text-gray-900 text-sm truncate" dir="auto">{w.text_he}</p>
              <p className="text-gray-400 text-sm truncate" dir="auto">{w.text_ar}</p>
            </div>
            {w.known && <span className="text-emerald-500 text-xs font-bold flex-shrink-0">✓</span>}
            <button
              onClick={() => openExplanation(w)}
              className="p-2 text-gray-300 hover:text-blue-400 transition-colors flex-shrink-0"
              aria-label={dt.explain || 'Explain'}
            >
              <Info className="w-4 h-4" />
            </button>
            <button onClick={() => removeWord(w.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {words.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">{dt.emptyDictionary}</p>
        )}
      </div>

      {/* Explanation modal */}
      {explainTarget && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeExplanation}
        >
          <div
            className="bg-white rounded-2xl shadow-lg w-full max-w-sm max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-base truncate" dir="auto">{explainTarget.text_he}</p>
                <p className="text-gray-400 text-sm truncate" dir="auto">{explainTarget.text_ar}</p>
              </div>
              <button
                onClick={closeExplanation}
                className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              {explainLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
              {explainError && !explainLoading && (
                <p className="text-red-400 text-sm">{explainError}</p>
              )}
              {!explainLoading && !explainError && explainText && (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line" dir={dir}>
                  {explainText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}