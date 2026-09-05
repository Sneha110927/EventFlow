import { useState } from 'react';
import { mockAnnouncements, type Announcement } from '../../Data/mockData';

export default function Announcements() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [notification, setNotification] = useState('');

  const show = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    const newA: Announcement = {
      id: `a-${Date.now()}`,
      title,
      content,
      target,
      sentAt: new Date().toISOString(),
      sentBy: 'Event Admin',
      readCount: 0,
      totalCount: target === 'all' ? 847 : target === 'confirmed' ? 712 : 135,
    };
    setAnnouncements(prev => [newA, ...prev]);
    show(`Announcement sent to ${target === 'all' ? 'all 847' : target === 'confirmed' ? '712 confirmed' : '135 pending'} participants`);
    setTitle(''); setContent(''); setTarget('all');
    setView('list');
  };

  const targetLabels = { all: 'All Participants', confirmed: 'Confirmed Only', pending: 'Pending Only' };
  const targetColors = { all: '#5B6FD4', confirmed: '#3D9E8C', pending: '#E8824A' };
  const targetBgs = { all: '#EEF2FF', confirmed: '#E6F4F1', pending: '#FEF3ED' };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#1A1A2E]">Announcements</h2>
          <p className="text-sm text-[#9090A8] mt-0.5">Broadcast messages to participants</p>
        </div>
        <button
          onClick={() => setView(v => v === 'list' ? 'create' : 'list')}
          className={`text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
            view === 'create'
              ? 'bg-[#F0F0F8] text-[#5A5A72] hover:bg-[#E8E8F0]'
              : 'gradient-primary text-white shadow-soft hover:opacity-90'
          }`}
        >
          {view === 'create' ? '← Back to List' : '+ New Announcement'}
        </button>
      </div>

      {view === 'create' && (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
          <h3 className="font-semibold text-[#1A1A2E] mb-5">Create Announcement</h3>
          <form onSubmit={send} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Title</label>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Important Update: Venue Information"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Message</label>
              <textarea
                rows={5}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your announcement here..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-3">Send to</label>
              <div className="grid grid-cols-3 gap-3">
                {(['all', 'confirmed', 'pending'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTarget(t)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      target === t ? 'border-current' : 'border-[#E8E8F0] hover:border-[#C0C0D8]'
                    }`}
                    style={target === t ? { background: targetBgs[t], color: targetColors[t], borderColor: targetColors[t] } : {}}
                  >
                    <p>{targetLabels[t]}</p>
                    <p className="text-xs font-normal mt-0.5" style={{ color: target === t ? targetColors[t] : '#9090A8' }}>
                      {t === 'all' ? '847 participants' : t === 'confirmed' ? '712 participants' : '135 participants'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="gradient-primary text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
                Send Announcement
              </button>
              <button type="button" onClick={() => show('Draft saved')} className="bg-[#F0F0F8] text-[#5A5A72] font-medium px-6 py-3 rounded-xl hover:bg-[#E8E8F0] transition-colors">
                Save Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft py-20 text-center">
              <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1A1A2E]">No announcements yet</p>
              <p className="text-xs text-[#9090A8] mt-1">Create your first broadcast message</p>
            </div>
          ) : (
            announcements.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-[#1A1A2E]">{a.title}</h3>
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{ background: targetBgs[a.target], color: targetColors[a.target] }}
                      >
                        {targetLabels[a.target]}
                      </span>
                    </div>
                    <p className="text-sm text-[#5A5A72] leading-relaxed">{a.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-[#9090A8]">
                      <span>Sent {new Date(a.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>by {a.sentBy}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[#1A1A2E]">{Math.round((a.readCount / a.totalCount) * 100)}%</p>
                    <p className="text-xs text-[#9090A8]">{a.readCount}/{a.totalCount} read</p>
                    <div className="w-20 h-1.5 bg-[#F0F0F8] rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-[#5B6FD4] rounded-full" style={{ width: `${(a.readCount / a.totalCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
