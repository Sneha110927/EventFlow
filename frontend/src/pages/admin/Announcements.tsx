import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface Event {
  _id: string;
  name: string;
  venue?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  target: 'all' | 'confirmed' | 'pending';

  event?: {
    _id: string;
    name: string;
    venue?: string;
  } | string;

  sentBy?: {
    _id: string;
    name: string;
    email?: string;
  } | string;

  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function Announcements() {
  /* ================================================================
     STATE
  ================================================================= */

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [view, setView] = useState<'list' | 'create'>('list');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [target, setTarget] =
    useState<'all' | 'confirmed' | 'pending'>('all');

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [sending, setSending] = useState(false);

  const [notification, setNotification] = useState('');

  /* ================================================================
     TOAST
  ================================================================= */

  const show = useCallback((message: string) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification('');
    }, 3000);
  }, []);

  /* ================================================================
     TOKEN
  ================================================================= */

  const getToken = () => {
    return localStorage.getItem('token');
  };

  /* ================================================================
     LOAD EVENTS
  ================================================================= */

  const loadEvents = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        show('Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load events'
        );
      }

      const loadedEvents: Event[] = data.events || [];

      setEvents(loadedEvents);

      const savedEventId =
        localStorage.getItem('selectedEventId');

      const savedEventExists = loadedEvents.some(
        (event) => event._id === savedEventId
      );

      if (savedEventExists && savedEventId) {
        setSelectedEventId(savedEventId);
      } else if (loadedEvents.length > 0) {
        const firstEventId = loadedEvents[0]._id;

        setSelectedEventId(firstEventId);

        localStorage.setItem(
          'selectedEventId',
          firstEventId
        );
      }
    } catch (error) {
      console.error('Load events error:', error);

      show(
        error instanceof Error
          ? error.message
          : 'Failed to load events'
      );
    } finally {
      setLoadingEvents(false);
    }
  }, [show]);

  /* ================================================================
     LOAD ANNOUNCEMENTS
  ================================================================= */

  const loadAnnouncements = useCallback(
    async (eventId: string) => {
      if (!eventId) {
        setAnnouncements([]);
        return;
      }

      try {
        const token = getToken();

        if (!token) {
          show('Authentication required');
          return;
        }

        setLoadingAnnouncements(true);

        const response = await fetch(
          `${API_BASE_URL}/announcements/admin?eventId=${encodeURIComponent(
            eventId
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load announcements'
          );
        }

        setAnnouncements(data.announcements || []);
      } catch (error) {
        console.error(
          'Load announcements error:',
          error
        );

        show(
          error instanceof Error
            ? error.message
            : 'Failed to load announcements'
        );
      } finally {
        setLoadingAnnouncements(false);
      }
    },
    [show]
  );

  /* ================================================================
     INITIAL EVENT LOAD

     The timeout prevents React's setState-in-effect warning.
  ================================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadEvents]);

  /* ================================================================
     LOAD ANNOUNCEMENTS WHEN EVENT CHANGES

     Again, use a timeout so the React lint rule does not complain
     about state updates triggered from the effect.
  ================================================================= */

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadAnnouncements(selectedEventId);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [selectedEventId, loadAnnouncements]);

  /* ================================================================
     SELECTED EVENT
  ================================================================= */

  const selectedEvent = useMemo(() => {
    return events.find(
      (event) => event._id === selectedEventId
    );
  }, [events, selectedEventId]);

  /* ================================================================
     EVENT CHANGE
  ================================================================= */

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);

    localStorage.setItem(
      'selectedEventId',
      eventId
    );

    setView('list');
  };

  /* ================================================================
     OPEN CREATE VIEW
  ================================================================= */

  const openCreateView = () => {
    setTitle('');
    setContent('');
    setTarget('all');
    setView('create');
  };

  /* ================================================================
     CREATE ANNOUNCEMENT
  ================================================================= */

  const sendAnnouncement = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!selectedEventId) {
      show('Please select an event');
      return;
    }

    if (!title.trim()) {
      show('Please enter an announcement title');
      return;
    }

    if (!content.trim()) {
      show('Please enter an announcement message');
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        show('Authentication required');
        return;
      }

      setSending(true);

      const response = await fetch(
        `${API_BASE_URL}/announcements`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            target,
            eventId: selectedEventId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to create announcement'
        );
      }

      if (data.announcement) {
        setAnnouncements((previous) => [
          data.announcement,
          ...previous,
        ]);
      } else {
        await loadAnnouncements(selectedEventId);
      }

      setTitle('');
      setContent('');
      setTarget('all');

      setView('list');

      show('Announcement sent successfully');
    } catch (error) {
      console.error(
        'Create announcement error:',
        error
      );

      show(
        error instanceof Error
          ? error.message
          : 'Failed to create announcement'
      );
    } finally {
      setSending(false);
    }
  };

  /* ================================================================
     FORMAT DATE
  ================================================================= */

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Unknown date';
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  /* ================================================================
     TARGET LABEL
  ================================================================= */

  const getTargetLabel = (
    targetValue:
      | 'all'
      | 'confirmed'
      | 'pending'
  ) => {
    if (targetValue === 'confirmed') {
      return 'Confirmed Participants';
    }

    if (targetValue === 'pending') {
      return 'Pending Participants';
    }

    return 'All Participants';
  };

  /* ================================================================
     LOADING EVENTS
  ================================================================= */

  if (loadingEvents) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl border border-[#E8E8F0] p-10 text-center">
          <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-3" />

          <p className="text-sm text-[#9090A8]">
            Loading events...
          </p>
        </div>
      </div>
    );
  }

  /* ================================================================
     NO EVENTS
  ================================================================= */

  if (events.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-12">

        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#15152A]">
            Announcements
          </h1>

          <p className="text-[#9090A8] mt-2">
            Manage announcements for your events
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8F0] p-12 text-center">

          <div className="w-14 h-14 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-4">

            <svg
              className="w-7 h-7 text-[#5B6FD4]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>

          </div>

          <h2 className="font-semibold text-[#1A1A2E]">
            No events available
          </h2>

          <p className="text-sm text-[#9090A8] mt-2">
            Create an event first before sending announcements.
          </p>

        </div>
      </div>
    );
  }

  /* ================================================================
     MAIN PAGE
  ================================================================= */

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">

      {/* ============================================================
          HEADER
      ============================================================= */}

      <div className="flex items-start justify-between gap-6 mb-8">

        <div>
          <h1 className="text-4xl font-serif text-[#15152A]">
            {view === 'create'
              ? 'Create Announcement'
              : 'Announcements'}
          </h1>

          <p className="text-[#9090A8] mt-2">
            {view === 'create'
              ? 'Send an important update to your participants'
              : 'Manage announcements for your events'}
          </p>
        </div>

        {view === 'list' ? (
          <button
            type="button"
            onClick={openCreateView}
            className="px-6 py-3 rounded-full bg-[#7182DF] text-white font-semibold hover:bg-[#6072D5] transition"
          >
            + Create Announcement
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setView('list')}
            className="px-5 py-3 rounded-full bg-[#F2F2F9] text-[#4F506B] font-medium hover:bg-[#EAEAF4] transition"
          >
            ← Back to List
          </button>
        )}

      </div>

      {/* ============================================================
          LIST VIEW
          
          EVENT SELECTOR ONLY EXISTS HERE.
      ============================================================= */}

      {view === 'list' && (
        <>
          {/* EVENT SELECTOR */}

          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6 mb-7">

            <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">
              Select Event
            </label>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4">

              <select
                value={selectedEventId}
                onChange={(event) =>
                  handleEventChange(
                    event.target.value
                  )
                }
                className="flex-1 w-full px-5 py-3.5 rounded-full border border-[#E3E3ED] bg-white text-[#1A1A2E] outline-none focus:border-[#7182DF] focus:ring-2 focus:ring-[#7182DF]/10"
              >
                {events.map((event) => (
                  <option
                    key={event._id}
                    value={event._id}
                  >
                    {event.name}
                    {event.venue
                      ? ` — ${event.venue}`
                      : ''}
                  </option>
                ))}
              </select>

              {selectedEvent && (
                <div className="lg:min-w-[200px]">
                  <p className="text-xs text-[#9090A8]">
                    Venue
                  </p>

                  <p className="font-semibold text-[#1A1A2E] mt-0.5">
                    {selectedEvent.venue ||
                      selectedEvent.location ||
                      'Not specified'}
                  </p>
                </div>
              )}

            </div>

          </div>

          {/* ANNOUNCEMENT LIST */}

          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">

            <div className="px-7 py-5 border-b border-[#E8E8F0]">

              <h2 className="font-semibold text-lg text-[#1A1A2E]">
                Announcements
                {selectedEvent
                  ? ` — ${selectedEvent.name}`
                  : ''}
              </h2>

            </div>

            {loadingAnnouncements ? (
              <div className="p-12 text-center">

                <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-3" />

                <p className="text-sm text-[#9090A8]">
                  Loading announcements...
                </p>

              </div>
            ) : announcements.length === 0 ? (

              /* EMPTY STATE */

              <div className="p-12 text-center">

                <div className="w-14 h-14 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-4">

                  <svg
                    className="w-7 h-7 text-[#5B6FD4]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>

                </div>

                <p className="font-semibold text-[#1A1A2E]">
                  No announcements
                </p>

                <p className="text-sm text-[#9090A8] mt-2">
                  There are no announcements for this event yet.
                </p>

                <button
                  type="button"
                  onClick={openCreateView}
                  className="mt-5 px-5 py-2.5 rounded-full bg-[#7182DF] text-white text-sm font-semibold hover:bg-[#6072D5] transition"
                >
                  Create Announcement
                </button>

              </div>

            ) : (

              /* ANNOUNCEMENT CARDS */

              <div className="divide-y divide-[#F0F0F5]">

                {announcements.map(
                  (announcement) => (
                    <div
                      key={announcement._id}
                      className="px-7 py-6 hover:bg-[#FCFCFE] transition"
                    >

                      <div className="flex items-start gap-4">

                        {/* ICON */}

                        <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">

                          <svg
                            className="w-5 h-5 text-[#5B6FD4]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                            />
                          </svg>

                        </div>

                        {/* CONTENT */}

                        <div className="flex-1 min-w-0">

                          <h3 className="font-semibold text-lg text-[#1A1A2E]">
                            {announcement.title}
                          </h3>

                          <p className="text-sm text-[#5A5A72] mt-2 leading-relaxed whitespace-pre-wrap">
                            {announcement.content}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-4">

                            <span className="text-xs font-medium bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-full">
                              {getTargetLabel(
                                announcement.target
                              )}
                            </span>

                            <span className="text-xs text-[#9090A8]">
                              {formatDate(
                                announcement.createdAt
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        </>
      )}

      {/* ============================================================
          CREATE VIEW
          
          IMPORTANT:
          Event selection is INSIDE the create form.
          There is no event selector above this form.
      ============================================================= */}

      {view === 'create' && (
        <form
          onSubmit={sendAnnouncement}
          className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-8"
        >

          {/* ==========================================================
              SELECT EVENT
          ========================================================== */}

          <div className="mb-7">

            <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">
              Select Event
            </label>

            <select
              value={selectedEventId}
              onChange={(event) => {
                const eventId =
                  event.target.value;

                setSelectedEventId(eventId);

                localStorage.setItem(
                  'selectedEventId',
                  eventId
                );
              }}
              className="w-full px-5 py-3.5 rounded-full border border-[#E3E3ED] bg-white text-[#1A1A2E] outline-none focus:border-[#7182DF] focus:ring-2 focus:ring-[#7182DF]/10"
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

            {/* EVENT INFORMATION */}

            {selectedEvent && (
              <div className="mt-3 px-5 py-4 rounded-xl bg-[#F7F8FF] border border-[#E3E7FF]">

                <div className="flex flex-wrap gap-x-10 gap-y-3">

                  <div>
                    <p className="text-xs text-[#9090A8]">
                      Event
                    </p>

                    <p className="font-semibold text-sm text-[#1A1A2E] mt-1">
                      {selectedEvent.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#9090A8]">
                      Venue
                    </p>

                    <p className="font-semibold text-sm text-[#1A1A2E] mt-1">
                      {selectedEvent.venue ||
                        selectedEvent.location ||
                        'Not specified'}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* ==========================================================
              TITLE
          ========================================================== */}

          <div className="mb-6">

            <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">
              Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Important Venue Update"
              className="w-full px-5 py-3.5 rounded-full border border-[#E3E3ED] bg-white outline-none text-[#1A1A2E] placeholder:text-[#A5A5B5] focus:border-[#7182DF] focus:ring-2 focus:ring-[#7182DF]/10"
            />

          </div>

          {/* ==========================================================
              MESSAGE
          ========================================================== */}

          <div className="mb-7">

            <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">
              Message
            </label>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Write your announcement here..."
              rows={6}
              className="w-full px-5 py-4 rounded-2xl border border-[#E3E3ED] bg-white outline-none resize-none text-[#1A1A2E] placeholder:text-[#A5A5B5] focus:border-[#7182DF] focus:ring-2 focus:ring-[#7182DF]/10"
            />

          </div>

          {/* ==========================================================
              SEND TO
          ========================================================== */}

          <div className="mb-8">

            <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">
              Send To
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* ALL */}

              <button
                type="button"
                onClick={() => setTarget('all')}
                className={`p-4 rounded-xl border text-left transition ${
                  target === 'all'
                    ? 'border-[#7182DF] bg-[#EEF2FF]'
                    : 'border-[#E3E3ED] bg-white hover:bg-[#FAFAFD]'
                }`}
              >

                <p
                  className={`font-semibold ${
                    target === 'all'
                      ? 'text-[#5B6FD4]'
                      : 'text-[#1A1A2E]'
                  }`}
                >
                  All Participants
                </p>

                <p className="text-xs text-[#9090A8] mt-1">
                  Everyone in this event
                </p>

              </button>

              {/* CONFIRMED */}

              <button
                type="button"
                onClick={() =>
                  setTarget('confirmed')
                }
                className={`p-4 rounded-xl border text-left transition ${
                  target === 'confirmed'
                    ? 'border-[#7182DF] bg-[#EEF2FF]'
                    : 'border-[#E3E3ED] bg-white hover:bg-[#FAFAFD]'
                }`}
              >

                <p
                  className={`font-semibold ${
                    target === 'confirmed'
                      ? 'text-[#5B6FD4]'
                      : 'text-[#1A1A2E]'
                  }`}
                >
                  Confirmed Only
                </p>

                <p className="text-xs text-[#9090A8] mt-1">
                  Accepted participants
                </p>

              </button>

              {/* PENDING */}

              <button
                type="button"
                onClick={() =>
                  setTarget('pending')
                }
                className={`p-4 rounded-xl border text-left transition ${
                  target === 'pending'
                    ? 'border-[#7182DF] bg-[#EEF2FF]'
                    : 'border-[#E3E3ED] bg-white hover:bg-[#FAFAFD]'
                }`}
              >

                <p
                  className={`font-semibold ${
                    target === 'pending'
                      ? 'text-[#5B6FD4]'
                      : 'text-[#1A1A2E]'
                  }`}
                >
                  Pending Only
                </p>

                <p className="text-xs text-[#9090A8] mt-1">
                  Pending participants
                </p>

              </button>

            </div>

          </div>

          {/* ==========================================================
              ACTIONS
          ========================================================== */}

          <div className="flex items-center gap-3">

            <button
              type="submit"
              disabled={sending}
              className="px-7 py-3 rounded-full bg-[#7182DF] text-white font-semibold hover:bg-[#6072D5] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending
                ? 'Sending...'
                : 'Send Announcement'}
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={() => setView('list')}
              className="px-6 py-3 rounded-full bg-[#F2F2F9] text-[#4F506B] font-medium hover:bg-[#EAEAF4] transition disabled:opacity-50"
            >
              Cancel
            </button>

          </div>

        </form>
      )}

      {/* ================================================================
          NOTIFICATION
      ================================================================= */}

      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#3CA18F] text-white px-6 py-3.5 rounded-xl shadow-lg font-medium">
          ✓ {notification}
        </div>
      )}

    </div>
  );
}