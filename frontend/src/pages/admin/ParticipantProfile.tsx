import { useState } from 'react';
import { mockParticipants, mockMessages, type Message } from '../../Data/mockData';

interface ParticipantProfileProps {
  participantId: string;
  onBack: () => void;
}

export default function ParticipantProfile({ participantId, onBack }: ParticipantProfileProps) {
  const participant = mockParticipants.find(p => p.id === participantId) || mockParticipants[0];
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'chat'>('details');
  const [messages, setMessages] = useState<Message[]>(mockMessages[participant.id] || []);
  const [newMessage, setNewMessage] = useState('');
  const [notification, setNotification] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: 'admin',
      senderName: 'Event Admin',
      senderAvatar: '',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isAdmin: true,
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const showNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(''), 3000);
  };

  const tabs = [
    { id: 'details', label: 'Personal Details' },
    { id: 'documents', label: `Documents (${participant.documents.length})` },
    { id: 'chat', label: 'Private Chat' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium animate-pulse">
          ✓ {notification}
        </div>
      )}

      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#9090A8] hover:text-[#5B6FD4] transition-colors">
        ← Back to Participants
      </button>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
        <div className="h-24 gradient-primary" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
            <img
              src={`https://images.unsplash.com/${participant.avatar}?w=120&h=120&fit=crop&auto=format`}
              alt={participant.name}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-card bg-[#EEF2FF]"
            />
            <div className="flex-1 mt-10 sm:mt-12">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-[#1A1A2E]">{participant.name}</h2>
                  <p className="text-sm text-[#9090A8]">{participant.role} · {participant.company}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <StatusPill label={participant.registrationStatus} type="reg" />
                  <StatusPill label={participant.invitationStatus} type="inv" />
                  <StatusPill label={participant.documentStatus} type="doc" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F2EC] rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === t.id ? 'bg-white text-[#5B6FD4] shadow-soft' : 'text-[#9090A8] hover:text-[#5A5A72]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6 space-y-4">
            <h3 className="font-semibold text-[#1A1A2E]">Contact Information</h3>
            {[
              { label: 'Full Name', value: participant.name },
              { label: 'Email Address', value: participant.email },
              { label: 'Phone Number', value: participant.phone },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-sm text-[#1A1A2E]">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6 space-y-4">
            <h3 className="font-semibold text-[#1A1A2E]">Event Information</h3>
            {[
              { label: 'Organization', value: participant.company },
              { label: 'Title / Role', value: participant.role },
              { label: 'Registered', value: new Date(participant.joinedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
              { label: 'Event', value: 'Tech Summit 2026' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider mb-1">{f.label}</p>
                <p className="text-sm text-[#1A1A2E]">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="sm:col-span-2 bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-4">Admin Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => showNotification('Status updated to Confirmed')} className="text-sm font-medium bg-[#E6F4F1] text-[#3D9E8C] px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
                ✓ Confirm Registration
              </button>
              <button onClick={() => showNotification('Reminder email sent')} className="text-sm font-medium bg-[#EEF2FF] text-[#5B6FD4] px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
                Send Reminder
              </button>
              <button onClick={() => showNotification('Participant moved to waitlist')} className="text-sm font-medium bg-[#F0EBFB] text-[#9B7ECB] px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
                Move to Waitlist
              </button>
              <button onClick={() => showNotification('Invitation resent')} className="text-sm font-medium bg-[#FEF3ED] text-[#E8824A] px-4 py-2 rounded-xl hover:opacity-80 transition-opacity">
                Resend Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          {participant.documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft py-16 text-center">
              <div className="w-12 h-12 bg-[#FFF0F0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#D95B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1A1A2E]">No documents submitted</p>
              <p className="text-xs text-[#9090A8] mt-1">This participant hasn't uploaded any documents yet</p>
            </div>
          ) : (
            participant.documents.map(doc => (
              <div key={doc.id} className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A2E] text-sm">{doc.name}</p>
                  <p className="text-xs text-[#9090A8]">{doc.size} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <DocStatusBadge status={doc.status} />
                <div className="flex gap-2">
                  <button onClick={() => showNotification('Document downloaded')} className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">
                    Download
                  </button>
                  {doc.status === 'pending' && (
                    <>
                      <button onClick={() => showNotification('Document approved')} className="text-xs bg-[#E6F4F1] text-[#3D9E8C] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">
                        Approve
                      </button>
                      <button onClick={() => showNotification('Document rejected')} className="text-xs bg-[#FFF0F0] text-[#D95B5B] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden flex flex-col" style={{ height: '480px' }}>
          <div className="px-5 py-4 border-b border-[#E8E8F0] flex items-center gap-3">
            <img
              src={`https://images.unsplash.com/${participant.avatar}?w=80&h=80&fit=crop&auto=format`}
              alt={participant.name}
              className="w-8 h-8 rounded-full object-cover bg-[#EEF2FF]"
            />
            <div>
              <p className="text-sm font-semibold text-[#1A1A2E]">{participant.name}</p>
              <p className="text-xs text-[#9090A8]">Private conversation</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-sm text-[#9090A8]">No messages yet. Start the conversation.</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                {!msg.isAdmin && (
                  <img
                    src={`https://images.unsplash.com/${participant.avatar}?w=80&h=80&fit=crop&auto=format`}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover bg-[#EEF2FF] shrink-0 mt-auto"
                  />
                )}
                {msg.isAdmin && (
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto">
                    EA
                  </div>
                )}
                <div className={`max-w-xs lg:max-w-sm ${msg.isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.isAdmin
                        ? 'gradient-primary text-white rounded-tr-sm'
                        : 'bg-[#F3F2EC] text-[#1A1A2E] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-xs text-[#C0C0D0]">
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[#E8E8F0]">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
              />
              <button
                onClick={sendMessage}
                className="gradient-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ label, type }: { label: string; type: string }) {
  const colors: Record<string, Record<string, { bg: string; text: string }>> = {
    reg: {
      confirmed: { bg: '#E6F4F1', text: '#3D9E8C' },
      pending: { bg: '#FEF3ED', text: '#E8824A' },
      waitlisted: { bg: '#F0EBFB', text: '#9B7ECB' },
      cancelled: { bg: '#FFF0F0', text: '#D95B5B' },
    },
    inv: {
      invited: { bg: '#EEF2FF', text: '#5B6FD4' },
      opened: { bg: '#FEF3ED', text: '#E8824A' },
      accepted: { bg: '#E6F4F1', text: '#3D9E8C' },
      registered: { bg: '#E6F4F1', text: '#2E7A6A' },
    },
    doc: {
      approved: { bg: '#E6F4F1', text: '#3D9E8C' },
      pending: { bg: '#FEF3ED', text: '#E8824A' },
      missing: { bg: '#FFF0F0', text: '#D95B5B' },
      rejected: { bg: '#FFF0F0', text: '#D95B5B' },
    },
  };
  const c = colors[type]?.[label] || { bg: '#F0F0F8', text: '#9090A8' };
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: c.bg, color: c.text }}>
      {label}
    </span>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: '#E6F4F1', text: '#3D9E8C', label: 'Approved' },
    pending: { bg: '#FEF3ED', text: '#E8824A', label: 'Pending Review' },
    rejected: { bg: '#FFF0F0', text: '#D95B5B', label: 'Rejected' },
    missing: { bg: '#FFF0F0', text: '#D95B5B', label: 'Missing' },
  };
  const s = map[status] || map.pending;
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}
