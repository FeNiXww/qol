import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import QolLogo from '@/components/qol/QolLogo';
import { useLang } from '@/contexts/LanguageContext';

export default function SignIn() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || t.passwordMismatch);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white" dir={t.dir}>
      <div className="mb-10 text-center">
        <QolLogo size={80} className="mx-auto mb-4" />
        <h1 className="text-3xl font-black" style={{ color: theme.colors.navy }}>{t.signInTitle}</h1>
        <p className="text-gray-400 text-sm mt-1">{t.signInSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.emailLabel}</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.passwordLabel}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all shadow-md mt-2"
          style={{ backgroundColor: theme.colors.teal }}
        >
          {loading ? t.signingIn : t.signInBtn}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-500">
        {t.noAccount}{' '}
        <Link to="/sign-up" className="font-semibold" style={{ color: theme.colors.teal }}>
          {t.signUp}
        </Link>
      </p>
    </div>
  );
}