import { useState } from 'react';
import { mockParticipants, mockMessages, mockAnnouncements, type Message } from '../../Data/mockData';

interface ParticipantDashboardProps {
  onLogout: () => void;
}

export default function ParticipantDashboard({ onLogout }: ParticipantDashboardProps) {
  const participant = mockParticipants[0]; // Sarah Chen as logged-in participant
  const [activeTab, setActiveTab] = useState<'home' | 'documents' | 'announcements' | 'chat'>('home');
  const [messages, setMessages] = useState<Message[]>(mockMessages[participant.id] || []);
  const [newMsg, setNewMsg] = useState('');
  const [notification, setNotification] = useState('');

  const show = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const sendMsg = () => {
    if (!newMsg.trim()) return;
    const m: Message = {
      id: `m${Date.now()}`,
      senderId: participant.id,
      senderName: participant.name,
      senderAvatar: participant.avatar,
      content: newMsg,
      timestamp: new Date().toISOString(),
      isAdmin: false,
    };
    setMessages(prev => [...prev, m]);
    setNewMsg('');
  };

  const navItems = [
    { id: 'home', label: 'Overview' },
    { id: 'documents', label: `Documents (${participant.documents.length})` },
    { id: 'announcements', label: 'Announcements' },
    { id: 'chat', label: 'Chat with Admin' },
  ];

  const progress = [
    { label: 'Registration', done: true },
    { label: 'Email Confirmed', done: true },
    { label: 'Documents Uploaded', done: participant.documents.length > 0 },
    { label: 'Documents Approved', done: participant.documentStatus === 'approved' },
    { label: 'Check-in Ready', done: false },
  ];

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      {/* Top nav */}
      <nav className="bg-white border-b border-[#E8E8F0] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="font-display text-lg text-[#1A1A2E]">Evently</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src={`https://images.unsplash.com/${participant.avatar}?w=60&h=60&fit=crop&auto=format`}
                alt={participant.name}
                className="w-7 h-7 rounded-full object-cover bg-[#EEF2FF]"
              />
              <span className="text-sm font-medium text-[#1A1A2E] hidden sm:block">{participant.name}</span>
            </div>
            <button onClick={onLogout} className="text-xs text-[#9090A8] hover:text-[#D95B5B] transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Hero card */}
        <div className="gradient-primary rounded-2xl p-6 text-white shadow-card">
          <p className="text-white/70 text-sm">Welcome back,</p>
          <h1 className="font-display text-3xl mt-1 mb-4">{participant.name}</h1>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Event</p>
              <p className="font-semibold">Tech Summit 2026</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Date</p>
              <p className="font-semibold">Oct 15–17, 2026</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Venue</p>
              <p className="font-semibold">Moscone Center, SF</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Status</p>
              <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold capitalize">
                {participant.registrationStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#E8E8F0] shadow-soft w-fit">
          {navItems.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === t.id ? 'bg-[#5B6FD4] text-white shadow-sm' : 'text-[#9090A8] hover:text-[#5A5A72]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Home */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Progress */}
            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
              <h3 className="font-semibold text-[#1A1A2E] mb-4">Registration Progress</h3>
              <div className="space-y-3">
                {progress.map((p, i) => (
                  <div key={p.label} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      p.done ? 'bg-[#3D9E8C]' : i === progress.findIndex(pp => !pp.done) ? 'bg-[#EEF2FF] border-2 border-[#5B6FD4]' : 'bg-[#F0F0F8]'
                    }`}>
                      {p.done ? (
                        <span className="text-white text-xs font-bold">✓</span>
                      ) : i === progress.findIndex(pp => !pp.done) ? (
                        <span className="text-[#5B6FD4] text-xs font-bold">→</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#D0D0E0]" />
                      )}
                    </div>
                    <span className={`text-sm ${p.done ? 'text-[#1A1A2E] font-medium' : 'text-[#9090A8]'}`}>{p.label}</span>
                    {!p.done && i === progress.findIndex(pp => !pp.done) && (
                      <span className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-2 py-0.5 rounded-full font-medium ml-auto">Next</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">
                <h3 className="font-semibold text-[#1A1A2E] mb-3 text-sm">Your Details</h3>
                <div className="space-y-2.5">
                  {[
                    { l: 'Company', v: participant.company },
                    { l: 'Role', v: participant.role },
                    { l: 'Email', v: participant.email },
                    { l: 'Phone', v: participant.phone },
                  ].map(f => (
                    <div key={f.l} className="flex justify-between text-sm">
                      <span className="text-[#9090A8]">{f.l}</span>
                      <span className="text-[#1A1A2E] font-medium text-right">{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">
                <h3 className="font-semibold text-[#1A1A2E] mb-3 text-sm">Document Status</h3>
                {participant.documents.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-[#D95B5B] font-medium">No documents uploaded</p>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="mt-2 text-xs text-[#5B6FD4] font-medium hover:underline"
                    >
                      Upload now →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participant.documents.map(d => (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <span className="text-[#5A5A72] truncate">{d.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                          d.status === 'approved' ? 'bg-[#E6F4F1] text-[#3D9E8C]' : 'bg-[#FEF3ED] text-[#E8824A]'
                        }`}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Latest announcement */}
            {mockAnnouncements[0] && (
              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#1A1A2E] text-sm">Latest Announcement</h3>
                  <button onClick={() => setActiveTab('announcements')} className="text-xs text-[#5B6FD4] hover:underline font-medium">View all</button>
                </div>
                <p className="font-medium text-sm text-[#1A1A2E] mb-1">{mockAnnouncements[0].title}</p>
                <p className="text-xs text-[#5A5A72] leading-relaxed line-clamp-2">{mockAnnouncements[0].content}</p>
                <p className="text-xs text-[#9090A8] mt-2">{new Date(mockAnnouncements[0].sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            )}

            {/* Chat CTA */}
            <button
              onClick={() => setActiveTab('chat')}
              className="w-full gradient-teal text-white rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition-opacity text-left shadow-card"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Chat with the Event Team</p>
                <p className="text-sm text-white/80">Have a question? We're here to help.</p>
              </div>
              <span className="ml-auto text-white/70">→</span>
            </button>
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="bg-[#FEF3ED] border border-[#E8C49C] rounded-2xl p-4 flex gap-3">
              <span className="text-[#E8824A]">⚠</span>
              <p className="text-sm text-[#E8824A]">Please upload all required documents before <strong>September 30, 2026</strong>.</p>
            </div>
            {participant.documents.length > 0 ? participant.documents.map(doc => (
              <div key={doc.id} className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A2E] text-sm">{doc.name}</p>
                  <p className="text-xs text-[#9090A8]">{doc.size} · {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  doc.status === 'approved' ? 'bg-[#E6F4F1] text-[#3D9E8C]' : 'bg-[#FEF3ED] text-[#E8824A]'
                }`}>{doc.status === 'approved' ? 'Approved' : 'Pending Review'}</span>
                <button onClick={() => show('Document downloaded')} className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">
                  Download
                </button>
              </div>
            )) : null}
            <button
              onClick={() => show('File upload dialog opened')}
              className="w-full border-2 border-dashed border-[#D0D0E8] rounded-2xl p-8 text-center hover:border-[#5B6FD4] transition-colors cursor-pointer bg-white"
            >
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1A1A2E]">Upload a document</p>
              <p className="text-xs text-[#9090A8] mt-0.5">PDF, JPG, PNG up to 10MB</p>
            </button>
          </div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {mockAnnouncements.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A2E]">{a.title}</p>
                    <p className="text-xs text-[#9090A8] mt-0.5">{new Date(a.sentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <p className="text-sm text-[#5A5A72] leading-relaxed ml-11">{a.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Chat */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden flex flex-col" style={{ height: '480px' }}>
            <div className="px-5 py-4 border-b border-[#E8E8F0] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">EA</div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Event Admin</p>
                <p className="text-xs text-[#3D9E8C] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D9E8C]" /> Online
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-sm text-[#9090A8]">No messages yet. Say hello!</div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${!msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                  {msg.isAdmin ? (
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto">EA</div>
                  ) : (
                    <img
                      src={`https://images.unsplash.com/${participant.avatar}?w=80&h=80&fit=crop&auto=format`}
                      alt={participant.name}
                      className="w-8 h-8 rounded-full object-cover bg-[#EEF2FF] shrink-0 mt-auto"
                    />
                  )}
                  <div className={`max-w-xs flex flex-col gap-1 ${!msg.isAdmin ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      !msg.isAdmin
                        ? 'gradient-primary text-white rounded-tr-sm'
                        : 'bg-[#F3F2EC] text-[#1A1A2E] rounded-tl-sm'
                    }`}>
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
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                />
                <button onClick={sendMsg} className="gradient-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
