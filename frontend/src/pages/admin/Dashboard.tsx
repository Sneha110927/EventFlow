import { useEffect, useState } from 'react';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

// =========================================================
// EVENT TYPE
// =========================================================

interface Event {
  _id: string;
  name: string;
  type: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;

  modules?: {
    participants: boolean;
    registration: boolean;
    schedule: boolean;
    documents: boolean;
    announcements: boolean;
    chat: boolean;
    accommodation: boolean;
    travel: boolean;
  };

  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };

  createdAt: string;
  updatedAt: string;
}

// =========================================================
// USER TYPE
// =========================================================

interface ParticipantUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

// =========================================================
// EVENT PARTICIPANT TYPE
// =========================================================

interface EventParticipant {
  _id: string;

  event:
    | string
    | {
        _id: string;
        name: string;
      };

  user:
    | string
    | ParticipantUser;

  status: 'registered' | 'accepted' | 'pending' | 'cancelled' | string;

  registrationCompleted?: boolean;

  joinedAt?: string;

  createdAt: string;

  updatedAt?: string;
}

// =========================================================
// INVITATION TYPE
// =========================================================

interface Invitation {
  _id: string;

  name: string;

  email: string;

  status: 'pending' | 'accepted' | 'expired' | string;

  event:
    | string
    | {
        _id: string;
        name: string;
        type?: string;
      };

  createdAt: string;

  updatedAt?: string;
}

// =========================================================
// ACTIVITY TYPE
// =========================================================

interface Activity {
  text: string;
  time: string;
  type: 'reg' | 'invite' | 'doc' | 'announce';
}

// =========================================================
// MAIN DASHBOARD
// =========================================================

