import { useState } from 'react';
import { mockDocumentRequests, mockParticipants } from '../../Data/mockData';

export default function Documents() {
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'submissions'>('requests');

  const show = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const allDocs = mockParticipants.flatMap(p =>
    p.documents.map(d => ({ ...d, participantName: p.name, participantAvatar: p.avatar }))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#1A1A2E]">Documents</h2>
          <p className="text-sm text-[#9090A8] mt-0.5">Manage document requests and participant uploads</p>
        </div>
        <button onClick={() => show('New document request created')} className="gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft hover:opacity-90 transition-opacity">
          + New Request
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: allDocs.length, color: '#5B6FD4', bg: '#EEF2FF' },
          { label: 'Approved', value: allDocs.filter(d => d.status === 'approved').length, color: '#3D9E8C', bg: '#E6F4F1' },
          { label: 'Pending Review', value: allDocs.filter(d => d.status === 'pending').length, color: '#E8A438', bg: '#FEF3ED' },
          { label: 'Missing', value: mockParticipants.filter(p => p.documentStatus === 'missing').length, color: '#D95B5B', bg: '#FFF0F0' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">
            <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider mb-2">{s.label}</p>
            <p className="font-display text-3xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F2EC] rounded-xl p-1 w-fit">
        {(['requests', 'submissions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === t ? 'bg-white text-[#5B6FD4] shadow-soft' : 'text-[#9090A8] hover:text-[#5A5A72]'
            }`}
          >
            {t === 'requests' ? 'Document Requests' : 'Submissions'}
          </button>
        ))}
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {mockDocumentRequests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#1A1A2E]">{req.name}</h3>
                      {req.required && <span className="text-xs bg-[#FFF0F0] text-[#D95B5B] px-2 py-0.5 rounded-full font-medium">Required</span>}
                    </div>
                    <p className="text-xs text-[#9090A8]">Deadline: {new Date(req.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-[#9090A8] mb-1">
                        <span>Submissions</span>
                        <span>{req.submittedCount}/{req.totalCount}</span>
                      </div>
                      <div className="w-48 h-1.5 bg-[#F0F0F8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(req.submittedCount / req.totalCount) * 100}%`, background: '#5B6FD4' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => show('Reminder sent to all pending participants')} className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">
                    Send Reminder
                  </button>
                  <button onClick={() => show('Request removed')} className="text-xs bg-[#FFF0F0] text-[#D95B5B] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
          {allDocs.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-[#9090A8]">No documents submitted yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0F8]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Document</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Submitted by</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Size</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F8]">
                  {allDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-[#FAFAF7] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#EEF2FF] rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-[#5B6FD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="font-medium text-[#1A1A2E]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://images.unsplash.com/${doc.participantAvatar}?w=60&h=60&fit=crop&auto=format`}
                            alt={doc.participantName}
                            className="w-6 h-6 rounded-full object-cover bg-[#EEF2FF]"
                          />
                          <span className="text-[#5A5A72]">{doc.participantName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[#9090A8] text-xs">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-[#9090A8] text-xs">{doc.size}</td>
                      <td className="px-6 py-3.5"><DocStatus status={doc.status} /></td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => show('Document downloaded')} className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-2.5 py-1 rounded-lg font-medium hover:opacity-80 transition-opacity">
                            Download
                          </button>
                          {doc.status === 'pending' && (
                            <button onClick={() => show('Document approved')} className="text-xs bg-[#E6F4F1] text-[#3D9E8C] px-2.5 py-1 rounded-lg font-medium hover:opacity-80 transition-opacity">
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocStatus({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: '#E6F4F1', text: '#3D9E8C', label: 'Approved' },
    pending: { bg: '#FEF3ED', text: '#E8824A', label: 'Pending' },
    rejected: { bg: '#FFF0F0', text: '#D95B5B', label: 'Rejected' },
    missing: { bg: '#FFF0F0', text: '#D95B5B', label: 'Missing' },
  };
  const s = map[status] || map.pending;
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>{s.label}</span>;
}
