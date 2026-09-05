import { useState } from 'react';
import { mockParticipants, type RegistrationStatus, type InvitationStatus, type DocumentStatus } from '../../Data/mockData';

interface ParticipantsProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function Participants({ onNavigate }: ParticipantsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockParticipants.filter(p => {
    const q = search.toLowerCase();
    const match = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.company.toLowerCase().includes(q);
    const statusMatch = statusFilter === 'all' || p.registrationStatus === statusFilter;
    return match && statusMatch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#1A1A2E]">Participants</h2>
          <p className="text-sm text-[#9090A8] mt-0.5">{mockParticipants.length} participants registered for Tech Summit 2026</p>
        </div>
        <button
          onClick={() => onNavigate('invitations')}
          className="gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft hover:opacity-90 transition-opacity"
        >
          + Invite Participants
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9090A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-white text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'confirmed', 'pending', 'waitlisted'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === s ? 'bg-[#5B6FD4] text-white shadow-sm' : 'bg-white text-[#5A5A72] border border-[#E8E8F0] hover:border-[#5B6FD4]/30'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#1A1A2E]">No participants found</p>
            <p className="text-xs text-[#9090A8] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F8]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Participant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Registration</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Invitation</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Documents</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F8]">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onNavigate('participant-profile', p.id)}
                    className="hover:bg-[#FAFAF7] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://images.unsplash.com/${p.avatar}?w=80&h=80&fit=crop&auto=format`}
                          alt={p.name}
                          className="w-9 h-9 rounded-full object-cover bg-[#EEF2FF] shrink-0"
                        />
                        <div>
                          <p className="font-medium text-[#1A1A2E]">{p.name}</p>
                          <p className="text-xs text-[#9090A8]">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#5A5A72]">{p.company}</p>
                      <p className="text-xs text-[#9090A8]">{p.role}</p>
                    </td>
                    <td className="px-6 py-4"><RegBadge status={p.registrationStatus} /></td>
                    <td className="px-6 py-4"><InvBadge status={p.invitationStatus} /></td>
                    <td className="px-6 py-4"><DocBadge status={p.documentStatus} /></td>
                    <td className="px-6 py-4 text-[#9090A8] text-xs">
                      {new Date(p.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs text-[#5B6FD4] font-medium hover:underline">View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RegBadge({ status }: { status: RegistrationStatus }) {
  const map = {
    confirmed: { bg: '#E6F4F1', text: '#3D9E8C', label: 'Confirmed' },
    pending: { bg: '#FEF3ED', text: '#E8824A', label: 'Pending' },
    waitlisted: { bg: '#F0EBFB', text: '#9B7ECB', label: 'Waitlisted' },
    cancelled: { bg: '#FFF0F0', text: '#D95B5B', label: 'Cancelled' },
  };
  const s = map[status];
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}

function InvBadge({ status }: { status: InvitationStatus }) {
  const map = {
    invited: { bg: '#EEF2FF', text: '#5B6FD4', label: 'Invited' },
    opened: { bg: '#FEF3ED', text: '#E8824A', label: 'Opened' },
    accepted: { bg: '#E6F4F1', text: '#3D9E8C', label: 'Accepted' },
    registered: { bg: '#E6F4F1', text: '#2E7A6A', label: 'Registered' },
  };
  const s = map[status];
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}

function DocBadge({ status }: { status: DocumentStatus }) {
  const map = {
    approved: { bg: '#E6F4F1', text: '#3D9E8C', label: 'Approved' },
    pending: { bg: '#FEF3ED', text: '#E8824A', label: 'Under Review' },
    missing: { bg: '#FFF0F0', text: '#D95B5B', label: 'Missing' },
    rejected: { bg: '#FFF0F0', text: '#D95B5B', label: 'Rejected' },
  };
  const s = map[status];
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}
