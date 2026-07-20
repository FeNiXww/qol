import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

// Phrases to translate — each player translates it to the other's language
const PHRASES = [
  { he: 'בוקר טוב, איך אתה?', ar: 'صباح الخير، كيف حالك؟', meaning: 'Good morning, how are you?' },
  { he: 'אני שמח לפגוש אותך', ar: 'يسعدني مقابلتك', meaning: 'I am happy to meet you' },
  { he: 'מה שמך?', ar: 'ما اسمك؟', meaning: 'What is your name?' },
  { he: 'אני אוהב את הים', ar: 'أحب البحر', meaning: 'I love the sea' },
  { he: 'היכן אתה גר?', ar: 'أين تسكن؟', meaning: 'Where do you live?' },
  { he: 'אני רעב', ar: 'أنا جائع', meaning: 'I am hungry' },
  { he: 'האוכל טעים מאוד', ar: 'الطعام لذيذ جداً', meaning: 'The food is very tasty' },
  { he: 'להתראות', ar: 'مع السلامة', meaning: 'Goodbye' },
  { he: 'כמה זה עולה?', ar: 'بكم هذا؟', meaning: 'How much does this cost?' },
  { he: 'אני לא מבין', ar: 'لا أفهم', meaning: 'I don\'t understand' },
];

function pickPhrase(round) {
  return PHRASES[(round - 1) % PHRASES.length];
}

