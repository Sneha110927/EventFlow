import { useState } from 'react';

interface ForgotPasswordProps {
  onBack: () => void;
  onResetLink: (link: string) => void;
}

export default function ForgotPassword({
  onBack,
  onResetLink,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:5000/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data: {
        message?: string;
        resetLink?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to process password reset.'
        );
      }

      if (!data.resetLink) {
        throw new Error(
          'Reset link was not generated.'
        );
      }

      onResetLink(data.resetLink);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card">
              <span className="text-white font-bold">
                E
              </span>
            </div>

            <span className="font-display text-2xl text-[#1A1A2E]">
              EventFlow
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-elevated p-8 border border-[#E8E8F0]">

          <h1 className="font-display text-3xl text-[#1A1A2E] text-center mb-2">
            Forgot password?
          </h1>

          <p className="text-sm text-[#9090A8] text-center mb-7">
            Enter your registered email address and
            we'll help you reset your password.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

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
                className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-[#D95B5B]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-soft disabled:opacity-70"
            >
              {loading
                ? 'Generating reset link...'
                : 'Reset Password'}
            </button>

          </form>

          <button
            onClick={onBack}
            className="mt-6 text-sm text-[#9090A8] hover:text-[#5B6FD4] transition-colors mx-auto block"
          >
            ← Back to Login
          </button>

        </div>

      </div>
    </div>
  );
}