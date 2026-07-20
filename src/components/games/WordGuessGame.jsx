import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

// Hebrew words with their Arabic translations and meanings
const WORD_PAIRS = [
  { he: 'שלום', ar: 'سلام', meaning: 'Peace / Hello' },
  { he: 'מים', ar: 'ماء', meaning: 'Water' },
  { he: 'אוכל', ar: 'طعام', meaning: 'Food' },
  { he: 'בית', ar: 'بيت', meaning: 'House' },
  { he: 'חבר', ar: 'صديق', meaning: 'Friend' },
  { he: 'ספר', ar: 'كتاب', meaning: 'Book' },
  { he: 'שמש', ar: 'شمس', meaning: 'Sun' },
  { he: 'ים', ar: 'بحر', meaning: 'Sea' },
  { he: 'אהבה', ar: 'حب', meaning: 'Love' },
  { he: 'תודה', ar: 'شكراً', meaning: 'Thank you' },
  { he: 'כן', ar: 'نعم', meaning: 'Yes' },
  { he: 'לא', ar: 'لا', meaning: 'No' },
  { he: 'יום', ar: 'يوم', meaning: 'Day' },
  { he: 'לילה', ar: 'ليل', meaning: 'Night' },
  { he: 'משפחה', ar: 'عائلة', meaning: 'Family' },
  { he: 'ילד', ar: 'ولد', meaning: 'Child' },
  { he: 'עיר', ar: 'مدينة', meaning: 'City' },
  { he: 'ארץ', ar: 'أرض', meaning: 'Land / Earth' },
  { he: 'שמים', ar: 'سماء', meaning: 'Sky' },
  { he: 'צבע', ar: 'لون', meaning: 'Color' },
];

function pickWords(round) {
  const idx = (round - 1) % WORD_PAIRS.length;
  return WORD_PAIRS[idx];
}