export default function TranslationDuelGame({ session, currentUser, myProfile, otherProfile, isPlayerA }) {
  const { t } = useLang();
  const [myTranslation, setMyTranslation] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const phrase = pickPhrase(session.current_round);
  const myNat = myProfile?.nationality;

  const phraseToShow = myNat === 'israeli' ? phrase.he : phrase.ar;
  const targetLang = myNat === 'israeli' ? t.arabic : t.hebrew;
  const referenceAnswer = myNat === 'israeli' ? phrase.ar : phrase.he;

  const myGuessField = isPlayerA ? 'player_a_guess' : 'player_b_guess';
  const myGuess = isPlayerA ? session.player_a_guess : session.player_b_guess;
  const theirGuess = isPlayerA ? session.player_b_guess : session.player_a_guess;
  const bothSubmitted = session.player_a_guess && session.player_b_guess;

  // Round result here encodes "ratingA:ratingB" — total points
  const roundResultParsed = session.round_result?.includes(':')
    ? session.round_result.split(':').map(Number)
    : null;
  const myRating = roundResultParsed ? (isPlayerA ? roundResultParsed[0] : roundResultParsed[1]) : null;

  const submitTranslation = async () => {
    if (!myTranslation.trim() || submitting || myGuess) return;
    setSubmitting(true);
    await base44.entities.GameSession.update(session.id, {
      [myGuessField]: myTranslation.trim(),
      status: 'active',
    });
    setSubmitting(false);
  };

  const submitRating = async (stars) => {
    if (submitting || roundResultParsed) return;
    setRating(stars);
    setSubmitting(true);

    // Each player rates the other's translation; we store both ratings
    // player_a rates player_b's guess, player_b rates player_a's guess
    const existingResult = session.round_result || '0:0';
    const parts = existingResult.split(':').map(Number);
    // If I'm player A, I rate player B → index 1
    // If I'm player B, I rate player A → index 0
    if (isPlayerA) parts[1] = stars; else parts[0] = stars;
    const newResult = parts.join(':');

    const nextRound = session.current_round + 1;
    const finished = nextRound > session.total_rounds;
    const newScoreA = (session.score_a || 0) + parts[0];
    const newScoreB = (session.score_b || 0) + parts[1];

    let winner = null;
    // Only finalize when both ratings in
    const otherRatingExists = isPlayerA ? (parts[0] > 0) : (parts[1] > 0);
    const bothRated = parts[0] > 0 && parts[1] > 0;

    if (bothRated) {
      if (finished) {
        if (newScoreA > newScoreB) winner = session.player_a_id;
        else if (newScoreB > newScoreA) winner = session.player_b_id;
      }
      await base44.entities.GameSession.update(session.id, {
        round_result: newResult,
        score_a: newScoreA,
        score_b: newScoreB,
        current_round: finished ? session.total_rounds : nextRound,
        status: finished ? 'finished' : 'active',
        winner_id: winner,
      });
      if (!finished) {
        setTimeout(async () => {
          await base44.entities.GameSession.update(session.id, {
            player_a_guess: '',
            player_b_guess: '',
            round_result: '',
          });
          setMyTranslation('');
          setRating(0);
        }, 2000);
      }
    } else {
      await base44.entities.GameSession.update(session.id, { round_result: newResult });
    }
    setSubmitting(false);
  };

  // Phase detection
  const phase = !myGuess ? 'write'
    : !bothSubmitted ? 'waiting'
    : !roundResultParsed || (isPlayerA ? roundResultParsed[1] === 0 : roundResultParsed[0] === 0) ? 'rate'
    : 'done';

  const otherName = otherProfile?.display_name || t.opponent;

  return (
    <div className="flex flex-col px-6 py-8 gap-5">
      {/* Phrase card */}
      <motion.div
        key={`phrase-${session.current_round}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-6 shadow-md border border-gray-50 text-center"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t.translateTo} {targetLang}</p>
        <p className="text-2xl font-black mb-1" style={{ color: theme.colors.navy }} dir="auto">{phraseToShow}</p>
        <p className="text-xs text-gray-400 italic">{phrase.meaning}</p>
      </motion.div>

      {/* Write phase */}
      {phase === 'write' && (
        <div>
          <p className="text-xs text-gray-400 mb-2 text-center">{t.writeTranslationIn} {targetLang}</p>
          <div className="flex flex-col gap-2">
            <textarea
              value={myTranslation}
              onChange={e => setMyTranslation(e.target.value)}
              placeholder={`${t.yourTranslationIn} ${targetLang}…`}
              dir="auto"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 text-sm resize-none"
            />
            <button
              onClick={submitTranslation}
              disabled={!myTranslation.trim() || submitting}
              className="py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${theme.colors.teal}, #0f7a6e)` }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.submitTranslation}
            </button>
          </div>
        </div>
      )}

      {/* Waiting phase */}
      {phase === 'waiting' && (
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">{t.yourTranslation}</p>
          <p className="font-bold text-gray-800 mb-3" dir="auto">{myGuess}</p>
          <p className="text-xs text-gray-400 animate-pulse">{t.waitingFor} {otherName}…</p>
        </div>
      )}

      {/* Rate phase — both submitted, now rate each other */}
      {phase === 'rate' && (
        <div className="space-y-4">
          {/* Show other player's translation to rate */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{t.translationOf} {otherName}</p>
            <p className="font-bold text-gray-800 mb-1" dir="auto">{theirGuess}</p>
            <p className="text-xs text-gray-400 italic">{t.reference}: <span dir="auto">{referenceAnswer}</span></p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 mb-3">{t.rateTranslation} {otherName}</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3].map(s => (
                <button
                  key={s}
                  onClick={() => submitRating(s)}
                  disabled={submitting}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all active:scale-95"
                  style={{
                    borderColor: rating === s ? theme.colors.orange : '#E5E7EB',
                    background: rating === s ? `${theme.colors.orange}15` : 'white',
                  }}
                >
                  <div className="flex">
                    {Array.from({ length: s }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{s === 1 ? t.close : s === 2 ? t.good : t.perfect}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Show my translation too */}
          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{t.yourTranslation}</p>
            <p className="text-sm text-gray-700" dir="auto">{myGuess}</p>
          </div>
        </div>
      )}

      {/* Done phase — ratings revealed */}
      {phase === 'done' && roundResultParsed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border-2 border-teal-100 text-center"
        >
          <p className="text-xs text-gray-400 mb-3">{t.ratingsThisRound}</p>
          <div className="flex justify-around">
            <div>
              <p className="text-xs text-gray-400 mb-1">{t.youGot}</p>
              <div className="flex justify-center">
                {Array.from({ length: isPlayerA ? roundResultParsed[0] : roundResultParsed[1] }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">{otherName} {t.got}</p>
              <div className="flex justify-center">
                {Array.from({ length: isPlayerA ? roundResultParsed[1] : roundResultParsed[0] }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 animate-pulse">{t.nextRound}</p>
        </motion.div>
      )}

      {/* Status footer */}
      <div className="flex justify-between text-xs text-gray-400 px-1">
        <span>{t.you}: {myGuess ? t.submitted : t.writing}</span>
        <span>{otherName}: {theirGuess ? t.submitted : t.writing}</span>
      </div>
    </div>
  );
}