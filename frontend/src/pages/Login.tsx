import { useState } from 'react';

interface LoginProps {
  onLogin: (role: 'admin' | 'participant') => void;
  onBack: () => void;
}

export default function Login({ onLogin, onBack }: LoginProps) {
  const [tab, setTab] = useState<'admin' | 'participant'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(tab);
    }, 1000);
  };

  return (
    <div className="min-h-full gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="font-display text-2xl text-[#1A1A2E]">Evently</span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-elevated p-8 border border-[#E8E8F0]">
          <h1 className="font-display text-3xl text-[#1A1A2E] text-center mb-2">Welcome back</h1>
          <p className="text-sm text-[#9090A8] text-center mb-6">Sign in to your account to continue</p>

          {/* Tabs */}
          <div className="flex bg-[#F3F2EC] rounded-xl p-1 mb-6">
            {(['admin', 'participant'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  tab === t ? 'bg-white text-[#5B6FD4] shadow-soft' : 'text-[#9090A8] hover:text-[#5A5A72]'
                }`}
              >
                {t === 'admin' ? 'Admin' : 'Participant'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={tab === 'admin' ? 'admin@evently.io' : 'your@email.com'}
                className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1A1A2E]">Password</label>
                <a href="#" className="text-xs text-[#5B6FD4] hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
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
              className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-soft hover:opacity-90 transition-all disabled:opacity-70 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : `Sign in as ${tab === 'admin' ? 'Admin' : 'Participant'}`}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E8E8F0]">
            <p className="text-center text-xs text-[#9090A8]">
              Demo credentials — any email and password will work.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setEmail('admin@evently.io'); setPassword('demo1234'); setTab('admin'); }}
                className="text-xs bg-[#EEF2FF] text-[#5B6FD4] py-2 rounded-lg hover:bg-[#E4EAFF] transition-colors font-medium"
              >
                Fill Admin Demo
              </button>
              <button
                onClick={() => { setEmail('sarah.chen@techcorp.io'); setPassword('demo1234'); setTab('participant'); }}
                className="text-xs bg-[#E6F4F1] text-[#3D9E8C] py-2 rounded-lg hover:bg-[#D8EDE9] transition-colors font-medium"
              >
                Fill Participant Demo
              </button>
            </div>
          </div>
        </div>

        <button onClick={onBack} className="mt-6 text-sm text-[#9090A8] hover:text-[#5B6FD4] transition-colors mx-auto block">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
