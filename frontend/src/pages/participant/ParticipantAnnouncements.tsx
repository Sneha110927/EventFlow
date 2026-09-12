import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ParticipantAnnouncement {
  _id: string;

  title: string;

  content: string;

  target:
    | 'all'
    | 'confirmed'
    | 'pending';

  sentBy?: {
    _id: string;
    name: string;
    email?: string;
  } | string;

  event?: {
    _id: string;
    name: string;
  } | string;

  readBy?: Array<
    string | {
      _id: string;
    }
  >;

  createdAt: string;

  updatedAt: string;
}

interface ParticipantAnnouncementsProps {
  show: (message: string) => void;

  compact?: boolean;
}

const API_BASE_URL =
  'http://localhost:5000/api';

export default function ParticipantAnnouncements({
  show,
  compact = false,
}: ParticipantAnnouncementsProps) {
  const [
    announcements,
    setAnnouncements,
  ] = useState<ParticipantAnnouncement[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | TRACK KNOWN ANNOUNCEMENTS
  |--------------------------------------------------------------------------
  */

  const knownAnnouncementIdsRef =
    useRef<Set<string>>(new Set());

  const initialAnnouncementsLoadedRef =
    useRef(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD ANNOUNCEMENTS
  |--------------------------------------------------------------------------
  */

  const loadAnnouncements = useCallback(
    async (
      notifyOnNew = false
    ) => {
      try {
        const token =
          localStorage.getItem('token');

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/announcements/participant`,
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
              'Failed to load announcements'
          );
        }

        const incomingAnnouncements =
          data.announcements || [];

        /*
        |--------------------------------------------------------------------------
        | DETECT NEW ANNOUNCEMENTS
        |--------------------------------------------------------------------------
        */

        if (
          notifyOnNew &&
          initialAnnouncementsLoadedRef.current
        ) {
          const newAnnouncements =
            incomingAnnouncements.filter(
              (
                announcement: ParticipantAnnouncement
              ) =>
                !knownAnnouncementIdsRef.current.has(
                  announcement._id
                )
            );

          if (
            newAnnouncements.length === 1
          ) {
            show(
              `New announcement: ${newAnnouncements[0].title}`
            );
          } else if (
            newAnnouncements.length > 1
          ) {
            show(
              `${newAnnouncements.length} new announcements`
            );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE KNOWN IDS
        |--------------------------------------------------------------------------
        */

        knownAnnouncementIdsRef.current =
          new Set(
            incomingAnnouncements.map(
              (
                announcement: ParticipantAnnouncement
              ) =>
                announcement._id
            )
          );

        initialAnnouncementsLoadedRef.current =
          true;

        setAnnouncements(
          incomingAnnouncements
        );
      } catch (error) {
        console.error(
          'Load participant announcements error:',
          error
        );
      } finally {
        setLoading(false);
      }
    },
    [show]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadAnnouncements();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadAnnouncements]);

  /*
  |--------------------------------------------------------------------------
  | AUTO REFRESH
  |--------------------------------------------------------------------------
  |
  | Check every 5 seconds for new announcements.
  |
  */

  useEffect(() => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      return;
    }

    const timer =
      window.setInterval(() => {
        void loadAnnouncements(true);
      }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadAnnouncements]);

  /*
  |--------------------------------------------------------------------------
  | MARK ANNOUNCEMENT AS READ
  |--------------------------------------------------------------------------
  */

  const markAnnouncementAsRead =
    useCallback(
      async (
        announcementId: string
      ) => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

          if (!token) {
            return;
          }

          const response =
            await fetch(
              `${API_BASE_URL}/announcements/${announcementId}/read`,
              {
                method: 'PATCH',

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (!response.ok) {
            return;
          }

          /*
           * Update local state immediately
           * so the NEW badge disappears.
           */

          const userString =
            localStorage.getItem('user');

          if (!userString) {
            return;
          }

          const user =
            JSON.parse(userString);

          const userId =
            user?._id ||
            user?.id;

          if (!userId) {
            return;
          }

          setAnnouncements(
            (previous) =>
              previous.map(
                (announcement) => {
                  if (
                    announcement._id !==
                    announcementId
                  ) {
                    return announcement;
                  }

                  const existingReadBy =
                    announcement.readBy ||
                    [];

                  const alreadyRead =
                    existingReadBy.some(
                      (reader) =>
                        typeof reader ===
                        'string'
                          ? reader ===
                            userId
                          : reader._id ===
                            userId
                    );

                  if (alreadyRead) {
                    return announcement;
                  }

                  return {
                    ...announcement,

                    readBy: [
                      ...existingReadBy,
                      userId,
                    ],
                  };
                }
              )
          );
        } catch (error) {
          console.warn(
            'Unable to mark announcement as read:',
            error
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | CHECK IF ANNOUNCEMENT IS READ
  |--------------------------------------------------------------------------
  */

  const isAnnouncementRead =
    useCallback(
      (
        announcement: ParticipantAnnouncement
      ) => {
        const userString =
          localStorage.getItem('user');

        if (!userString) {
          return false;
        }

        try {
          const user =
            JSON.parse(userString);

          const userId =
            user?._id ||
            user?.id;

          if (!userId) {
            return false;
          }

          return (
            announcement.readBy?.some(
              (reader) =>
                typeof reader ===
                'string'
                  ? reader === userId
                  : reader._id === userId
            ) ?? false
          );
        } catch {
          return false;
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | GET EVENT NAME
  |--------------------------------------------------------------------------
  */

  const getEventName = (
    announcement: ParticipantAnnouncement
  ) => {
    if (!announcement.event) {
      return 'Event';
    }

    if (
      typeof announcement.event ===
      'string'
    ) {
      return announcement.event;
    }

    return (
      announcement.event.name ||
      'Event'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | GET SENDER NAME
  |--------------------------------------------------------------------------
  */

  const getSenderName = (
    announcement: ParticipantAnnouncement
  ) => {
    if (!announcement.sentBy) {
      return 'Event Administrator';
    }

    if (
      typeof announcement.sentBy ===
      'string'
    ) {
      return 'Event Administrator';
    }

    return (
      announcement.sentBy.name ||
      'Event Administrator'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | GET TARGET LABEL
  |--------------------------------------------------------------------------
  */

  const getTargetLabel = (
    target: ParticipantAnnouncement['target']
  ) => {
    if (target === 'confirmed') {
      return 'Confirmed Participants';
    }

    if (target === 'pending') {
      return 'Pending Participants';
    }

    return 'All Participants';
  };

  /*
  |--------------------------------------------------------------------------
  | GET TARGET SHORT LABEL
  |--------------------------------------------------------------------------
  */

  const getTargetShortLabel = (
    target: ParticipantAnnouncement['target']
  ) => {
    if (target === 'confirmed') {
      return 'Confirmed';
    }

    if (target === 'pending') {
      return 'Pending';
    }

    return 'All Participants';
  };

  /*
  |--------------------------------------------------------------------------
  | DATE FORMAT
  |--------------------------------------------------------------------------
  */

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return 'Not specified';
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return 'Not specified';
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

  /*
  |--------------------------------------------------------------------------
  | TIME FORMAT
  |--------------------------------------------------------------------------
  */

  const formatTime = (
    date?: string
  ) => {
    if (!date) {
      return '';
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return '';
    }

    return parsedDate.toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !compact
  ) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-10 text-center">

        <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-3" />

        <p className="text-sm text-[#9090A8]">
          Loading announcements...
        </p>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COMPACT VERSION
  |--------------------------------------------------------------------------
  |
  | Used on the Overview page for
  | "Latest Announcement".
  |
  */

  if (compact) {
    const latestAnnouncement =
      announcements[0] || null;

    if (!latestAnnouncement) {
      return null;
    }

    const isRead =
      isAnnouncementRead(
        latestAnnouncement
      );

    return (
      <div
        className={`bg-white rounded-2xl border shadow-soft p-5 transition ${
          !isRead
            ? 'border-[#C9D2FF]'
            : 'border-[#E8E8F0]'
        }`}
      >

        {/* Header */}

        <div className="flex items-start justify-between gap-4 mb-4">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">

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

            <div>

              <div className="flex items-center gap-2">

                <h3 className="font-semibold text-[#1A1A2E] text-sm">
                  Latest Announcement
                </h3>

                {!isRead && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-[#5B6FD4] text-white px-2 py-0.5 rounded-full">
                    New
                  </span>
                )}

              </div>

              <p className="text-xs text-[#9090A8] mt-0.5">
                {formatDate(
                  latestAnnouncement.createdAt
                )}{' '}
                •{' '}
                {formatTime(
                  latestAnnouncement.createdAt
                )}
              </p>

            </div>

          </div>

        </div>

        {/* Title */}

        <p className="font-semibold text-[#1A1A2E] mb-1">
          {latestAnnouncement.title}
        </p>

        {/* Message */}

        <p className="text-sm text-[#5A5A72] leading-relaxed line-clamp-2">
          {latestAnnouncement.content}
        </p>

        {/* Metadata */}

        <div className="flex flex-wrap items-center gap-2 mt-4">

          <span className="text-xs bg-[#F5F5FA] text-[#5A5A72] px-3 py-1.5 rounded-full">
            {getEventName(
              latestAnnouncement
            )}
          </span>

          <span className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-full">
            {getTargetShortLabel(
              latestAnnouncement.target
            )}
          </span>

        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FULL ANNOUNCEMENTS TAB
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-5">

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-12 text-center">

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

          <p className="text-base font-semibold text-[#1A1A2E]">
            No announcements yet
          </p>

          <p className="text-sm text-[#9090A8] mt-2 max-w-md mx-auto">
            Event announcements from the
            administrator will appear here.
          </p>

        </div>
      ) : (
        announcements.map(
          (announcement) => {
            const isRead =
              isAnnouncementRead(
                announcement
              );

            return (
              <div
                key={
                  announcement._id
                }
                onClick={() => {
                  if (!isRead) {
                    void markAnnouncementAsRead(
                      announcement._id
                    );
                  }
                }}
                className={`bg-white rounded-2xl border shadow-soft overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  !isRead
                    ? 'border-[#C9D2FF]'
                    : 'border-[#E8E8F0]'
                }`}
              >

                {/* ==================================================
                    TOP ACCENT / UNREAD INDICATOR
                =================================================== */}

                <div
                  className={`h-1 ${
                    !isRead
                      ? 'bg-[#5B6FD4]'
                      : 'bg-[#EEF2FF]'
                  }`}
                />

                <div className="p-6">

                  {/* ==================================================
                      HEADER
                  =================================================== */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-4">

                      {/* Announcement icon */}

                      <div className="w-11 h-11 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">

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

                      {/* Title + date */}

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="font-semibold text-lg text-[#1A1A2E]">
                            {announcement.title}
                          </h2>

                          {!isRead && (
                            <span className="text-[10px] font-bold uppercase tracking-wide bg-[#5B6FD4] text-white px-2.5 py-1 rounded-full">
                              New
                            </span>
                          )}

                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">

                          <span className="text-xs text-[#9090A8]">
                            {formatDate(
                              announcement.createdAt
                            )}
                          </span>

                          <span className="text-xs text-[#D0D0DC]">
                            •
                          </span>

                          <span className="text-xs text-[#9090A8]">
                            {formatTime(
                              announcement.createdAt
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* Audience */}

                    <span className="hidden sm:inline-flex shrink-0 text-xs font-medium bg-[#F5F5FA] text-[#5A5A72] px-3 py-1.5 rounded-full">
                      {getTargetShortLabel(
                        announcement.target
                      )}
                    </span>

                  </div>

                  {/* ==================================================
                      MESSAGE
                  =================================================== */}

                  <div className="ml-0 sm:ml-[60px] mt-5">

                    <p className="text-sm text-[#4F4F67] leading-7 whitespace-pre-wrap">
                      {announcement.content}
                    </p>

                  </div>

                  {/* ==================================================
                      INFORMATION
                  =================================================== */}

                  <div className="ml-0 sm:ml-[60px] mt-6 pt-5 border-t border-[#F0F0F5]">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Event */}

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 bg-[#F7F7FB] rounded-lg flex items-center justify-center">

                          <svg
                            className="w-4 h-4 text-[#777790]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>

                        </div>

                        <div>

                          <p className="text-[11px] uppercase tracking-wide text-[#A0A0B2] font-medium">
                            Event
                          </p>

                          <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">
                            {getEventName(
                              announcement
                            )}
                          </p>

                        </div>

                      </div>

                      {/* Sent By */}

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 bg-[#F7F7FB] rounded-lg flex items-center justify-center">

                          <svg
                            className="w-4 h-4 text-[#777790]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>

                        </div>

                        <div>

                          <p className="text-[11px] uppercase tracking-wide text-[#A0A0B2] font-medium">
                            Sent by
                          </p>

                          <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">
                            {getSenderName(
                              announcement
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* ==================================================
                      FOOTER
                  =================================================== */}

                  <div className="ml-0 sm:ml-[60px] mt-5 flex flex-wrap items-center justify-between gap-3">

                    <div className="flex items-center gap-2">

                      <span className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-full">
                        {getTargetLabel(
                          announcement.target
                        )}
                      </span>

                    </div>

                    {!isRead ? (
                      <span className="text-xs text-[#5B6FD4] font-medium">
                        Click to mark as read
                      </span>
                    ) : (
                      <span className="text-xs text-[#A0A0B2]">
                        ✓ Read
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          }
        )
      )}

    </div>
  );
}