export default function AdminDashboard({
  onNavigate,
}: DashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);

  const [selectedEvent, setSelectedEvent] =
    useState<Event | null>(null);

  const [participants, setParticipants] =
    useState<EventParticipant[]>([]);

  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [loading, setLoading] = useState(true);

  const [participantsLoading, setParticipantsLoading] =
    useState(false);

  const [error, setError] = useState('');

  // =======================================================
  // GET EVENTS
  // =======================================================

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('You are not logged in.');
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
            data.message || 'Failed to load events.'
          );
        }

        const loadedEvents: Event[] =
          data.events || [];

        setEvents(loadedEvents);

        if (loadedEvents.length > 0) {
          setSelectedEvent(loadedEvents[0]);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load events.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // =======================================================
  // GET PARTICIPANTS FOR SELECTED EVENT
  // =======================================================

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedEvent) {
        setParticipants([]);
        return;
      }

      try {
        setParticipantsLoading(true);

        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('You are not logged in.');
        }

        const response = await fetch(
          `http://localhost:5000/api/event-participants/event/${selectedEvent._id}`,
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
              'Failed to load participants.'
          );
        }

        setParticipants(data.participants || []);
      } catch (err) {
        console.error(
          'Failed to load participants:',
          err
        );

        setParticipants([]);
      } finally {
        setParticipantsLoading(false);
      }
    };

    fetchParticipants();
  }, [selectedEvent]);

  // =======================================================
  // GET INVITATIONS
  // =======================================================

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
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
          console.error(
            'Failed to load invitations:',
            data.message
          );

          return;
        }

        setInvitations(data.invitations || []);
      } catch (err) {
        console.error(
          'Failed to load invitations:',
          err
        );
      }
    };

    fetchInvitations();
  }, []);

  // =======================================================
  // FILTER INVITATIONS FOR SELECTED EVENT
  // =======================================================

  const eventInvitations = invitations.filter(
    (invitation) => {
      if (!selectedEvent) {
        return false;
      }

      if (
        typeof invitation.event === 'string'
      ) {
        return (
          invitation.event ===
          selectedEvent._id
        );
      }

      return (
        invitation.event?._id ===
        selectedEvent._id
      );
    }
  );

  // =======================================================
  // REAL PARTICIPANT STATISTICS
  // =======================================================

  const registered = participants.length;

  /*
   * Your current backend creates EventParticipant
   * with status = "registered" after invitation acceptance.
   *
   * Therefore "registered" is treated as confirmed
   * for the current implementation.
   */

  const confirmed = participants.filter(
    (participant) =>
      participant.status === 'registered' ||
      participant.status === 'accepted'
  ).length;

  const pending = participants.filter(
    (participant) =>
      participant.status === 'pending'
  ).length;

  /*
   * Documents are not connected to the dashboard yet.
   *
   * We deliberately show 0 instead of fake/mock data.
   */
  const pendingDocs = 0;

  /*
   * Your current Event model doesn't contain a capacity
   * field, so we don't use the old fake value of 1000.
   */
  const capacity: number | null = null;

  // =======================================================
  // STATS
  // =======================================================

  const stats = [
    {
      label: 'Registered',
      value: registered,
      total: capacity,
      color: '#5B6FD4',
      bg: 'gradient-card-blue',
    },

    {
      label: 'Confirmed',
      value: confirmed,
      total: registered,
      color: '#3D9E8C',
      bg: 'gradient-card-teal',
    },

    {
      label: 'Pending',
      value: pending,
      total: registered,
      color: '#E8A438',
      bg: 'gradient-card-peach',
    },

    {
      label: 'Docs Pending',
      value: pendingDocs,
      total: registered,
      color: '#9B7ECB',
      bg: 'gradient-card-lavender',
    },
  ];

  // =======================================================
  // TIME FORMATTER
  // =======================================================

  const getRelativeTime = (
    dateString: string
  ) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      difference / (1000 * 60 * 60)
    );

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

    if (minutes < 1) {
      return 'Just now';
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  // =======================================================
  // GET PARTICIPANT NAME
  // =======================================================

  const getParticipantUser = (
    participant: EventParticipant
  ): ParticipantUser | null => {
    if (
      typeof participant.user ===
      'string'
    ) {
      return null;
    }

    return participant.user;
  };

  // =======================================================
  // RECENT PARTICIPANTS
  // =======================================================

  const recentParticipants =
    [...participants]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      )
      .slice(0, 5);

  // =======================================================
  // RECENT ACTIVITY
  // =======================================================

  const participantActivities: Activity[] =
    participants.map(
      (participant) => {
        const user =
          getParticipantUser(
            participant
          );

        const name =
          user?.name ||
          'A participant';

        return {
          text: `${name} joined ${selectedEvent?.name || 'the event'}`,
          time: getRelativeTime(
            participant.createdAt
          ),
          type: 'reg',
        };
      }
    );

  const invitationActivities: Activity[] =
    eventInvitations.map(
      (invitation) => ({
        text: `Invitation sent to ${invitation.name}`,
        time: getRelativeTime(
          invitation.createdAt
        ),
        type: 'invite',
      })
    );

