import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// In-app confirmation dialog matching QOL's design language, replacing native
// window.confirm / window.alert which look out of place in the mobile app.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          style={{ background: 'rgba(13,46,76,0.55)' }}
          onClick={busy ? undefined : onCancel}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 text-lg mb-1.5">{title}</h3>
            {message && (
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">{message}</p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={onCancel}
                disabled={busy}
                className="flex-1 py-3 rounded-2xl font-bold text-sm border border-gray-200 text-gray-600 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-60"
                style={{
                  background: variant === 'danger' ? '#DC2626' : 'linear-gradient(135deg, #16A499, #0D6470)',
                }}
              >
                {busy ? '…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}