export default function WordGuessGame({ session, currentUser, myProfile, otherProfile, isPlayerA }) {
  const { t } = useLang();
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [roundFeedback, setRoundFeedback] = useState(null); // null | 'correct' | 'wrong'

  const wordPair = pickWords(session.current_round);

  const myNat = myProfile?.nationality;
  const wordToShow = myNat === 'israeli' ? wordPair.he : wordPair.ar;
  const correctAnswer = myNat === 'israeli' ? wordPair.ar : wordPair.he;
  const targetLangLabel = myNat === 'israeli' ? t.arabic : t.hebrew;

  const myGuessField = isPlayerA ? 'player_a_guess' : 'player_b_guess';
  const myGuess = isPlayerA ? session.player_a_guess : session.player_b_guess;
  const theirGuess = isPlayerA ? session.player_b_guess : session.player_a_guess;
  const bothGuessed = session.player_a_guess && session.player_b_guess;

  // Show round result feedback when both have guessed
  useEffect(() => {
    if (session.round_result) {
      const myId = currentUser.id;
      const scored = session.round_result === myId || session.round_result === 'both';
      setRoundFeedback(scored ? 'correct' : 'wrong');
      const t = setTimeout(() => setRoundFeedback(null), 1800);
      return () => clearTimeout(t);
    }
  }, [session.round_result, session.current_round]);

  const submitGuess = async () => {
    if (!guess.trim() || submitting || myGuess) return;
    setSubmitting(true);
    const trimmed = guess.trim();
    const update = { [myGuessField]: trimmed };

    // If the other player already guessed, also resolve the round
    if (theirGuess) {
      const myCorrect = trimmed.trim() === correctAnswer.trim();
      // Determine other player's correct answer
      const otherNat = otherProfile?.nationality;
      const otherWord = otherNat === 'israeli' ? wordPair.he : wordPair.ar;
      const otherAnswer = otherNat === 'israeli' ? wordPair.ar : wordPair.he;
      const theirCorrect = theirGuess.trim() === otherAnswer.trim();

      let roundResult = 'none';
      let scoreADelta = 0;
      let scoreBDelta = 0;
      if (myCorrect && theirCorrect) {
        roundResult = 'both';
        scoreADelta = isPlayerA ? 1 : 0;
        scoreBDelta = isPlayerA ? 0 : 1;
        scoreADelta = 1; scoreBDelta = 1;
      } else if (myCorrect) {
        roundResult = currentUser.id;
        if (isPlayerA) scoreADelta = 1; else scoreBDelta = 1;
      } else if (theirCorrect) {
        roundResult = isPlayerA ? session.player_b_id : session.player_a_id;
        if (isPlayerA) scoreBDelta = 1; else scoreADelta = 1;
      }

      const nextRound = session.current_round + 1;
      const finished = nextRound > session.total_rounds;
      const newScoreA = (session.score_a || 0) + scoreADelta;
      const newScoreB = (session.score_b || 0) + scoreBDelta;

      let winner = null;
      if (finished) {
        if (newScoreA > newScoreB) winner = session.player_a_id;
        else if (newScoreB > newScoreA) winner = session.player_b_id;
      }

      await base44.entities.GameSession.update(session.id, {
        ...update,
        round_result: roundResult,
        score_a: newScoreA,
        score_b: newScoreB,
        current_round: finished ? session.total_rounds : nextRound,
        player_a_guess: isPlayerA ? trimmed : session.player_a_guess,
        player_b_guess: isPlayerA ? session.player_b_guess : trimmed,
        status: finished ? 'finished' : 'active',
        winner_id: winner,
      });

      // After short delay, clear guesses for next round
      if (!finished) {
        setTimeout(async () => {
          await base44.entities.GameSession.update(session.id, {
            player_a_guess: '',
            player_b_guess: '',
            round_result: '',
          });
        }, 2000);
      }
    } else {
      await base44.entities.GameSession.update(session.id, { ...update, status: 'active' });
    }

    setGuess('');
    setSubmitting(false);
  };

  const otherName = otherProfile?.display_name || t.opponent;

  return (
    <div className="flex flex-col items-center px-6 py-8 gap-6">
      {/* Round feedback overlay */}
      <AnimatePresence>
        {roundFeedback && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${roundFeedback === 'correct' ? 'bg-green-100' : 'bg-red-100'}`}>
              {roundFeedback === 'correct'
                ? <CheckCircle className="w-16 h-16 text-green-500" />
                : <XCircle className="w-16 h-16 text-red-400" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word to translate */}
      <motion.div
        key={`word-${session.current_round}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-white rounded-3xl p-6 shadow-md border border-gray-50 text-center"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t.translateToLang} {targetLangLabel}</p>
        <p className="text-5xl font-black mb-2" style={{ color: theme.colors.navy }} dir="auto">{wordToShow}</p>
        <p className="text-sm text-gray-400 italic">{wordPair.meaning}</p>
      </motion.div>

      {/* Input */}
      {!myGuess ? (
        <div className="w-full">
          <p className="text-xs text-gray-400 mb-2 text-center">{t.typeAnswerIn} {targetLangLabel}</p>
          <div className="flex gap-2">
            <input
              value={guess}
              onChange={e => setGuess(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitGuess()}
              placeholder={`${t.answerIn} ${targetLangLabel}…`}
              dir="auto"
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 text-sm"
              style={{ '--tw-ring-color': theme.colors.teal }}
            />
            <button
              onClick={submitGuess}
              disabled={!guess.trim() || submitting}
              className="px-5 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, #0f7a6e)` }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.submitBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-1">{t.yourAnswer}</p>
          <p className="font-bold text-gray-700" dir="auto">{myGuess}</p>
          {!theirGuess && (
            <p className="text-xs text-gray-400 mt-3 animate-pulse">{t.waitingFor} {otherName}…</p>
          )}
        </div>
      )}

      {/* Correct answer reveal (shown after both guessed) */}
      {bothGuessed && session.round_result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl p-4 border-2 border-teal-100 text-center"
        >
          <p className="text-xs text-gray-400 mb-1">{t.correctAnswer}</p>
          <p className="text-xl font-black" style={{ color: theme.colors.teal }} dir="auto">{correctAnswer}</p>
        </motion.div>
      )}

      {/* Status */}
      <div className="w-full flex justify-between text-xs text-gray-400 px-1">
        <span>{t.you}: {myGuess ? t.answered : t.thinking}</span>
        <span>{otherName}: {theirGuess ? t.answered : t.thinking}</span>
      </div>
    </div>
  );
}