
import { useEffect, useState } from 'react';

interface EventData {
  _id: string;
  name: string;
  type?: string;
}

interface Invitation {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  event: EventData | string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  token?: string;
}

export default function Invitations() {
  const [tab, setTab] = useState<
    'overview' | 'create' | 'import'
  >('overview');

  const [notification, setNotification] =
    useState('');

  const [error, setError] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [name, setName] =
    useState('');

  const [company, setCompany] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [copied, setCopied] =
    useState('');

  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [events, setEvents] =
    useState<EventData[]>([]);

  const [selectedEventId, setSelectedEventId] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  // =========================================================
  // GENERATED INVITATION LINK
  // =========================================================

  const [invitationLink, setInvitationLink] =
    useState('');

  // =========================================================
  // GET JWT TOKEN
  // =========================================================

  const getToken = () => {
    return localStorage.getItem('token');
  };

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const show = (msg: string) => {
    setNotification(msg);

    setTimeout(() => {
      setNotification('');
    }, 3000);
  };

  // =========================================================
  // FETCH EVENTS
  // =========================================================

  const fetchEvents = async () => {
    try {
      const token = getToken();

      if (!token) {
        setError('Please login again.');
        return;
      }

      const response = await fetch(
        'http://localhost:5000/api/events',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to fetch events'
        );
      }

      const eventList =
        Array.isArray(data)
          ? data
          : data.events || [];

      setEvents(eventList);

      // Automatically select first event
      if (
        eventList.length > 0 &&
        !selectedEventId
      ) {
        setSelectedEventId(
          eventList[0]._id
        );
      }
    } catch (err) {
      console.error(
        'Fetch events error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch events'
      );
    }
  };

  // =========================================================
  // FETCH INVITATIONS
  // =========================================================

  const fetchInvitations = async () => {
    try {
      const token = getToken();

      if (!token) {
        setError('Please login again.');
        return;
      }

      const response = await fetch(
        'http://localhost:5000/api/invitations',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to fetch invitations'
        );
      }

      setInvitations(
        data.invitations || []
      );
    } catch (err) {
      console.error(
        'Fetch invitations error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch invitations'
      );
    }
  };

  // =========================================================
  // LOAD DATA WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      await Promise.all([
        fetchEvents(),
        fetchInvitations(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // =========================================================
  // INVITATION STATUS GROUPS
  // =========================================================

  const pendingInvitations =
    invitations.filter(
      (invitation) =>
        invitation.status === 'pending'
    );

  const acceptedInvitations =
    invitations.filter(
      (invitation) =>
        invitation.status === 'accepted'
    );

  const expiredInvitations =
    invitations.filter(
      (invitation) =>
        invitation.status === 'expired'
    );

  const total =
    invitations.length;

  const getPercentage = (
    value: number
  ) => {
    if (total === 0) {
      return 0;
    }

    return Math.round(
      (value / total) * 100
    );
  };

  // =========================================================
  // STATS
  // =========================================================

  const stats = [
    {
      label: 'Invited',
      value: total,
      color: '#5B6FD4',
      pct: 100,
    },
    {
      label: 'Pending',
      value: pendingInvitations.length,
      color: '#E8824A',
      pct: getPercentage(
        pendingInvitations.length
      ),
    },
    {
      label: 'Accepted',
      value: acceptedInvitations.length,
      color: '#3D9E8C',
      pct: getPercentage(
        acceptedInvitations.length
      ),
    },
    {
      label: 'Expired',
      value: expiredInvitations.length,
      color: '#D95B5B',
      pct: getPercentage(
        expiredInvitations.length
      ),
    },
  ];

  // =========================================================
  // COPY LINK
  // =========================================================

  const copyLink = async (
    link: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        link
      );

      setCopied(link);

      show(
        'Invitation link copied to clipboard'
      );

      setTimeout(() => {
        setCopied('');
      }, 2000);
    } catch (err) {
      console.error(
        'Copy error:',
        err
      );

      show(
        'Unable to copy invitation link'
      );
    }
  };

  // =========================================================
  // SEND INVITATION
  // =========================================================

  const sendInvite = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setInvitationLink('');

    // -------------------------------------------------------
    // NAME VALIDATION
    // -------------------------------------------------------

    if (!name.trim()) {
      setError(
        'Please enter participant name.'
      );
      return;
    }

    // -------------------------------------------------------
    // EMAIL VALIDATION
    // -------------------------------------------------------

    if (!email.trim()) {
      setError(
        'Please enter participant email.'
      );
      return;
    }

    // -------------------------------------------------------
    // EVENT VALIDATION
    // -------------------------------------------------------

    if (!selectedEventId) {
      setError(
        'Please select an event.'
      );
      return;
    }

    // -------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------

    const token = getToken();

    if (!token) {
      setError(
        'Authentication expired. Please login again.'
      );
      return;
    }

    // -------------------------------------------------------
    // CREATE INVITATION
    // -------------------------------------------------------

    try {
      setSending(true);

      const response = await fetch(
        'http://localhost:5000/api/invitations',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          // -------------------------------------------------
          // ONLY NAME, EMAIL AND EVENT
          // MOBILE IS NOT SENT HERE
          // -------------------------------------------------

          body: JSON.stringify({
            name:
              name.trim(),

            email:
              email
                .trim()
                .toLowerCase(),

            eventId:
              selectedEventId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to create invitation'
        );
      }

      // -----------------------------------------------------
      // SAVE INVITATION
      // -----------------------------------------------------

      if (data.invitation) {
        setInvitations(
          (previous) => [
            data.invitation,
            ...previous,
          ]
        );
      } else {
        await fetchInvitations();
      }

      // -----------------------------------------------------
      // GENERATE FRONTEND INVITATION LINK
      // -----------------------------------------------------

      if (
        data.invitation?.token
      ) {
        const link =
          `http://localhost:5173/accept-invitation?token=${data.invitation.token}`;

        setInvitationLink(link);
      }

      // -----------------------------------------------------
      // SUCCESS MESSAGE
      // -----------------------------------------------------

      show(
        `Invitation created for ${email}`
      );

      // -----------------------------------------------------
      // RESET FORM
      // -----------------------------------------------------

      setEmail('');
      setName('');
      setCompany('');
      setMessage('');

      // -----------------------------------------------------
      // RETURN TO OVERVIEW
      // -----------------------------------------------------

      setTab('overview');

    } catch (err) {
      console.error(
        'Send invitation error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create invitation'
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================================
  // RESEND
  // =========================================================

  const resendInvitation = async (
    invitation: Invitation
  ) => {
    show(
      `Resend functionality will use the email service later for ${invitation.email}`
    );
  };

  // =========================================================
  // PUBLIC REGISTRATION LINK
  // =========================================================

  const selectedEvent =
    events.find(
      (event) =>
        event._id ===
        selectedEventId
    );

  const publicRegistrationLink =
    selectedEvent
      ? `http://localhost:5173/register?event=${selectedEvent._id}`
      : 'No event selected';

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E8E8F0] p-10 text-center">
          <p className="text-sm text-[#9090A8]">
            Loading invitations...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* =====================================================
          NOTIFICATION
      ====================================================== */}

      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}

          <button
            onClick={() =>
              setError('')
            }
            className="ml-3 font-semibold hover:underline"
          >
            Close
          </button>
        </div>
      )}

      {/* =====================================================
          NEW INVITATION LINK
      ====================================================== */}

      {invitationLink && (
        <div className="bg-[#E6F4F1] border border-[#B9E3D9] rounded-2xl p-5">

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2">

                <span className="w-7 h-7 rounded-full bg-[#3D9E8C] text-white flex items-center justify-center text-sm font-bold">
                  ✓
                </span>

                <h3 className="font-semibold text-[#1A1A2E]">
                  Invitation created successfully
                </h3>

              </div>

              <p className="text-sm text-[#5A5A72] mt-2">
                Share this link with the participant
                so they can accept the invitation.
              </p>

              <div className="mt-3 px-4 py-3 bg-white border border-[#D8E8E3] rounded-xl text-sm font-mono text-[#5A5A72] break-all">
                {invitationLink}
              </div>

            </div>

            <button
              onClick={() =>
                copyLink(
                  invitationLink
                )
              }
              className="shrink-0 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {copied ===
              invitationLink
                ? 'Copied!'
                : 'Copy Link'}
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="font-display text-2xl text-[#1A1A2E]">
            Invitations
          </h2>

          <p className="text-sm text-[#9090A8] mt-0.5">
            Manage and track participant invitations
          </p>
        </div>

      </div>

      {/* =====================================================
          EVENT SELECTOR
      ====================================================== */}

      {events.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

          <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
            Current Event
          </label>

          <select
            value={selectedEventId}
            onChange={(e) =>
              setSelectedEventId(
                e.target.value
              )
            }
            className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4]"
          >
            {events.map((event) => (
              <option
                key={event._id}
                value={event._id}
              >
                {event.name}
              </option>
            ))}
          </select>

        </div>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5"
          >

            <div className="flex items-center justify-between mb-2">

              <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider">
                {s.label}
              </p>

              <span
                className="text-xs font-bold"
                style={{
                  color: s.color,
                }}
              >
                {s.pct}%
              </span>

            </div>

            <p
              className="font-display text-3xl"
              style={{
                color: s.color,
              }}
            >
              {s.value}
            </p>

            <div className="mt-3 h-1 bg-[#F0F0F8] rounded-full overflow-hidden">

              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${s.pct}%`,
                  background:
                    s.color,
                }}
              />

            </div>

          </div>
        ))}

      </div>

      {/* =====================================================
          PUBLIC REGISTRATION LINK
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">

        <h3 className="font-semibold text-[#1A1A2E] mb-3">
          Public Registration Link
        </h3>

        <p className="text-sm text-[#5A5A72] mb-4">
          Share this link for open registrations.
        </p>

        <div className="flex gap-3">

          <div className="flex-1 px-4 py-2.5 bg-[#FAFAF7] border border-[#E8E8F0] rounded-xl text-sm text-[#5A5A72] font-mono truncate">
            {publicRegistrationLink}
          </div>

          <button
            onClick={() =>
              copyLink(
                publicRegistrationLink
              )
            }
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              copied ===
              publicRegistrationLink
                ? 'bg-[#E6F4F1] text-[#3D9E8C]'
                : 'gradient-primary text-white hover:opacity-90'
            }`}
          >
            {copied ===
            publicRegistrationLink
              ? 'Copied!'
              : 'Copy Link'}
          </button>

        </div>

      </div>

      {/* =====================================================
          TABS
      ====================================================== */}

      <div className="flex gap-1 bg-[#F3F2EC] rounded-xl p-1 w-fit">

        {(
          [
            'overview',
            'create',
            'import',
          ] as const
        ).map((t) => (

          <button
            key={t}
            onClick={() =>
              setTab(t)
            }
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              tab === t
                ? 'bg-white text-[#5B6FD4] shadow-soft'
                : 'text-[#9090A8] hover:text-[#5A5A72]'
            }`}
          >
            {t === 'create'
              ? 'Send Invite'
              : t === 'import'
              ? 'Import List'
              : 'Track Status'}
          </button>

        ))}

      </div>

      {/* =====================================================
          OVERVIEW
      ====================================================== */}

      {tab === 'overview' && (

        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">

          {invitations.length === 0 ? (

            <div className="p-12 text-center">

              <div className="text-4xl mb-3">
                ◈
              </div>

              <h3 className="font-semibold text-[#1A1A2E]">
                No invitations yet
              </h3>

              <p className="text-sm text-[#9090A8] mt-1">
                Send your first participant invitation.
              </p>

              <button
                onClick={() =>
                  setTab('create')
                }
                className="mt-5 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                Send Invitation
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b border-[#F0F0F8]">

                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">
                      Participant
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">
                      Event
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">
                      Status
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">
                      Expires
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#F0F0F8]">

                  {invitations.map(
                    (invitation) => {

                      const eventName =
                        typeof invitation.event ===
                        'string'
                          ? invitation.event
                          : invitation.event?.name ||
                            'Unknown Event';

                      return (

                        <tr
                          key={
                            invitation._id
                          }
                          className="hover:bg-[#FAFAF7] transition-colors"
                        >

                          <td className="px-6 py-3.5">

                            <div className="flex items-center gap-3">

                              <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#5B6FD4] font-semibold text-sm">
                                {invitation.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p className="font-medium text-[#1A1A2E]">
                                  {invitation.name}
                                </p>

                                <p className="text-xs text-[#9090A8]">
                                  {invitation.email}
                                </p>

                                {/* Mobile appears here only
                                    after participant provides it */}
                                {invitation.mobile && (
                                  <p className="text-xs text-[#9090A8] mt-0.5">
                                    {invitation.mobile}
                                  </p>
                                )}

                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-3.5 text-[#5A5A72]">
                            {eventName}
                          </td>

                          <td className="px-6 py-3.5">

                            <InvBadge
                              status={
                                invitation.status
                              }
                            />

                          </td>

                          <td className="px-6 py-3.5 text-xs text-[#9090A8]">

                            {new Date(
                              invitation.expiresAt
                            ).toLocaleDateString()}

                          </td>

                          <td className="px-6 py-3.5">

                            {invitation.status ===
                              'pending' && (

                              <button
                                onClick={() =>
                                  resendInvitation(
                                    invitation
                                  )
                                }
                                className="text-xs text-[#5B6FD4] font-medium hover:underline"
                              >
                                Resend
                              </button>

                            )}

                            {invitation.status ===
                              'accepted' && (

                              <span className="text-xs text-[#3D9E8C] font-medium">
                                Accepted
                              </span>

                            )}

                            {invitation.status ===
                              'expired' && (

                              <span className="text-xs text-[#D95B5B] font-medium">
                                Expired
                              </span>

                            )}

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}

      {/* =====================================================
          CREATE INVITATION
      ====================================================== */}

      {tab === 'create' && (

        <div className="max-w-lg">

          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">

            <h3 className="font-semibold text-[#1A1A2E] mb-5">
              Send Individual Invitation
            </h3>

            <form
              onSubmit={sendInvite}
              className="space-y-4"
            >

              {/* NAME */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Alex Johnson"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="alex@company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                />

              </div>

              {/* COMPANY */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Company
                </label>

                <input
                  type="text"
                  value={company}
                  onChange={(e) =>
                    setCompany(
                      e.target.value
                    )
                  }
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                />

              </div>

              {/* MESSAGE */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Personal Message (optional)
                </label>

                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                  placeholder="We'd love for you to join us at Tech Summit 2026..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all resize-none"
                />

              </div>

              {/* SEND */}

              <button
                type="submit"
                disabled={sending}
                className="w-full gradient-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sending
                  ? 'Creating Invitation...'
                  : 'Send Invitation'}
              </button>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          IMPORT
      ====================================================== */}

      {tab === 'import' && (

        <div className="max-w-lg">

          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">

            <h3 className="font-semibold text-[#1A1A2E] mb-2">
              Import Participant List
            </h3>

            <p className="text-sm text-[#9090A8] mb-5">
              Upload a CSV file with columns:
              Name, Email, Mobile, Company, Role
            </p>

            <div
              className="border-2 border-dashed border-[#D0D0E8] rounded-2xl p-10 text-center hover:border-[#5B6FD4] transition-colors cursor-pointer"
              onClick={() =>
                show(
                  'CSV import will be connected next'
                )
              }
            >

              <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3">

                <svg
                  className="w-6 h-6 text-[#5B6FD4]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />

                </svg>

              </div>

              <p className="text-sm font-medium text-[#1A1A2E]">
                Drop CSV file here
              </p>

              <p className="text-xs text-[#9090A8] mt-1">
                or click to browse
              </p>

            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E8F0]">

              <p className="text-xs text-[#9090A8] mb-2">
                Download template
              </p>

              <button
                onClick={() =>
                  show(
                    'CSV template functionality will be added next'
                  )
                }
                className="text-xs text-[#5B6FD4] font-medium hover:underline"
              >
                participants-template.csv
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// =========================================================
// INVITATION BADGE
// =========================================================

function InvBadge({
  status,
}: {
  status: string;
}) {
  const map: Record<
    string,
    {
      bg: string;
      text: string;
      label: string;
    }
  > = {
    pending: {
      bg: '#EEF2FF',
      text: '#5B6FD4',
      label: 'Pending',
    },

    accepted: {
      bg: '#E6F4F1',
      text: '#3D9E8C',
      label: 'Accepted',
    },

    expired: {
      bg: '#FDECEC',
      text: '#D95B5B',
      label: 'Expired',
    },
  };

  const s =
    map[status] ||
    map.pending;

  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{
        background: s.bg,
        color: s.text,
      }}
    >
      {s.label}
    </span>
  );
}
