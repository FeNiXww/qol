import React, { useState } from 'react';
import { HelpCircle, X, BookOpen, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useDictT } from '@/lib/dictionaryI18n';
import { useLang } from '@/contexts/LanguageContext';

const TUTORIAL_STEPS = [
  { icon: BookOpen, titleKey: 'dictionaryTutorialStep1Title', descKey: 'dictionaryTutorialStep1Desc' },
  { icon: Layers, titleKey: 'dictionaryTutorialStep2Title', descKey: 'dictionaryTutorialStep2Desc' },
  { icon: Sparkles, titleKey: 'dictionaryTutorialStep3Title', descKey: 'dictionaryTutorialStep3Desc' },
  { icon: CheckCircle2, titleKey: 'dictionaryTutorialStep4Title', descKey: 'dictionaryTutorialStep4Desc' },
];

// Self-contained "How it works" trigger + modal for the Dictionary feature.
// Drop this into any dictionary-related header (practice view, edit view, etc.)
// so the same tutorial is reachable everywhere, with one shared source of truth.
export default function DictionaryTutorialButton({ variant = 'light' }) {
  const dt = useDictT();
  const { t } = useLang();
  const dir = t.dir || 'ltr';
  const [open, setOpen] = useState(false);

  const isDark = variant === 'dark'; // 'dark' = for use on dark header backgrounds

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
          isDark ? 'text-white/80 bg-white/10 hover:bg-white/15' : ''
        }`}
        style={!isDark ? { color: theme.colors.teal, background: `${theme.colors.teal}14` } : undefined}
        aria-label={dt.dictionaryHowItWorks}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{dt.dictionaryHowItWorks}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-lg w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <p className="font-bold text-gray-900 text-base" dir={dir}>{dt.dictionaryTutorialTitle}</p>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4" dir={dir}>
              {TUTORIAL_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${theme.colors.teal}14`, color: theme.colors.teal }}
                    >
                      <StepIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{dt[step.titleKey]}</p>
                      <p className="text-gray-500 text-xs leading-relaxed mt-0.5">{dt[step.descKey]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-5 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold active:scale-[0.98] transition-all"
                style={{ background: theme.colors.teal }}
              >
                {dt.gotIt}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}