const activities: Activity[] = [
  ...participantActivities,
  ...invitationActivities,
].slice(0, 6);

  // =======================================================
  // ACTIVITY COLORS
  // =======================================================

  const activityColors: Record<
    string,
    string
  > = {
    doc: '#5B6FD4',
    invite: '#3D9E8C',
    reg: '#9B7ECB',
    announce: '#E8824A',
  };

  // =======================================================
  // GET USER INITIALS
  // =======================================================

  const getInitials = (
    name: string
  ) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word.charAt(0).toUpperCase()
      )
      .join('');
  };

  // =======================================================
  // LOADING STATE
  // =======================================================

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-10 text-center">

          <div className="flex justify-center mb-4">

            <svg
              className="w-8 h-8 animate-spin text-[#5B6FD4]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />

              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>

          </div>

          <p className="text-sm text-[#9090A8]">
            Loading your events...
          </p>

        </div>
      </div>
    );
  }

  // =======================================================
  // ERROR STATE
  // =======================================================

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">

        <div className="bg-white rounded-2xl border border-red-100 shadow-soft p-8 text-center">

          <div className="text-red-500 text-3xl mb-3">
            !
          </div>

          <h2 className="font-semibold text-[#1A1A2E] mb-2">
            Unable to load events
          </h2>

          <p className="text-sm text-[#9090A8] mb-5">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // =======================================================
  // MAIN DASHBOARD
  // =======================================================

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* ================================================= */}
      {/* WELCOME + EVENT */}
      {/* ================================================= */}

      <div className="flex flex-col lg:flex-row gap-5">

        <div className="flex-1 gradient-primary rounded-2xl p-6 text-white shadow-card">

          <p className="text-white/70 text-sm mb-1">
            Welcome back,
          </p>

          <h2 className="font-display text-2xl mb-4">
            Event Admin
          </h2>

          {selectedEvent ? (
            <>
              <div className="flex flex-wrap gap-4">

                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">
                    Event
                  </p>

                  <p className="font-semibold">
                    {selectedEvent.name}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">
                    Date
                  </p>

                  <p className="font-semibold">
                    {selectedEvent.startDate
                      ? new Date(
                          selectedEvent.startDate
                        ).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )
                      : 'Not set'}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">
                    Venue
                  </p>

                  <p className="font-semibold">
                    {selectedEvent.location ||
                      'Not set'}
                  </p>
                </div>

              </div>

              {/* EVENT SELECTOR */}

              {events.length > 1 && (
                <div className="mt-5">

                  <label className="text-xs text-white/60 uppercase tracking-wider">
                    Dashboard Event
                  </label>

                  <select
                    value={
                      selectedEvent._id
                    }
                    onChange={(e) => {
                      const event =
                        events.find(
                          (ev) =>
                            ev._id ===
                            e.target.value
                        );

                      if (event) {
                        setSelectedEvent(
                          event
                        );
                      }
                    }}
                    className="mt-1 w-full max-w-sm bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  >
                    {events.map((event) => (
                      <option
                        key={event._id}
                        value={event._id}
                        className="text-[#1A1A2E]"
                      >
                        {event.name}
                      </option>
                    ))}
                  </select>

                </div>
              )}

              {/* CAPACITY */}

              <div className="mt-4">

                <div className="flex justify-between text-xs text-white/70 mb-1">

                  <span>
                    Registered participants
                  </span>

                  <span>
                    {registered}
                  </span>

                </div>

                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{
                      width:
                        registered > 0
                          ? '100%'
                          : '0%',
                    }}
                  />

                </div>

              </div>

            </>
          ) : (
            <div>

              <p className="text-white/70 text-sm">
                You haven't created an event yet.
              </p>

              <button
                onClick={() =>
                  onNavigate(
                    'event-builder'
                  )
                }
                className="mt-4 bg-white text-[#5B6FD4] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              >
                Create Your First Event
              </button>

            </div>
          )}

        </div>

        {/* ================================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================================= */}

        <div className="bg-white rounded-2xl p-6 border border-[#E8E8F0] shadow-soft lg:w-72">

          <h3 className="font-semibold text-[#1A1A2E] mb-4">
            Quick Actions
          </h3>

          <div className="space-y-2">

            {[
              {
                label: 'Invite Participants',
                page: 'invitations',
                color: '#5B6FD4',
                bg: '#EEF2FF',
              },
              {
                label: 'Send Announcement',
                page: 'announcements',
                color: '#3D9E8C',
                bg: '#E6F4F1',
              },
              {
                label: 'Review Documents',
                page: 'documents',
                color: '#9B7ECB',
                bg: '#F0EBFB',
              },
              {
                label: 'Open Chat',
                page: 'chat',
                color: '#E8824A',
                bg: '#FEF3ED',
              },
            ].map((action) => (
              <button
                key={action.page}
                onClick={() =>
                  onNavigate(
                    action.page
                  )
                }
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity text-sm font-medium"
                style={{
                  backgroundColor:
                    action.bg,
                  color:
                    action.color,
                }}
              >

                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      action.color,
                  }}
                />

                {action.label}

              </button>
            ))}

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {stats.map((stat) => {

          const total =
            stat.total || 0;

          const percentage =
            total > 0
              ? Math.min(
                  (stat.value /
                    total) *
                    100,
                  100
                )
              : stat.value > 0
              ? 100
              : 0;

          return (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl p-5 border border-white/60 shadow-soft`}
            >

              <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider mb-2">
                {stat.label}
              </p>

              <p
                className="font-display text-3xl"
                style={{
                  color:
                    stat.color,
                }}
              >
                {stat.value}
              </p>

              <p className="text-xs text-[#9090A8] mt-1">

                {stat.total !== null
                  ? `of ${stat.total} total`
                  : 'Current total'}

              </p>

              <div className="mt-3 h-1 bg-white/50 rounded-full overflow-hidden">

                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    background:
                      stat.color,
                  }}
                />

              </div>

            </div>
          );
        })}

      </div>

      {/* ================================================= */}
      {/* RECENT PARTICIPANTS + ACTIVITY */}
      {/* ================================================= */}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ================================================= */}
        {/* RECENT PARTICIPANTS */}
        {/* ================================================= */}

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8F0]">

            <h3 className="font-semibold text-[#1A1A2E]">
              Recent Participants
            </h3>

            <button
              onClick={() =>
                onNavigate(
                  'participants'
                )
              }
              className="text-xs text-[#5B6FD4] hover:underline font-medium"
            >
              View all
            </button>

          </div>

          {participantsLoading ? (
            <div className="p-8 text-center">

              <p className="text-sm text-[#9090A8]">
                Loading participants...
              </p>

            </div>
          ) : recentParticipants.length ===
            0 ? (
            <div className="p-8 text-center">

              <div className="text-3xl mb-3">
                👥
              </div>

              <p className="text-sm font-medium text-[#1A1A2E]">
                No participants yet
              </p>

              <p className="text-xs text-[#9090A8] mt-1">
                Participants will appear here after they join this event.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F8]">

              {recentParticipants.map(
                (participant) => {

                  const user =
                    getParticipantUser(
                      participant
                    );

                  const name =
                    user?.name ||
                    'Unknown participant';

                  const email =
                    user?.email ||
                    '';

                  return (
                    <div
                      key={
                        participant._id
                      }
                      onClick={() =>
                        typeof participant.user !==
                        'string'
                          ? onNavigate(
                              'participant-profile',
                              participant.user
                                ._id
                            )
                          : undefined
                      }
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FAFAF7] cursor-pointer transition-colors"
                    >

                      {/* INITIALS */}

                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5B6FD4] to-[#7B8EEA] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(
                          name
                        ) || 'P'}
                      </div>

                      {/* USER */}

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-medium text-[#1A1A2E]">
                          {name}
                        </p>

                        <p className="text-xs text-[#9090A8] truncate">
                          {email}
                        </p>

                      </div>

                      {/* STATUS */}

                      <StatusBadge
                        status={
                          participant.status
                        }
                      />

                      {/* REGISTRATION */}

                      <RegistrationBadge
                        completed={
                          participant.registrationCompleted
                        }
                      />

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* ================================================= */}
        {/* ACTIVITY FEED */}
        {/* ================================================= */}

        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">

          <div className="px-5 py-4 border-b border-[#E8E8F0]">

            <h3 className="font-semibold text-[#1A1A2E]">
              Recent Activity
            </h3>

          </div>

          <div className="px-5 py-3 space-y-3 overflow-y-auto max-h-80">

            {activities.length === 0 ? (
              <div className="py-8 text-center">

                <p className="text-sm text-[#9090A8]">
                  No recent activity.
                </p>

              </div>
            ) : (
              activities.map(
                (activity, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start"
                  >

                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{
                        background:
                          activityColors[
                            activity.type
                          ],
                      }}
                    />

                    <div>

                      <p className="text-xs text-[#1A1A2E] leading-snug">
                        {activity.text}
                      </p>

                      <p className="text-xs text-[#9090A8] mt-0.5">
                        {activity.time}
                      </p>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* ALL EVENTS */}
      {/* ================================================= */}

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8F0]">

          <h3 className="font-semibold text-[#1A1A2E]">
            All Events
          </h3>

          <button
            onClick={() =>
              onNavigate(
                'event-builder'
              )
            }
            className="text-xs font-semibold text-white gradient-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            + New Event
          </button>

        </div>

        {events.length === 0 ? (
          <div className="p-10 text-center">

            <p className="text-sm text-[#9090A8] mb-4">
              No events have been created yet.
            </p>

            <button
              onClick={() =>
                onNavigate(
                  'event-builder'
                )
              }
              className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              Create Event
            </button>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="text-xs font-medium text-[#9090A8] uppercase tracking-wider border-b border-[#F0F0F8]">

                  <th className="text-left px-6 py-3">
                    Event
                  </th>

                  <th className="text-left px-6 py-3">
                    Type
                  </th>

                  <th className="text-left px-6 py-3">
                    Start Date
                  </th>

                  <th className="text-left px-6 py-3">
                    Venue
                  </th>

                  <th className="text-left px-6 py-3">
                    Modules
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-[#F0F0F8]">

                {events.map((event) => {

                  const enabledModules =
                    event.modules
                      ? Object.values(
                          event.modules
                        ).filter(
                          Boolean
                        ).length
                      : 0;

                  return (
                    <tr
                      key={event._id}
                      onClick={() =>
                        setSelectedEvent(
                          event
                        )
                      }
                      className={`hover:bg-[#FAFAF7] transition-colors cursor-pointer ${
                        selectedEvent?._id ===
                        event._id
                          ? 'bg-[#FAFAF7]'
                          : ''
                      }`}
                    >

                      <td className="px-6 py-3.5 font-medium text-[#1A1A2E]">
                        {event.name}
                      </td>

                      <td className="px-6 py-3.5">

                        <span className="capitalize text-xs bg-[#EEF2FF] text-[#5B6FD4] px-2.5 py-1 rounded-full font-medium">
                          {event.type}
                        </span>

                      </td>

                      <td className="px-6 py-3.5 text-[#5A5A72]">

                        {event.startDate
                          ? new Date(
                              event.startDate
                            ).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )
                          : 'Not set'}

                      </td>

                      <td className="px-6 py-3.5 text-[#5A5A72]">
                        {event.location ||
                          'Not set'}
                      </td>

                      <td className="px-6 py-3.5">

                        <span className="text-xs bg-[#E6F4F1] text-[#3D9E8C] px-2.5 py-1 rounded-full font-medium">
                          {enabledModules}{' '}
                          enabled
                        </span>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* ANNOUNCEMENTS */}
      {/* ================================================= */}

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8F0]">

          <h3 className="font-semibold text-[#1A1A2E]">
            Recent Announcements
          </h3>

          <button
            onClick={() =>
              onNavigate(
                'announcements'
              )
            }
            className="text-xs text-[#5B6FD4] hover:underline font-medium"
          >
            View all
          </button>

        </div>

        <div className="p-8 text-center">

          <div className="text-3xl mb-3">
            📢
          </div>

          <p className="text-sm font-medium text-[#1A1A2E]">
            No announcements yet
          </p>

          <p className="text-xs text-[#9090A8] mt-1">
            Create an announcement to see it here.
          </p>

          <button
            onClick={() =>
              onNavigate(
                'announcements'
              )
            }
            className="mt-4 gradient-primary text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90"
          >
            Create Announcement
          </button>

        </div>

      </div>

    </div>
  );
}

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({
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
    registered: {
      bg: '#E6F4F1',
      text: '#3D9E8C',
      label: 'Registered',
    },

    accepted: {
      bg: '#E6F4F1',
      text: '#3D9E8C',
      label: 'Accepted',
    },

    pending: {
      bg: '#FEF3ED',
      text: '#E8824A',
      label: 'Pending',
    },

    cancelled: {
      bg: '#FFF0F0',
      text: '#D95B5B',
      label: 'Cancelled',
    },
  };

  const badge =
    map[status] ||
    map.pending;

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{
        background:
          badge.bg,
        color:
          badge.text,
      }}
    >
      {badge.label}
    </span>
  );
}

// =========================================================
// REGISTRATION BADGE
// =========================================================

function RegistrationBadge({
  completed,
}: {
  completed?: boolean;
}) {
  if (completed) {
    return (
      <span className="text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium shrink-0 bg-[#E6F4F1] text-[#3D9E8C]">
        ✓
      </span>
    );
  }

  return (
    <span className="text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium shrink-0 bg-[#FEF3ED] text-[#E8824A]">
      ⏳
    </span>
  );
}