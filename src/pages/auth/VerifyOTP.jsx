import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { theme } from '@/lib/theme';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const displayName = location.state?.displayName || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await base44.auth.verifyOtp({ email, otpCode: otp });
      base44.auth.setToken(access_token);
      window.location.href = '/onboarding/name';
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    await base44.auth.resendOtp(email);
    setResent(true);
    setTimeout(() => setResent(false), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-black" style={{ color: theme.colors.navy }}>Check your email</h1>
        <p className="text-gray-400 text-sm mt-2">
          We sent a verification code to<br /><strong className="text-gray-700">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleVerify} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="w-full text-center text-2xl tracking-widest py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent font-mono"
          required
        />

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        {resent && <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-green-700 text-sm">Code resent!</div>}

        <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-md" style={{ backgroundColor: theme.colors.teal }}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      <button onClick={handleResend} className="mt-4 text-sm font-medium" style={{ color: theme.colors.teal }}>
        Resend code
      </button>
    </div>
  );
}