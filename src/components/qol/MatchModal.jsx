import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { UserCheck, MessageCircle, X } from 'lucide-react';

export default function MatchModal({ match, myProfile, onClose }) {
  const navigate = useNavigate();
  if (!match) return null;

  const otherName = match.otherProfile?.display_name || 'Your new connection';
  const myAvatar = myProfile?.avatar_url;
  const otherAvatar = match.otherProfile?.avatar_url;
  const myName = myProfile?.display_name || 'You';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, #132E4CF0, #1E4870F0)` }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>

          {/* Hearts animation */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-4"
          >
            🤝
          </motion.div>

          <h2 className="text-3xl font-black mb-2" style={{ color: theme.colors.navy }}>
            You're Connected!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            You and {otherName} are now connected
          </p>

          {/* Avatars */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {myAvatar ? (
              <img src={myAvatar} alt={myName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: theme.colors.teal }}>
                {myName[0]}
              </div>
            )}
            <UserCheck className="w-8 h-8" style={{ color: theme.colors.orange }} />
            {otherAvatar ? (
              <img src={otherAvatar} alt={otherName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: theme.colors.orange }}>
                {otherName[0]}
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => { onClose(); navigate(`/chat/${match.id}`); }}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 mb-3"
            style={{ background: `linear-gradient(135deg, #132E4C, #1E4870)` }}
          >
            <MessageCircle className="w-5 h-5" />
            Send a message
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-gray-500 font-medium text-sm border border-gray-200"
          >
            Keep exploring
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}