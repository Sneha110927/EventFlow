import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import API_BASE_URL from '../../config/api';

interface ParticipantDashboardProps {
  onLogout: () => void;
}

interface LoggedInUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'participant';
}

interface EventData {
  _id: string;
  name: string;
  type?: string;
  description?: string;
  venue?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

interface ParticipantEvent {
  _id: string;
  event: EventData;
  participant: string;
  status: 'pending' | 'accepted' | 'registered';
  registrationCompleted: boolean;
  joinedAt?: string;
}

interface ParticipantDocument {
  _id: string;
  event?: string | {
    _id: string;
    name?: string;
  };
  user?: string | {
    _id: string;
    name?: string;
  };
  name?: string;
  originalName?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ParticipantDocumentRequest {
  _id: string;
  event?: string | {
    _id: string;
    name?: string;
  };
  participant?: string;
  documentName: string;
  description?: string;
  required: boolean;
  deadline: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  document?: string | {
    _id: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ParticipantAnnouncement {
  _id: string;
  title: string;
  content: string;
  target: 'all' | 'confirmed' | 'pending';
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

async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<{
  response: Response;
  data: unknown;
}> {
  const response = await fetch(url, options);

  const contentType =
    response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();

    return {
      response,
      data,
    };
  }

  const text = await response.text();

  if (
    text.trimStart().startsWith('<!DOCTYPE') ||
    text.trimStart().startsWith('<html')
  ) {
    throw new Error(
      `Server returned an HTML page instead of JSON for ${url}. Make sure the EventFlow backend is running.`
    );
  }

  throw new Error(
    text ||
      `Request failed with status ${response.status}`
  );
}

export default function ParticipantDashboard({
  onLogout,
}: ParticipantDashboardProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<'documents' | 'announcements'>(
    'documents'
  );

  const [
    participant,
    setParticipant,
  ] = useState<LoggedInUser | null>(null);

  const [
    participantEvent,
    setParticipantEvent,
  ] = useState<ParticipantEvent | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    notification,
    setNotification,
  ] = useState('');

  const [
    documents,
    setDocuments,
  ] = useState<ParticipantDocument[]>([]);

  const [
    documentRequests,
    setDocumentRequests,
  ] = useState<ParticipantDocumentRequest[]>([]);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const knownRequestIdsRef =
    useRef<Set<string>>(new Set());

  const initialRequestsLoadedRef =
    useRef(false);

  const [
    announcements,
    setAnnouncements,
  ] = useState<ParticipantAnnouncement[]>([]);

  const show = useCallback(
    (message: string) => {
      setNotification(message);

      window.setTimeout(() => {
        setNotification('');
      }, 3000);
    },
    []
  );

  const loadDocumentRequests =
    useCallback(
      async (
        notifyOnNew = false
      ) => {
        const token =
          localStorage.getItem('token');

        if (!token) {
          return;
        }

        try {
          const result =
            await apiRequest(
              `${API_BASE_URL}/documents/my-requests`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data =
            result.data as {
              requests?: ParticipantDocumentRequest[];
              message?: string;
            };

          if (!result.response.ok) {
            throw new Error(
              data.message ||
                'Failed to load document requests'
            );
          }

          const incomingRequests =
            data.requests || [];

          if (
            notifyOnNew &&
            initialRequestsLoadedRef.current
          ) {
            const newRequests =
              incomingRequests.filter(
                (request) =>
                  !knownRequestIdsRef.current.has(
                    request._id
                  ) &&
                  request.status === 'pending'
              );

            if (newRequests.length > 0) {
              if (newRequests.length === 1) {
                show(
                  `New document request: ${newRequests[0].documentName}`
                );
              } else {
                show(
                  `You have ${newRequests.length} new document requests`
                );
              }
            }
          }

          knownRequestIdsRef.current =
            new Set(
              incomingRequests.map(
                (request) => request._id
              )
            );

          initialRequestsLoadedRef.current =
            true;

          setDocumentRequests(
            incomingRequests
          );
        } catch (err) {
          console.warn(
            'Document requests could not be loaded:',
            err
          );
        }
      },
      [show]
    );

  const loadParticipantData =
    useCallback(
      async () => {
        const token =
          localStorage.getItem('token');

        const storedUser =
          localStorage.getItem('user');

        if (!token) {
          setError(
            'You are not logged in.'
          );
          setLoading(false);
          return;
        }

        try {
          if (storedUser) {
            try {
              const parsedUser =
                JSON.parse(
                  storedUser
                ) as LoggedInUser;

              setParticipant(
                parsedUser
              );
            } catch {
              console.warn(
                'Unable to parse stored user.'
              );
            }
          }

          const eventsResult =
            await apiRequest(
              `${API_BASE_URL}/events/my-events`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const eventsData =
            eventsResult.data as {
              events?: ParticipantEvent[];
              message?: string;
            };

          if (!eventsResult.response.ok) {
            throw new Error(
              eventsData.message ||
                'Failed to load your events'
            );
          }

          if (
            eventsData.events &&
            eventsData.events.length > 0
          ) {
            setParticipantEvent(
              eventsData.events[0]
            );
          } else {
            setParticipantEvent(null);
          }

          const documentsResult =
            await apiRequest(
              `${API_BASE_URL}/documents/my-documents`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const documentsData =
            documentsResult.data as {
              documents?: ParticipantDocument[];
              message?: string;
            };

          if (!documentsResult.response.ok) {
            throw new Error(
              documentsData.message ||
                'Failed to load documents'
            );
          }

          setDocuments(
            documentsData.documents || []
          );

          await loadDocumentRequests(false);

          try {
            const announcementResult =
              await apiRequest(
                `${API_BASE_URL}/announcements/participant`,
                {
                  method: 'GET',
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            const announcementData =
              announcementResult.data as {
                announcements?: ParticipantAnnouncement[];
              };

            if (
              announcementResult.response.ok
            ) {
              setAnnouncements(
                announcementData.announcements ||
                  []
              );
            } else {
              setAnnouncements([]);
            }
          } catch (
            announcementError
          ) {
            console.warn(
              'Announcements could not be loaded:',
              announcementError
            );

            setAnnouncements([]);
          }
        } catch (err) {
          console.error(
            'Participant dashboard error:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load dashboard'
          );
        } finally {
          setLoading(false);
        }
      },
      [loadDocumentRequests]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadParticipantData();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadParticipantData]);

  useEffect(() => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      return;
    }

    const timer =
      window.setInterval(() => {
        void loadDocumentRequests(true);
      }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadDocumentRequests]);

  const uploadFile =
    useCallback(
      async (
        file: File,
        requestId?: string
      ) => {
        try {
          const token =
            localStorage.getItem('token');

          if (!token) {
            show(
              'You are not logged in'
            );
            return;
          }

          const eventId =
            participantEvent?.event?._id;

          if (!eventId) {
            show('No event assigned');
            return;
          }

          const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
          ];

          if (
            !allowedTypes.includes(
              file.type
            )
          ) {
            show(
              'Only PDF, JPG, and PNG files are allowed'
            );
            return;
          }

          const maxSize =
            10 * 1024 * 1024;

          if (file.size > maxSize) {
            show(
              'File size must be less than 10MB'
            );
            return;
          }

          setUploading(true);

          const formData =
            new FormData();

          formData.append(
            'file',
            file
          );

          formData.append(
            'eventId',
            eventId
          );

          if (requestId) {
            formData.append(
              'requestId',
              requestId
            );
          }

          const result =
            await apiRequest(
              `${API_BASE_URL}/documents/upload`,
              {
                method: 'POST',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
                body: formData,
              }
            );

          const data =
            result.data as {
              document?: ParticipantDocument;
              request?: ParticipantDocumentRequest;
              message?: string;
            };

          if (!result.response.ok) {
            throw new Error(
              data.message ||
                'Failed to upload document'
            );
          }

          if (data.document) {
            setDocuments(
              (previous) => [
                data.document!,
                ...previous,
              ]
            );
          }

          if (requestId) {
            setDocumentRequests(
              (previous) =>
                previous.map(
                  (request) => {
                    if (
                      request._id !==
                      requestId
                    ) {
                      return request;
                    }

                    return {
                      ...request,
                      status:
                        data.request?.status ||
                        'submitted',
                      document:
                        data.document?._id ||
                        request.document,
                      updatedAt:
                        data.request?.updatedAt ||
                        new Date().toISOString(),
                    };
                  }
                )
            );

            show(
              'Requested document submitted successfully'
            );
          } else {
            show(
              'Document uploaded successfully'
            );
          }
        } catch (err) {
          console.error(
            'Document upload error:',
            err
          );

          show(
            err instanceof Error
              ? err.message
              : 'Failed to upload document'
          );
        } finally {
          setUploading(false);
        }
      },
      [
        participantEvent,
        show,
      ]
    );

  const handleRequestFileChange =
    async (
      requestId: string,
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      await uploadFile(
        file,
        requestId
      );

      event.target.value = '';
    };

  const downloadDocument =
    useCallback(
      async (
        documentId: string,
        originalName: string
      ) => {
        try {
          const token =
            localStorage.getItem('token');

          if (!token) {
            show(
              'You are not logged in'
            );
            return;
          }

          const response =
            await fetch(
              `${API_BASE_URL}/documents/${documentId}/download`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (!response.ok) {
            let message =
              'Failed to download document';

            const contentType =
              response.headers.get(
                'content-type'
              ) || '';

            if (
              contentType.includes(
                'application/json'
              )
            ) {
              try {
                const data =
                  await response.json();

                message =
                  data.message ||
                  message;
              } catch {
                message =
                  'Failed to download document';
              }
            }

            throw new Error(
              message
            );
          }

          const blob =
            await response.blob();

          const url =
            window.URL.createObjectURL(
              blob
            );

          const anchor =
            document.createElement('a');

          anchor.href = url;

          anchor.download =
            originalName ||
            'document';

          document.body.appendChild(
            anchor
          );

          anchor.click();

          anchor.remove();

          window.URL.revokeObjectURL(
            url
          );
        } catch (err) {
          console.error(
            'Download document error:',
            err
          );

          show(
            err instanceof Error
              ? err.message
              : 'Failed to download document'
          );
        }
      },
      [show]
    );

  const markAnnouncementAsRead =
    useCallback(
      async (
        announcementId: string
      ) => {
        try {
          const token =
            localStorage.getItem('token');

          if (!token) {
            return;
          }

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
        } catch (err) {
          console.warn(
            'Unable to mark announcement as read:',
            err
          );
        }
      },
      []
    );

  const event =
    participantEvent?.event;

  const registrationStatus =
    participantEvent?.status ||
    'pending';

  const pendingDocumentRequests =
    documentRequests.filter(
      (request) =>
        request.status === 'pending'
    );

  const pendingDocumentRequestCount =
    pendingDocumentRequests.length;

  const formatDate =
    useCallback(
      (
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
      },
      []
    );

  const formatDateRange =
    useCallback(() => {
      if (
        !event?.startDate &&
        !event?.endDate
      ) {
        return 'Date not specified';
      }

      if (
        event.startDate &&
        event.endDate
      ) {
        const start =
          new Date(
            event.startDate
          );

        const end =
          new Date(
            event.endDate
          );

        const sameYear =
          start.getFullYear() ===
          end.getFullYear();

        if (sameYear) {
          return `${start.toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
            }
          )}–${end.toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          )}`;
        }

        return `${formatDate(
          event.startDate
        )} – ${formatDate(
          event.endDate
        )}`;
      }

      return formatDate(
        event.startDate ||
          event.endDate
      );
    }, [
      event,
      formatDate,
    ]);

  const navItems = [
    {
      id: 'documents' as const,
      label: `Documents (${documents.length})`,
    },
    {
      id: 'announcements' as const,
      label: 'Announcements',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-[#5A5A72]">
            Loading your event...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-[#FEF3ED] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[#D95B5B] text-xl">
              !
            </span>
          </div>

          <h2 className="font-semibold text-[#1A1A2E] text-lg mb-2">
            Unable to load your event
          </h2>

          <p className="text-sm text-[#9090A8] mb-6 break-words">
            {error}
          </p>

          <button
            onClick={onLogout}
            className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (
    !participantEvent ||
    !event
  ) {
    return (
      <div className="min-h-screen bg-[#FAFAF7]">
        <nav className="bg-white border-b border-[#E8E8F0]">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  E
                </span>
              </div>

              <span className="font-display text-lg text-[#1A1A2E]">
                Evently
              </span>
            </div>

            <button
              onClick={onLogout}
              className="text-xs text-[#9090A8] hover:text-[#D95B5B]"
            >
              Sign out
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-10 text-center">
            <div className="w-14 h-14 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#5B6FD4] text-xl">
                E
              </span>
            </div>

            <h2 className="font-display text-2xl text-[#1A1A2E] mb-2">
              No event assigned yet
            </h2>

            <p className="text-sm text-[#9090A8]">
              Your participant account exists,
              but you are not currently associated
              with an event.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      <nav className="bg-white border-b border-[#E8E8F0] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                E
              </span>
            </div>

            <span className="font-display text-lg text-[#1A1A2E]">
              Evently
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                {participant?.name
                  ?.charAt(0)
                  .toUpperCase() ||
                  'P'}
              </div>

              <span className="text-sm font-medium text-[#1A1A2E] hidden sm:block">
                {participant?.name ||
                  'Participant'}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="text-xs text-[#9090A8] hover:text-[#D95B5B] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="gradient-primary rounded-2xl p-6 text-white shadow-card">
          {/* <p className="text-white/70 text-sm">
            Welcome back,
          </p>

          <h1 className="font-display text-3xl mt-1 mb-4">
            {participant?.name}
          </h1> */}

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">
                Event
              </p>

              <p className="font-semibold">
                {event.name}
              </p>
            </div>

            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">
                Date
              </p>

              <p className="font-semibold">
                {formatDateRange()}
              </p>
            </div>

            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">
                Venue
              </p>

              <p className="font-semibold">
                {event.location ||
                  'Location not specified'}
              </p>
            </div>

            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">
                Status
              </p>

              <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold capitalize">
                {registrationStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#E8E8F0] shadow-soft w-fit">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[#5B6FD4] text-white shadow-sm'
                  : 'text-[#9090A8] hover:text-[#5A5A72]'
              }`}
            >
              {tab.id === 'documents' ? (
                <span className="flex items-center gap-2">
                  <span>
                    {tab.label}
                  </span>

                  {pendingDocumentRequestCount >
                    0 && (
                    <span
                      className={`min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        activeTab ===
                        tab.id
                          ? 'bg-white text-[#5B6FD4]'
                          : 'bg-[#D95B5B] text-white'
                      }`}
                    >
                      {
                        pendingDocumentRequestCount
                      }
                    </span>
                  )}
                </span>
              ) : (
                tab.label
              )}
            </button>
          ))}
        </div>

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[#1A1A2E]">
                    Document Requests
                  </h3>

                  <p className="text-xs text-[#9090A8] mt-1">
                    Upload each document requested
                    by the event administrator.
                  </p>
                </div>

                {pendingDocumentRequestCount >
                  0 && (
                  <span className="bg-[#FEF3ED] text-[#E8824A] px-2.5 py-1 rounded-full text-xs font-semibold">
                    {
                      pendingDocumentRequestCount
                    }{' '}
                    pending
                  </span>
                )}
              </div>

              {documentRequests.length ===
              0 ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 bg-[#F3F2EC] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-[#9090A8]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  <p className="text-sm text-[#9090A8]">
                    No document requests yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentRequests.map(
                    (request) => {
                      const isPending =
                        request.status ===
                        'pending';

                      const isRejected =
                        request.status ===
                        'rejected';

                      const isSubmitted =
                        request.status ===
                        'submitted';

                      const isApproved =
                        request.status ===
                        'approved';

                      return (
                        <div
                          key={request._id}
                          className={`rounded-xl border p-4 ${
                            isPending
                              ? 'border-[#F3C5B3] bg-[#FFF9F6]'
                              : isRejected
                              ? 'border-[#F2C4C4] bg-[#FFF8F8]'
                              : isApproved
                              ? 'border-[#CBE8E2] bg-[#F7FCFA]'
                              : 'border-[#E8E8F0] bg-[#FAFAF7]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-[#1A1A2E] text-sm">
                                  {
                                    request.documentName
                                  }
                                </h4>

                                {request.required && (
                                  <span className="text-[10px] bg-[#FDECEC] text-[#D95B5B] px-2 py-0.5 rounded-full font-semibold">
                                    Required
                                  </span>
                                )}

                                {!request.required && (
                                  <span className="text-[10px] bg-[#F3F2EC] text-[#9090A8] px-2 py-0.5 rounded-full font-medium">
                                    Optional
                                  </span>
                                )}
                              </div>

                              {request.description && (
                                <p className="text-xs text-[#5A5A72] mt-2 leading-relaxed">
                                  {
                                    request.description
                                  }
                                </p>
                              )}

                              <p className="text-xs text-[#9090A8] mt-2">
                                Deadline:{' '}
                                <span className="font-medium text-[#5A5A72]">
                                  {formatDate(
                                    request.deadline
                                  )}
                                </span>
                              </p>
                            </div>

                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                                isApproved
                                  ? 'bg-[#E6F4F1] text-[#3D9E8C]'
                                  : isRejected
                                  ? 'bg-[#FDECEC] text-[#D95B5B]'
                                  : isSubmitted
                                  ? 'bg-[#EEF2FF] text-[#5B6FD4]'
                                  : 'bg-[#FEF3ED] text-[#E8824A]'
                              }`}
                            >
                              {isApproved
                                ? 'Approved'
                                : isRejected
                                ? 'Rejected'
                                : isSubmitted
                                ? 'Submitted'
                                : 'Pending'}
                            </span>
                          </div>

                          {(isPending ||
                            isRejected) && (
                            <div className="mt-4 pt-4 border-t border-[#E8E8F0]">
                              {isRejected && (
                                <p className="text-xs text-[#D95B5B] mb-3">
                                  Your previous submission was rejected. Please upload the document again.
                                </p>
                              )}

                              <label
                                className={`w-full border-2 border-dashed border-[#D0D0E8] rounded-xl p-5 text-center hover:border-[#5B6FD4] transition-colors bg-white block ${
                                  uploading
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }`}
                              >
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                  className="hidden"
                                  disabled={
                                    uploading
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    void handleRequestFileChange(
                                      request._id,
                                      event
                                    )
                                  }
                                />

                                <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center mx-auto mb-2">
                                  {uploading ? (
                                    <div className="w-5 h-5 border-2 border-[#D0D0E8] border-t-[#5B6FD4] rounded-full animate-spin" />
                                  ) : (
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
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                  )}
                                </div>

                                <p className="text-sm font-medium text-[#1A1A2E]">
                                  {uploading
                                    ? 'Uploading...'
                                    : isRejected
                                    ? 'Upload again'
                                    : 'Upload requested document'}
                                </p>

                                <p className="text-xs text-[#9090A8] mt-1">
                                  PDF, JPG, PNG up to
                                  10MB
                                </p>
                              </label>
                            </div>
                          )}

                          {isSubmitted && (
                            <div className="mt-4 pt-4 border-t border-[#E8E8F0]">
                              <div className="flex items-center gap-2 text-sm text-[#5B6FD4]">
                                <span className="w-6 h-6 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                                  ✓
                                </span>

                                <span>
                                  Document submitted — awaiting administrator review.
                                </span>
                              </div>
                            </div>
                          )}

                          {isApproved && (
                            <div className="mt-4 pt-4 border-t border-[#E8E8F0]">
                              <div className="flex items-center gap-2 text-sm text-[#3D9E8C]">
                                <span className="w-6 h-6 rounded-full bg-[#E6F4F1] flex items-center justify-center">
                                  ✓
                                </span>

                                <span>
                                  Document approved by the administrator.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <h3 className="font-semibold text-[#1A1A2E] mb-3">
                Uploaded Documents
              </h3>
            </div>

            {documents.length > 0 ? (
              documents.map((doc) => {
                const displayName =
                  doc.originalName ||
                  doc.name ||
                  doc.filename ||
                  'Document';

                const fileSize =
                  typeof doc.size ===
                  'number'
                    ? (
                        doc.size /
                        1024 /
                        1024
                      ).toFixed(2)
                    : '—';

                return (
                  <div
                    key={doc._id}
                    className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5 flex items-center gap-4"
                  >
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A2E] text-sm truncate">
                        {displayName}
                      </p>

                      <p className="text-xs text-[#9090A8]">
                        {fileSize} MB ·{' '}
                        {formatDate(
                          doc.createdAt
                        )}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                        doc.status ===
                        'approved'
                          ? 'bg-[#E6F4F1] text-[#3D9E8C]'
                          : doc.status ===
                            'rejected'
                          ? 'bg-[#FDECEC] text-[#D95B5B]'
                          : 'bg-[#FEF3ED] text-[#E8824A]'
                      }`}
                    >
                      {doc.status ===
                      'approved'
                        ? 'Approved'
                        : doc.status ===
                          'rejected'
                        ? 'Rejected'
                        : 'Pending Review'}
                    </span>

                    <button
                      onClick={() =>
                        void downloadDocument(
                          doc._id,
                          displayName
                        )
                      }
                      className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity shrink-0"
                    >
                      Download
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-8 text-center">
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center mx-auto mb-3">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>

                <p className="text-sm text-[#9090A8]">
                  No documents uploaded yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.length ===
            0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-10 text-center">
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center mx-auto mb-3">
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
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                </div>

                <p className="text-sm font-medium text-[#1A1A2E]">
                  No announcements yet
                </p>

                <p className="text-xs text-[#9090A8] mt-1">
                  Event announcements from the
                  administrator will appear here.
                </p>
              </div>
            ) : (
              announcements.map(
                (announcement) => (
                  <div
                    key={
                      announcement._id
                    }
                    className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6"
                    onMouseEnter={() => {
                      void markAnnouncementAsRead(
                        announcement._id
                      );
                    }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 bg-[#EEF2FF] rounded-xl flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-[#5B6FD4]"
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
                        <p className="font-semibold text-[#1A1A2E]">
                          {
                            announcement.title
                          }
                        </p>

                        <p className="text-xs text-[#9090A8] mt-0.5">
                          {formatDate(
                            announcement.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[#5A5A72] leading-relaxed ml-11">
                      {
                        announcement.content
                      }
                    </p>
                  </div>
                )
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}