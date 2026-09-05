import { useState } from 'react';
import { mockParticipants } from '../../Data/mockData';

export default function Invitations() {
  const [tab, setTab] = useState<'overview' | 'create' | 'import'>('overview');
  const [notification, setNotification] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [copied, setCopied] = useState('');

  const show = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const statusGroups = {
    invited: mockParticipants.filter(p => p.invitationStatus === 'invited'),
    opened: mockParticipants.filter(p => p.invitationStatus === 'opened'),
    accepted: mockParticipants.filter(p => p.invitationStatus === 'accepted'),
    registered: mockParticipants.filter(p => p.invitationStatus === 'registered'),
  };

  const total = mockParticipants.length;
  const stats = [
    { label: 'Invited', value: statusGroups.invited.length, color: '#5B6FD4', bg: '#EEF2FF', pct: Math.round((statusGroups.invited.length / total) * 100) },
    { label: 'Opened', value: statusGroups.opened.length, color: '#E8824A', bg: '#FEF3ED', pct: Math.round((statusGroups.opened.length / total) * 100) },
    { label: 'Accepted', value: statusGroups.accepted.length, color: '#3D9E8C', bg: '#E6F4F1', pct: Math.round((statusGroups.accepted.length / total) * 100) },
    { label: 'Registered', value: statusGroups.registered.length, color: '#2E7A6A', bg: '#D8EDE9', pct: Math.round((statusGroups.registered.length / total) * 100) },
  ];

  const invitationLink = 'https://evently.io/invite/tech-summit-2026/eyJhbGciOiJIUzI1NiJ9';

  const copyLink = (link: string) => {
    setCopied(link);
    show('Invitation link copied to clipboard');
    setTimeout(() => setCopied(''), 2000);
  };

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    show(`Invitation sent to ${email}`);
    setEmail(''); setName(''); setCompany('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#1A1A2E]">Invitations</h2>
          <p className="text-sm text-[#9090A8] mt-0.5">Manage and track participant invitations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider">{s.label}</p>
              <span className="text-xs font-bold" style={{ color: s.color }}>{s.pct}%</span>
            </div>
            <p className="font-display text-3xl" style={{ color: s.color }}>{s.value}</p>
            <div className="mt-3 h-1 bg-[#F0F0F8] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Invitation link */}
      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
        <h3 className="font-semibold text-[#1A1A2E] mb-3">Public Registration Link</h3>
        <p className="text-sm text-[#5A5A72] mb-4">Share this link for open registrations. Anyone with the link can register.</p>
        <div className="flex gap-3">
          <div className="flex-1 px-4 py-2.5 bg-[#FAFAF7] border border-[#E8E8F0] rounded-xl text-sm text-[#5A5A72] font-mono truncate">
            {invitationLink}
          </div>
          <button
            onClick={() => copyLink(invitationLink)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              copied === invitationLink ? 'bg-[#E6F4F1] text-[#3D9E8C]' : 'gradient-primary text-white hover:opacity-90'
            }`}
          >
            {copied === invitationLink ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F2EC] rounded-xl p-1 w-fit">
        {(['overview', 'create', 'import'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              tab === t ? 'bg-white text-[#5B6FD4] shadow-soft' : 'text-[#9090A8] hover:text-[#5A5A72]'
            }`}
          >
            {t === 'create' ? 'Send Invite' : t === 'import' ? 'Import List' : 'Track Status'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F8]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Participant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F8]">
                {mockParticipants.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://images.unsplash.com/${p.avatar}?w=80&h=80&fit=crop&auto=format`}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover bg-[#EEF2FF]"
                        />
                        <div>
                          <p className="font-medium text-[#1A1A2E]">{p.name}</p>
                          <p className="text-xs text-[#9090A8]">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[#5A5A72]">{p.company}</td>
                    <td className="px-6 py-3.5"><InvBadge status={p.invitationStatus} /></td>
                    <td className="px-6 py-3.5">
                      {(p.invitationStatus === 'invited' || p.invitationStatus === 'opened') && (
                        <button onClick={() => show(`Reminder sent to ${p.name}`)} className="text-xs text-[#5B6FD4] font-medium hover:underline">
                          Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'create' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-5">Send Individual Invitation</h3>
            <form onSubmit={sendInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Full Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Company</label>
                <input
                  type="text" value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Personal Message (optional)</label>
                <textarea
                  rows={3}
                  placeholder="We'd love for you to join us at Tech Summit 2026..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all resize-none"
                />
              </div>
              <button type="submit" className="w-full gradient-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-2">Import Participant List</h3>
            <p className="text-sm text-[#9090A8] mb-5">Upload a CSV file with columns: Name, Email, Company, Role</p>
            <div
              className="border-2 border-dashed border-[#D0D0E8] rounded-2xl p-10 text-center hover:border-[#5B6FD4] transition-colors cursor-pointer"
              onClick={() => show('File upload dialog opened')}
            >
              <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1A1A2E]">Drop CSV file here</p>
              <p className="text-xs text-[#9090A8] mt-1">or click to browse</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8E8F0]">
              <p className="text-xs text-[#9090A8] mb-2">Download template</p>
              <button onClick={() => show('Template downloaded')} className="text-xs text-[#5B6FD4] font-medium hover:underline">
                participants-template.csv
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    invited: { bg: '#EEF2FF', text: '#5B6FD4', label: 'Invited' },
    opened: { bg: '#FEF3ED', text: '#E8824A', label: 'Opened' },
    accepted: { bg: '#E6F4F1', text: '#3D9E8C', label: 'Accepted' },
    registered: { bg: '#D8EDE9', text: '#2E7A6A', label: 'Registered' },
  };
  const s = map[status] || map.invited;
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}
