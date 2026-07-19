import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import QolLogo from '@/components/qol/QolLogo';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="mb-8 text-center">
        <QolLogo size={64} className="mx-auto mb-3" />
        <h1 className="text-2xl font-black" style={{ color: theme.colors.navy }}>Create Account</h1>
        <p className="text-gray-400 text-sm mt-1">Join the QOL community</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="••••••••" className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required placeholder="••••••••" className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-sm" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
        )}

        <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all shadow-md" style={{ backgroundColor: theme.colors.teal }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/sign-in" className="font-semibold" style={{ color: theme.colors.teal }}>Sign in</Link>
      </p>
      <p className="mt-3 text-xs text-gray-400 text-center max-w-xs">
        By signing up, you confirm you are at least 14 years old.
      </p>
    </div>
  );
}