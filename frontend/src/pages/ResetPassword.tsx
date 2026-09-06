import { useState } from 'react';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
}

export default function ResetPassword({
  token,
  onSuccess,
}: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data: {
        message?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to reset password.'
        );
      }

      setMessage(
        'Password changed successfully! Redirecting to login...'
      );

      setTimeout(() => {
        onSuccess();
      }, 1500);
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
            Create new password
          </h1>

          <p className="text-sm text-[#9090A8] text-center mb-7">
            Enter a new password for your EventFlow
            account.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                New password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Confirm new password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Enter password again"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-[#D95B5B]">
                {error}
              </div>
            )}

            {message && (
              <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-soft disabled:opacity-70"
            >
              {loading
                ? 'Updating password...'
                : 'Update Password'}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}