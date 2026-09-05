import { useState } from 'react';
import { mockParticipants, mockMessages, type Message } from '../../Data/mockData';

export default function Chat() {
  const [selectedId, setSelectedId] = useState(mockParticipants[0].id);
  const [conversations, setConversations] = useState(mockMessages);
  const [newMsg, setNewMsg] = useState('');

  const selected = mockParticipants.find(p => p.id === selectedId)!;
  const messages: Message[] = conversations[selectedId] || [];

  const send = () => {
    if (!newMsg.trim()) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: 'admin',
      senderName: 'Event Admin',
      senderAvatar: '',
      content: newMsg,
      timestamp: new Date().toISOString(),
      isAdmin: true,
    };
    setConversations(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), msg],
    }));
    setNewMsg('');
  };

  const lastMsg = (id: string) => {
    const msgs = conversations[id] || [];
    return msgs[msgs.length - 1]?.content || 'No messages yet';
  };

  return (
    <div className="h-full flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-[#E8E8F0] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#E8E8F0]">
          <h3 className="font-semibold text-[#1A1A2E] mb-3">Messages</h3>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9090A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mockParticipants.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors text-left ${
                selectedId === p.id ? 'bg-[#EEF2FF]' : ''
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={`https://images.unsplash.com/${p.avatar}?w=80&h=80&fit=crop&auto=format`}
                  alt={p.name}
                  className="w-10 h-10 rounded-full object-cover bg-[#EEF2FF]"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#3D9E8C] border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-[#1A1A2E] truncate">{p.name}</p>
                  {(conversations[p.id]?.length || 0) > 0 && (
                    <span className="text-xs text-[#9090A8] shrink-0 ml-1">
                      {new Date(conversations[p.id][conversations[p.id].length - 1].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9090A8] truncate">{lastMsg(p.id)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#FAFAF7]">
        {/* Header */}
        <div className="bg-white border-b border-[#E8E8F0] px-6 py-4 flex items-center gap-4">
          <img
            src={`https://images.unsplash.com/${selected.avatar}?w=80&h=80&fit=crop&auto=format`}
            alt={selected.name}
            className="w-10 h-10 rounded-full object-cover bg-[#EEF2FF]"
          />
          <div>
            <p className="font-semibold text-[#1A1A2E]">{selected.name}</p>
            <p className="text-xs text-[#9090A8]">{selected.role} · {selected.company}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="text-xs bg-[#E6F4F1] text-[#3D9E8C] px-2.5 py-1 rounded-full font-medium capitalize">
              {selected.registrationStatus}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-soft">
                <svg className="w-6 h-6 text-[#9090A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#1A1A2E]">No messages yet</p>
              <p className="text-xs text-[#9090A8] mt-1">Start a conversation with {selected.name}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
              {!msg.isAdmin ? (
                <img
                  src={`https://images.unsplash.com/${selected.avatar}?w=80&h=80&fit=crop&auto=format`}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full object-cover bg-[#EEF2FF] shrink-0 mt-auto"
                />
              ) : (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto">
                  EA
                </div>
              )}
              <div className={`max-w-sm flex flex-col gap-1 ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.isAdmin
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'bg-white text-[#1A1A2E] shadow-soft rounded-tl-sm border border-[#E8E8F0]'
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

        {/* Input */}
        <div className="bg-white border-t border-[#E8E8F0] p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={`Message ${selected.name}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
            />
            <button
              onClick={send}
              className="gradient-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
