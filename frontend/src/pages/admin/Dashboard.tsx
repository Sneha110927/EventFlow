import { useState } from 'react';
import { mockEvents, mockParticipants, mockAnnouncements } from '../../Data/mockData';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

export default function AdminDashboard({ onNavigate }: DashboardProps) {
  const [selectedEvent] = useState(mockEvents[0]);
  const confirmed = mockParticipants.filter(p => p.registrationStatus === 'confirmed').length;
  const pending = mockParticipants.filter(p => p.registrationStatus === 'pending').length;
  const pendingDocs = mockParticipants.filter(p => p.documentStatus === 'missing' || p.documentStatus === 'pending').length;

  const stats = [
    { label: 'Registered', value: selectedEvent.registered, total: selectedEvent.capacity, color: '#5B6FD4', bg: 'gradient-card-blue' },
    { label: 'Confirmed', value: confirmed, total: selectedEvent.registered, color: '#3D9E8C', bg: 'gradient-card-teal' },
    { label: 'Pending', value: pending, total: selectedEvent.registered, color: '#E8A438', bg: 'gradient-card-peach' },
    { label: 'Docs Pending', value: pendingDocs, total: mockParticipants.length, color: '#9B7ECB', bg: 'gradient-card-lavender' },
  ];

  const activities = [
    { text: 'Sarah Chen uploaded ID document', time: '2m ago', type: 'doc' },
    { text: 'Marcus Williams accepted invitation', time: '15m ago', type: 'invite' },
    { text: 'New registration: David Park', time: '1h ago', type: 'reg' },
    { text: 'Announcement sent to 847 participants', time: '3h ago', type: 'announce' },
    { text: 'James Holloway joined waitlist', time: '5h ago', type: 'reg' },
    { text: 'Elena Vasquez document approved', time: '6h ago', type: 'doc' },
  ];

  const activityColors: Record<string, string> = {
    doc: '#5B6FD4', invite: '#3D9E8C', reg: '#9B7ECB', announce: '#E8824A'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome + event info */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 gradient-primary rounded-2xl p-6 text-white shadow-card">
          <p className="text-white/70 text-sm mb-1">Welcome back,</p>
          <h2 className="font-display text-2xl mb-4">Event Admin</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Event</p>
              <p className="font-semibold">{selectedEvent.name}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Date</p>
              <p className="font-semibold">{new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Venue</p>
              <p className="font-semibold">{selectedEvent.venue}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Capacity</span>
              <span>{selectedEvent.registered}/{selectedEvent.capacity}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(selectedEvent.registered / selectedEvent.capacity) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E8F0] shadow-soft lg:w-72">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Invite Participants', page: 'invitations', color: '#5B6FD4', bg: '#EEF2FF' },
              { label: 'Send Announcement', page: 'announcements', color: '#3D9E8C', bg: '#E6F4F1' },
              { label: 'Review Documents', page: 'documents', color: '#9B7ECB', bg: '#F0EBFB' },
              { label: 'Open Chat', page: 'chat', color: '#E8824A', bg: '#FEF3ED' },
            ].map(a => (
              <button
                key={a.page}
                onClick={() => onNavigate(a.page)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity text-sm font-medium"
                style={{ backgroundColor: a.bg, color: a.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white/60 shadow-soft`}>
            <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider mb-2">{s.label}</p>
            <p className="font-display text-3xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#9090A8] mt-1">of {s.total} total</p>
            <div className="mt-3 h-1 bg-white/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(s.value / s.total) * 100}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent participants */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8F0]">
            <h3 className="font-semibold text-[#1A1A2E]">Recent Participants</h3>
            <button onClick={() => onNavigate('participants')} className="text-xs text-[#5B6FD4] hover:underline font-medium">View all</button>
          </div>
          <div className="divide-y divide-[#F0F0F8]">
            {mockParticipants.slice(0, 5).map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate('participant-profile', p.id)}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FAFAF7] cursor-pointer transition-colors"
              >
                <img
                  src={`https://images.unsplash.com/${p.avatar}?w=80&h=80&fit=crop&auto=format`}
                  alt={p.name}
                  className="w-9 h-9 rounded-full object-cover bg-[#EEF2FF] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A2E]">{p.name}</p>
                  <p className="text-xs text-[#9090A8] truncate">{p.company}</p>
                </div>
                <StatusBadge status={p.registrationStatus} />
                <DocBadge status={p.documentStatus} />
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E8F0]">
            <h3 className="font-semibold text-[#1A1A2E]">Recent Activity</h3>
          </div>
          <div className="px-5 py-3 space-y-3 overflow-y-auto max-h-80">
            {activities.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: activityColors[a.type] }} />
                <div>
                  <p className="text-xs text-[#1A1A2E] leading-snug">{a.text}</p>
                  <p className="text-xs text-[#9090A8] mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8F0]">
          <h3 className="font-semibold text-[#1A1A2E]">All Events</h3>
          <button onClick={() => onNavigate('event-builder')} className="text-xs font-semibold text-white gradient-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
            + New Event
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-medium text-[#9090A8] uppercase tracking-wider border-b border-[#F0F0F8]">
                <th className="text-left px-6 py-3">Event</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-left px-6 py-3">Venue</th>
                <th className="text-left px-6 py-3">Registered</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F8]">
              {mockEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#FAFAF7] transition-colors">
                  <td className="px-6 py-3.5 font-medium text-[#1A1A2E]">{ev.name}</td>
                  <td className="px-6 py-3.5">
                    <span className="capitalize text-xs bg-[#EEF2FF] text-[#5B6FD4] px-2.5 py-1 rounded-full font-medium">{ev.type}</span>
                  </td>
                  <td className="px-6 py-3.5 text-[#5A5A72]">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td className="px-6 py-3.5 text-[#5A5A72]">{ev.venue}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-[#1A1A2E] font-medium">{ev.registered}</span>
                    <span className="text-[#9090A8]">/{ev.capacity}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="capitalize text-xs bg-[#E6F4F1] text-[#3D9E8C] px-2.5 py-1 rounded-full font-medium">{ev.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcements preview */}
      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8F0]">
          <h3 className="font-semibold text-[#1A1A2E]">Recent Announcements</h3>
          <button onClick={() => onNavigate('announcements')} className="text-xs text-[#5B6FD4] hover:underline font-medium">View all</button>
        </div>
        <div className="divide-y divide-[#F0F0F8]">
          {mockAnnouncements.map((a) => (
            <div key={a.id} className="px-6 py-4 hover:bg-[#FAFAF7] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#1A1A2E] mb-0.5">{a.title}</p>
                  <p className="text-xs text-[#9090A8]">{new Date(a.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#5A5A72] font-medium">{a.readCount}/{a.totalCount} read</p>
                  <div className="w-16 h-1 bg-[#E8E8F0] rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-[#5B6FD4] rounded-full" style={{ width: `${(a.readCount / a.totalCount) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    confirmed: { bg: '#E6F4F1', text: '#3D9E8C', label: 'Confirmed' },
    pending: { bg: '#FEF3ED', text: '#E8824A', label: 'Pending' },
    waitlisted: { bg: '#F0EBFB', text: '#9B7ECB', label: 'Waitlisted' },
    cancelled: { bg: '#FFF0F0', text: '#D95B5B', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}

function DocBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: '#E6F4F1', text: '#3D9E8C', label: '✓' },
    pending: { bg: '#FEF3ED', text: '#E8824A', label: '⏳' },
    missing: { bg: '#FFF0F0', text: '#D95B5B', label: '!' },
    rejected: { bg: '#FFF0F0', text: '#D95B5B', label: '✕' },
  };
  const s = map[status] || map.missing;
  return <span className="text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}
