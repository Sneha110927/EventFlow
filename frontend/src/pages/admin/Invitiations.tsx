import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface EventData {
  _id: string;
  name: string;
  type?: string;
  venue?: string;
  location?: string;
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

const API_BASE_URL = 'http://localhost:5000/api';

export default function Invitations() {
  const [tab, setTab] = useState<
    'overview' | 'create'
  >('overview');

  const [notification, setNotification] =
    useState('');

  const [error, setError] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [name, setName] =
    useState('');

  const [events, setEvents] =
    useState<EventData[]>([]);

  const [selectedEventId, setSelectedEventId] =
    useState('');

  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [invitationLink, setInvitationLink] =
    useState('');

  const [copied, setCopied] =
    useState(false);

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = () => {
    return localStorage.getItem('token');
  };

  // =========================================================
  // SHOW NOTIFICATION
  // =========================================================

  const show = useCallback((msg: string) => {
    setNotification(msg);

    window.setTimeout(() => {
      setNotification('');
    }, 3000);
  }, []);

  // =========================================================
  // FETCH EVENTS
  // =========================================================

  const fetchEvents = useCallback(
    async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error(
            'Authentication expired. Please login again.'
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/events`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to fetch events'
          );
        }

        const eventList: EventData[] =
          Array.isArray(data)
            ? data
            : data.events || [];

        setEvents(eventList);

        // ---------------------------------------------------
        // RESTORE SELECTED EVENT
        // ---------------------------------------------------

        const savedEventId =
          localStorage.getItem(
            'selectedEventId'
          );

        const savedEventExists =
          eventList.some(
            (event) =>
              event._id === savedEventId
          );

        if (
          savedEventId &&
          savedEventExists
        ) {
          setSelectedEventId(
            savedEventId
          );
        } else if (
          eventList.length > 0
        ) {
          setSelectedEventId(
            eventList[0]._id
          );

          localStorage.setItem(
            'selectedEventId',
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
    },
    []
  );

  // =========================================================
  // FETCH INVITATIONS
  // =========================================================

  const fetchInvitations = useCallback(
    async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error(
            'Authentication expired. Please login again.'
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/invitations`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

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
    },
    []
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void Promise.all([
          fetchEvents(),
          fetchInvitations(),
        ]).finally(() => {
          setLoading(false);
        });
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    fetchEvents,
    fetchInvitations,
  ]);

  // =========================================================
  // SELECTED EVENT
  // =========================================================

  const selectedEvent =
    useMemo(() => {
      return events.find(
        (event) =>
          event._id === selectedEventId
      );
    }, [
      events,
      selectedEventId,
    ]);

  // =========================================================
  // FILTER INVITATIONS FOR SELECTED EVENT
  // =========================================================

  const eventInvitations =
    useMemo(() => {
      if (!selectedEventId) {
        return [];
      }

      return invitations.filter(
        (invitation) => {
          const invitationEventId =
            typeof invitation.event ===
            'string'
              ? invitation.event
              : invitation.event?._id;

          return (
            invitationEventId ===
            selectedEventId
          );
        }
      );
    }, [
      invitations,
      selectedEventId,
    ]);

  // =========================================================
  // EVENT CHANGE
  // =========================================================

  const handleEventChange = (
    eventId: string
  ) => {
    setSelectedEventId(eventId);

    localStorage.setItem(
      'selectedEventId',
      eventId
    );

    setInvitationLink('');
    setError('');
  };

  // =========================================================
  // INVITATION STATUS
  // =========================================================

  const pendingInvitations =
    eventInvitations.filter(
      (invitation) =>
        invitation.status ===
        'pending'
    );

  const acceptedInvitations =
    eventInvitations.filter(
      (invitation) =>
        invitation.status ===
        'accepted'
    );

  const expiredInvitations =
    eventInvitations.filter(
      (invitation) =>
        invitation.status ===
        'expired'
    );

  const total =
    eventInvitations.length;

  // =========================================================
  // PERCENTAGE
  // =========================================================

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
      pct: total > 0 ? 100 : 0,
    },
    {
      label: 'Pending',
      value:
        pendingInvitations.length,
      color: '#E8824A',
      pct: getPercentage(
        pendingInvitations.length
      ),
    },
    {
      label: 'Accepted',
      value:
        acceptedInvitations.length,
      color: '#3D9E8C',
      pct: getPercentage(
        acceptedInvitations.length
      ),
    },
    {
      label: 'Expired',
      value:
        expiredInvitations.length,
      color: '#D95B5B',
      pct: getPercentage(
        expiredInvitations.length
      ),
    },
  ];

  // =========================================================
  // COPY INVITATION LINK
  // =========================================================

  const copyLink = async (
    link: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        link
      );

      setCopied(true);

      show(
        'Invitation link copied to clipboard'
      );

      window.setTimeout(() => {
        setCopied(false);
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
    // NAME
    // -------------------------------------------------------

    if (!name.trim()) {
      setError(
        'Please enter participant name.'
      );
      return;
    }

    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    if (!email.trim()) {
      setError(
        'Please enter participant email.'
      );
      return;
    }

    // -------------------------------------------------------
    // EVENT
    // -------------------------------------------------------

    if (!selectedEventId) {
      setError(
        'Please select an event.'
      );
      return;
    }

    // -------------------------------------------------------
    // TOKEN
    // -------------------------------------------------------

    const token = getToken();

    if (!token) {
      setError(
        'Authentication expired. Please login again.'
      );
      return;
    }

    try {
      setSending(true);

      const response =
        await fetch(
          `${API_BASE_URL}/invitations`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

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
      // ADD NEW INVITATION TO STATE
      // -----------------------------------------------------

      if (data.invitation) {
        setInvitations(
          (previous) => [
            data.invitation,
            ...previous,
          ]
        );

        // ---------------------------------------------------
        // GENERATE INVITATION LINK
        // ---------------------------------------------------

        if (
          data.invitation.token
        ) {
          const link =
            `http://localhost:5173/accept-invitation?token=${data.invitation.token}`;

          setInvitationLink(link);
        }
      } else {
        await fetchInvitations();
      }

      // -----------------------------------------------------
      // RESET FORM
      // -----------------------------------------------------

      setName('');
      setEmail('');

      // -----------------------------------------------------
      // RETURN TO OVERVIEW
      // -----------------------------------------------------

      setTab('overview');

      show(
        `Invitation created for ${email.trim()}`
      );

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
  // DELETE INVITATION / PARTICIPANT
  // =========================================================
  //
  // This calls:
  //
  // DELETE /api/invitations/:invitationId
  //
  // Backend will:
  //
  // 1. Delete invitation
  // 2. Remove participant from this event
  // 3. Delete related OTP
  //
  // The actual User account is NOT deleted.
  //
  // =========================================================

  const deleteInvitation = async (
    invitation: Invitation
  ) => {


    // -------------------------------------------------------
    // CLEAR OLD ERROR
    // -------------------------------------------------------

    setError('');

    // -------------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------------

    const token = getToken();

    if (!token) {
      setError(
        'Authentication expired. Please login again.'
      );
      return;
    }

    try {

      // -----------------------------------------------------
      // SHOW LOADING STATE FOR THIS ROW
      // -----------------------------------------------------

      setDeletingId(
        invitation._id
      );

      // -----------------------------------------------------
      // DELETE REQUEST
      // -----------------------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/invitations/${invitation._id}`,
          {
            method: 'DELETE',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      // -----------------------------------------------------
      // READ RESPONSE
      // -----------------------------------------------------

      const data =
        await response.json();

      // -----------------------------------------------------
      // CHECK RESPONSE
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to delete participant'
        );
      }

      // -----------------------------------------------------
      // REMOVE FROM FRONTEND STATE
      // -----------------------------------------------------

      setInvitations(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !==
              invitation._id
          )
      );

      // -----------------------------------------------------
      // SHOW SUCCESS
      // -----------------------------------------------------

      show(
        `${invitation.name} removed successfully`
      );

    } catch (err) {

      console.error(
        'Delete participant error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete participant'
      );

    } finally {

      // -----------------------------------------------------
      // REMOVE LOADING STATE
      // -----------------------------------------------------

      setDeletingId(null);
    }
  };

  // =========================================================
  // RESEND INVITATION
  // =========================================================

  const resendInvitation = async (
    invitation: Invitation
  ) => {
    show(
      `Resend functionality will use the email service later for ${invitation.email}`
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">

        <div className="bg-white rounded-2xl border border-[#E8E8F0] p-10 text-center">

          <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-3" />

          <p className="text-sm text-[#9090A8]">
            Loading invitations...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // NO EVENTS
  // =========================================================

  if (events.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">

        <div className="mb-8">

          <h2 className="font-display text-2xl text-[#1A1A2E]">
            Invitations
          </h2>

          <p className="text-sm text-[#9090A8] mt-1">
            Manage participant invitations
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-12 text-center">

          <div className="w-14 h-14 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-4">

            <span className="text-2xl text-[#5B6FD4]">
              ✉
            </span>

          </div>

          <h3 className="font-semibold text-[#1A1A2E]">
            No events available
          </h3>

          <p className="text-sm text-[#9090A8] mt-2">
            Create an event before sending invitations.
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-4">

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
            className="font-semibold hover:underline shrink-0"
          >
            Close
          </button>

        </div>
      )}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>

        <h2 className="font-display text-2xl text-[#1A1A2E]">
          Invitations
        </h2>

        <p className="text-sm text-[#9090A8] mt-1">
          Manage participant invitations for your events
        </p>

      </div>

      {/* =====================================================
          EVENT SELECTOR
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider">
              Event
            </p>

            <p className="text-sm text-[#5A5A72] mt-1">
              Select an event to manage its invitations.
            </p>

          </div>

          <select
            value={selectedEventId}
            onChange={(e) =>
              handleEventChange(
                e.target.value
              )
            }
            className="w-full md:w-[320px] px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
          >

            <option value="">
              Select an event
            </option>

            {events.map(
              (event) => (
                <option
                  key={event._id}
                  value={event._id}
                >
                  {event.name}
                </option>
              )
            )}

          </select>

        </div>

        {selectedEvent && (
          <div className="mt-4 pt-4 border-t border-[#F0F0F8] flex flex-wrap gap-x-6 gap-y-2">

            {selectedEvent.venue && (
              <div>

                <p className="text-xs text-[#9090A8]">
                  Venue
                </p>

                <p className="text-sm font-medium text-[#1A1A2E]">
                  {selectedEvent.venue}
                </p>

              </div>
            )}

            {selectedEvent.location && (
              <div>

                <p className="text-xs text-[#9090A8]">
                  Location
                </p>

                <p className="text-sm font-medium text-[#1A1A2E]">
                  {selectedEvent.location}
                </p>

              </div>
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5"
          >

            <div className="flex items-center justify-between mb-2">

              <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider">
                {stat.label}
              </p>

              <span
                className="text-xs font-bold"
                style={{
                  color: stat.color,
                }}
              >
                {stat.pct}%
              </span>

            </div>

            <p
              className="font-display text-3xl"
              style={{
                color: stat.color,
              }}
            >
              {stat.value}
            </p>

            <div className="mt-3 h-1 bg-[#F0F0F8] rounded-full overflow-hidden">

              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${stat.pct}%`,
                  background:
                    stat.color,
                }}
              />

            </div>

          </div>
        ))}

      </div>

      {/* =====================================================
          INVITATION LINK
      ====================================================== */}

      {invitationLink && (
        <div className="bg-[#E6F4F1] border border-[#B9E3D9] rounded-2xl p-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <span className="w-7 h-7 rounded-full bg-[#3D9E8C] text-white flex items-center justify-center text-sm font-bold">
                  ✓
                </span>

                <h3 className="font-semibold text-[#1A1A2E]">
                  Invitation created
                </h3>

              </div>

              <p className="text-sm text-[#5A5A72] mt-2">
                Share this link with the participant.
              </p>

              <div className="mt-3 px-4 py-3 bg-white border border-[#D8E8E3] rounded-xl text-sm font-mono text-[#5A5A72] break-all">
                {invitationLink}
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                copyLink(
                  invitationLink
                )
              }
              className="shrink-0 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {copied
                ? 'Copied!'
                : 'Copy Link'}
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          TABS
      ====================================================== */}

      <div className="flex gap-1 bg-[#F3F2EC] rounded-xl p-1 w-fit">

        <button
          type="button"
          onClick={() =>
            setTab('overview')
          }
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
            tab === 'overview'
              ? 'bg-white text-[#5B6FD4] shadow-soft'
              : 'text-[#9090A8] hover:text-[#5A5A72]'
          }`}
        >
          Track Status
        </button>

        <button
          type="button"
          onClick={() =>
            setTab('create')
          }
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
            tab === 'create'
              ? 'bg-white text-[#5B6FD4] shadow-soft'
              : 'text-[#9090A8] hover:text-[#5A5A72]'
          }`}
        >
          Send Invite
        </button>

      </div>

      {/* =====================================================
          OVERVIEW
      ====================================================== */}

      {tab === 'overview' && (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">

          <div className="px-6 py-5 border-b border-[#F0F0F8]">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-semibold text-[#1A1A2E]">
                  Participant Invitations
                </h3>

                <p className="text-xs text-[#9090A8] mt-1">
                  {selectedEvent
                    ? selectedEvent.name
                    : 'Select an event'}
                </p>

              </div>

              <span className="text-xs text-[#9090A8]">
                {eventInvitations.length}{' '}
                invitation
                {eventInvitations.length !==
                1
                  ? 's'
                  : ''}
              </span>

            </div>

          </div>

          {/* =================================================
              NO EVENT SELECTED
          ================================================== */}

          {!selectedEventId ? (
            <div className="p-12 text-center">

              <p className="font-semibold text-[#1A1A2E]">
                Select an event
              </p>

              <p className="text-sm text-[#9090A8] mt-1">
                Choose an event above to view its invitations.
              </p>

            </div>

          ) : eventInvitations.length ===
            0 ? (

            /* =================================================
                NO INVITATIONS
            ================================================== */

            <div className="p-12 text-center">

              <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3">

                <span className="text-xl text-[#5B6FD4]">
                  ✉
                </span>

              </div>

              <h3 className="font-semibold text-[#1A1A2E]">
                No invitations yet
              </h3>

              <p className="text-sm text-[#9090A8] mt-1">
                No participants have been invited to this event.
              </p>

              <button
                type="button"
                onClick={() =>
                  setTab('create')
                }
                className="mt-5 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                Send Invitation
              </button>

            </div>

          ) : (

            /* =================================================
                INVITATION TABLE
            ================================================== */

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b border-[#F0F0F8]">

                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#9090A8] uppercase tracking-wider">
                      Participant
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

                  {eventInvitations.map(
                    (invitation) => (

                      <tr
                        key={
                          invitation._id
                        }
                        className="hover:bg-[#FAFAF7] transition-colors"
                      >

                        {/* =================================
                            PARTICIPANT
                        ================================== */}

                        <td className="px-6 py-4">

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

                              {invitation.mobile && (
                                <p className="text-xs text-[#9090A8] mt-0.5">
                                  {invitation.mobile}
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* =================================
                            STATUS
                        ================================== */}

                        <td className="px-6 py-4">

                          <InvBadge
                            status={
                              invitation.status
                            }
                          />

                        </td>

                        {/* =================================
                            EXPIRY
                        ================================== */}

                        <td className="px-6 py-4 text-xs text-[#9090A8]">

                          {new Date(
                            invitation.expiresAt
                          ).toLocaleDateString(
                            'en-US',
                            {
                              month:
                                'short',

                              day:
                                'numeric',

                              year:
                                'numeric',
                            }
                          )}

                        </td>

                        {/* =================================
                            ACTIONS
                        ================================== */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-4">

                            {/* RESEND */}

                            {invitation.status ===
                              'pending' && (
                              <button
                                type="button"
                                onClick={() =>
                                  resendInvitation(
                                    invitation
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  invitation._id
                                }
                                className="text-xs text-[#5B6FD4] font-medium hover:underline disabled:opacity-50"
                              >
                                Resend
                              </button>
                            )}

                            {/* ACCEPTED */}

                            {invitation.status ===
                              'accepted' && (
                              <span className="text-xs text-[#3D9E8C] font-medium">
                                Accepted
                              </span>
                            )}

                            {/* EXPIRED */}

                            {invitation.status ===
                              'expired' && (
                              <span className="text-xs text-[#D95B5B] font-medium">
                                Expired
                              </span>
                            )}

                            {/* =================================
                                DELETE
                            ================================== */}

                            <button
                              type="button"
                              onClick={() =>
                                deleteInvitation(
                                  invitation
                                )
                              }
                              disabled={
                                deletingId ===
                                invitation._id
                              }
                              className="text-xs text-[#D95B5B] font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId ===
                              invitation._id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
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

            <div className="mb-6">

              <h3 className="font-semibold text-[#1A1A2E]">
                Send Individual Invitation
              </h3>

              <p className="text-sm text-[#9090A8] mt-1">
                Invite a participant to a specific event.
              </p>

            </div>

            <form
              onSubmit={sendInvite}
              className="space-y-5"
            >

              {/* =============================================
                  EVENT
              ============================================== */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Event
                </label>

                <select
                  value={
                    selectedEventId
                  }
                  onChange={(e) =>
                    handleEventChange(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all"
                >

                  <option value="">
                    Select an event
                  </option>

                  {events.map(
                    (event) => (
                      <option
                        key={
                          event._id
                        }
                        value={
                          event._id
                        }
                      >
                        {event.name}
                      </option>
                    )
                  )}

                </select>

                {selectedEvent && (
                  <p className="text-xs text-[#9090A8] mt-2">

                    {selectedEvent.venue
                      ? `Venue: ${selectedEvent.venue}`
                      : selectedEvent.location
                      ? `Location: ${selectedEvent.location}`
                      : 'No venue specified'}

                  </p>
                )}

              </div>

              {/* =============================================
                  NAME
              ============================================== */}

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

              {/* =============================================
                  EMAIL
              ============================================== */}

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

              {/* =============================================
                  ACTIONS
              ============================================== */}

              <div className="flex gap-3 pt-2">

                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 gradient-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sending
                    ? 'Creating Invitation...'
                    : 'Send Invitation'}
                </button>

                <button
                  type="button"
                  disabled={sending}
                  onClick={() =>
                    setTab(
                      'overview'
                    )
                  }
                  className="px-5 py-3 rounded-xl bg-[#F2F2F9] text-[#4F506B] font-medium hover:bg-[#EAEAF4] transition disabled:opacity-50"
                >
                  Cancel
                </button>

              </div>

            </form>

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

  const current =
    map[status] ||
    map.pending;

  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{
        background:
          current.bg,
        color:
          current.text,
      }}
    >
      {current.label}
    </span>
  );
}