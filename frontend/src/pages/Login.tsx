
import { useState } from 'react';

interface LoginProps {
  onLogin: (role: 'admin' | 'participant') => void;
  onBack: () => void;
  onForgotPassword: () => void;
}

export default function Login({
  onLogin,
  onBack,
  onForgotPassword,
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Login failed'
        );
      }

      // This login page is only for admins.
      if (data.user.role !== 'admin') {
        throw new Error(
          'Participants must login using the mobile number and OTP from their invitation.'
        );
      }

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      onLogin('admin');

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'Something went wrong. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card">
              <span className="text-white font-bold">
                E
              </span>
            </div>

            <span className="font-display text-2xl text-[#1A1A2E]">
              EventFlow
            </span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-elevated p-8 border border-[#E8E8F0]">

          <h1 className="font-display text-3xl text-[#1A1A2E] text-center mb-2">
            Welcome back
          </h1>

          <p className="text-sm text-[#9090A8] text-center mb-6">
            Sign in to your EventFlow admin account
          </p>

          {/* Admin Login Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-[#EEF2FF] text-[#5B6FD4] px-4 py-2 rounded-xl text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>

              Admin Login
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="admin@eventflow.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">

                <label className="block text-sm font-medium text-[#1A1A2E]">
                  Password
                </label>

                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-[#5B6FD4] hover:underline"
                >
                  Forgot password?
                </button>

              </div>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-[#D95B5B]">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-soft hover:opacity-90 transition-all disabled:opacity-70 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">

                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>

                  Signing in...
                </span>
              ) : (
                'Sign in as Admin'
              )}
            </button>

          </form>

          {/* Participant Information */}
          <div className="mt-6 pt-5 border-t border-[#E8E8F0]">
            <p className="text-center text-xs text-[#9090A8] leading-relaxed">
              Are you a participant? Use the invitation link
              sent to your email. You will sign in using your
              mobile number and a one-time password (OTP).
            </p>
          </div>

        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="mt-6 text-sm text-[#9090A8] hover:text-[#5B6FD4] transition-colors mx-auto block"
        >
          ← Back to Home
        </button>

      </div>
    </div>
  );
}
