import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import {
  io,
  type Socket,
} from 'socket.io-client';

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
  startDate?: string;
  endDate?: string;
  location?: string;

  modules?: {
    participants?: boolean;
    registration?: boolean;
    schedule?: boolean;
    documents?: boolean;
    announcements?: boolean;
    chat?: boolean;
    accommodation?: boolean;
    travel?: boolean;
  };
}

interface ParticipantEvent {
  _id: string;
  event: EventData;
  participant: string;

  status:
    | 'pending'
    | 'accepted'
    | 'registered';

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

  status:
    | 'approved'
    | 'pending'
    | 'rejected';

  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| DOCUMENT REQUEST
|--------------------------------------------------------------------------
*/

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

  status:
    | 'pending'
    | 'submitted'
    | 'approved'
    | 'rejected';

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

interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role:
    | 'admin'
    | 'participant';
}

interface ChatMessage {
  _id: string;

  conversation: string;

  sender: ChatUser;

  content: string;

  readAt?: string;

  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  _id: string;

  admin: ChatUser;

  participant: ChatUser;

  lastMessage?: ChatMessage;

  lastMessageAt?: string;

  createdAt: string;
  updatedAt: string;
}

interface SocketSendResult {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}

const API_BASE_URL =
  'http://localhost:5000/api';

const SOCKET_URL =
  'http://localhost:5000';

/*
|--------------------------------------------------------------------------
| Small API helper
|--------------------------------------------------------------------------
*/

async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<{
  response: Response;
  data: unknown;
}> {
  const response =
    await fetch(url, options);

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    const data =
      await response.json();

    return {
      response,
      data,
    };
  }

  const text =
    await response.text();

  if (
    text.trimStart().startsWith(
      '<!DOCTYPE'
    ) ||
    text.trimStart().startsWith(
      '<html'
    )
  ) {
    throw new Error(
      `Server returned an HTML page instead of JSON for ${url}. Make sure the EventFlow backend is running on http://localhost:5000.`
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
  /*
  |--------------------------------------------------------------------------
  | GENERAL
  |--------------------------------------------------------------------------
  */

  const [
    activeTab,
    setActiveTab,
  ] = useState<
    'home' |
    'documents' |
    'announcements' |
    'chat'
  >('home');

  const [
    participant,
    setParticipant,
  ] =
    useState<LoggedInUser | null>(
      null
    );

  const [
    participantEvent,
    setParticipantEvent,
  ] =
    useState<ParticipantEvent | null>(
      null
    );

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

  /*
  |--------------------------------------------------------------------------
  | DOCUMENTS
  |--------------------------------------------------------------------------
  */

  const [
    documents,
    setDocuments,
  ] = useState<
    ParticipantDocument[]
  >([]);

  const [
    documentRequests,
    setDocumentRequests,
  ] = useState<
    ParticipantDocumentRequest[]
  >([]);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Used to prevent the polling system from
  | showing the same request notification
  | repeatedly.
  |--------------------------------------------------------------------------
  */

  const knownRequestIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  const initialRequestsLoadedRef =
    useRef(false);

  /*
  |--------------------------------------------------------------------------
  | ANNOUNCEMENTS
  |--------------------------------------------------------------------------
  */

  const [
    announcements,
    setAnnouncements,
  ] = useState<
    ParticipantAnnouncement[]
  >([]);

  /*
  |--------------------------------------------------------------------------
  | CHAT
  |--------------------------------------------------------------------------
  */

  const [
    messages,
    setMessages,
  ] = useState<ChatMessage[]>([]);

  const [
    newMsg,
    setNewMsg,
  ] = useState('');

  const [
    conversation,
    setConversation,
  ] =
    useState<Conversation | null>(
      null
    );

  const [
    chatLoading,
    setChatLoading,
  ] = useState(false);

  const [
    chatSending,
    setChatSending,
  ] = useState(false);

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(false);

  const socketRef =
    useRef<Socket | null>(null);

  const conversationIdRef =
    useRef<string | null>(
      null
    );

  const messageIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  /*
  |--------------------------------------------------------------------------
  | NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const show = useCallback(
    (message: string) => {
      setNotification(message);

      window.setTimeout(() => {
        setNotification('');
      }, 3000);
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD DOCUMENT REQUESTS
  |--------------------------------------------------------------------------
  |
  | Admin creates requests from the admin Documents
  | page. Participants retrieve their own requests
  | using:
  |
  | GET /api/documents/my-requests
  |
  */

  const loadDocumentRequests =
    useCallback(
      async (
        notifyOnNew = false
      ) => {
        const token =
          localStorage.getItem(
            'token'
          );

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

          if (
            !result.response.ok
          ) {
            throw new Error(
              data.message ||
                'Failed to load document requests'
            );
          }

          const incomingRequests =
            data.requests || [];

          /*
          |--------------------------------------------------------------------------
          | Detect newly-created pending requests.
          |--------------------------------------------------------------------------
          */

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
                  request.status ===
                    'pending'
              );

            if (
              newRequests.length >
              0
            ) {
              if (
                newRequests.length ===
                1
              ) {
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
                (
                  request
                ) =>
                  request._id
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

  /*
  |--------------------------------------------------------------------------
  | LOAD PARTICIPANT DASHBOARD
  |--------------------------------------------------------------------------
  */

  const loadParticipantData =
    useCallback(
      async () => {
        const token =
          localStorage.getItem(
            'token'
          );

        const storedUser =
          localStorage.getItem(
            'user'
          );

        if (!token) {
          setError(
            'You are not logged in.'
          );
          setLoading(false);
          return;
        }

        try {
          /*
          |--------------------------------------------------------------------------
          | Logged-in user
          |--------------------------------------------------------------------------
          */

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

          /*
          |--------------------------------------------------------------------------
          | EVENTS
          |--------------------------------------------------------------------------
          */

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

          if (
            !eventsResult.response.ok
          ) {
            throw new Error(
              eventsData.message ||
                'Failed to load your events'
            );
          }

          if (
            eventsData.events &&
            eventsData.events.length >
              0
          ) {
            setParticipantEvent(
              eventsData.events[0]
            );
          } else {
            setParticipantEvent(
              null
            );
          }

          /*
          |--------------------------------------------------------------------------
          | DOCUMENTS
          |--------------------------------------------------------------------------
          */

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

          if (
            !documentsResult.response.ok
          ) {
            throw new Error(
              documentsData.message ||
                'Failed to load documents'
            );
          }

          setDocuments(
            documentsData.documents ||
              []
          );

          /*
          |--------------------------------------------------------------------------
          | DOCUMENT REQUESTS
          |--------------------------------------------------------------------------
          |
          | This is separate so a temporary request
          | API problem does not destroy the dashboard.
          |
          */

          await loadDocumentRequests(
            false
          );

          /*
          |--------------------------------------------------------------------------
          | ANNOUNCEMENTS
          |--------------------------------------------------------------------------
          */

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
              setAnnouncements(
                []
              );
            }
          } catch (
            announcementError
          ) {
            console.warn(
              'Announcements could not be loaded:',
              announcementError
            );

            setAnnouncements(
              []
            );
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
      [
        loadDocumentRequests,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadParticipantData();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    loadParticipantData,
  ]);

  /*
  |--------------------------------------------------------------------------
  | DOCUMENT REQUEST POLLING
  |--------------------------------------------------------------------------
  |
  | Every 10 seconds we check whether the admin
  | created a new document request.
  |
  */

  useEffect(() => {
    const token =
      localStorage.getItem(
        'token'
      );

    if (!token) {
      return;
    }

    const timer =
      window.setInterval(() => {
        void loadDocumentRequests(
          true
        );
      }, 10000);

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    loadDocumentRequests,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SOCKET.IO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token =
      localStorage.getItem(
        'token'
      );

    if (!token) {
      return;
    }

    const socket =
      io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: [
          'websocket',
          'polling',
        ],
      });

    socketRef.current =
      socket;

    socket.on(
      'connect',
      () => {
        console.log(
          'Participant chat socket connected'
        );

        setSocketConnected(
          true
        );

        const currentConversationId =
          conversationIdRef.current;

        if (
          currentConversationId
        ) {
          socket.emit(
            'join_conversation',
            {
              conversationId:
                currentConversationId,
            }
          );
        }
      }
    );

    socket.on(
      'disconnect',
      () => {
        console.log(
          'Participant chat socket disconnected'
        );

        setSocketConnected(
          false
        );
      }
    );

    socket.on(
      'connect_error',
      (
        socketError: Error
      ) => {
        console.error(
          'Chat socket connection error:',
          socketError.message
        );

        setSocketConnected(
          false
        );
      }
    );

    socket.on(
      'new_message',
      (
        incomingMessage: ChatMessage
      ) => {
        if (
          !incomingMessage?._id
        ) {
          return;
        }

        if (
          !incomingMessage.conversation
        ) {
          return;
        }

        if (
          conversationIdRef.current !==
          incomingMessage.conversation
        ) {
          return;
        }

        if (
          messageIdsRef.current.has(
            incomingMessage._id
          )
        ) {
          return;
        }

        messageIdsRef.current.add(
          incomingMessage._id
        );

        setMessages(
          (previous) => [
            ...previous,
            incomingMessage,
          ]
        );
      }
    );

    socket.on(
      'chat_error',
      (
        data: {
          message?: string;
        }
      ) => {
        if (
          data?.message
        ) {
          show(
            data.message
          );
        }
      }
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current =
        null;
    };
  }, [show]);

  /*
  |--------------------------------------------------------------------------
  | LOAD CHAT
  |--------------------------------------------------------------------------
  */

  const loadConversation =
    useCallback(
      async () => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

          if (!token) {
            show(
              'You are not logged in'
            );
            return;
          }

          setChatLoading(
            true
          );

          /*
          |--------------------------------------------------------------------------
          | Get conversations
          |--------------------------------------------------------------------------
          */

          const result =
            await apiRequest(
              `${API_BASE_URL}/chat/conversations`,
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
              conversations?: Conversation[];
              message?: string;
            };

          if (!result.response.ok) {
            throw new Error(
              data.message ||
                'Failed to load conversation'
            );
          }

          const currentConversation =
            data.conversations?.[0] ||
            null;

          /*
          |--------------------------------------------------------------------------
          | No conversation
          |--------------------------------------------------------------------------
          */

          if (
            !currentConversation
          ) {
            setConversation(
              null
            );

            setMessages(
              []
            );

            conversationIdRef.current =
              null;

            messageIdsRef.current.clear();

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | Store conversation
          |--------------------------------------------------------------------------
          */

          setConversation(
            currentConversation
          );

          conversationIdRef.current =
            currentConversation._id;

          messageIdsRef.current.clear();

          /*
          |--------------------------------------------------------------------------
          | Join socket room
          |--------------------------------------------------------------------------
          */

          if (
            socketRef.current?.connected
          ) {
            socketRef.current.emit(
              'join_conversation',
              {
                conversationId:
                  currentConversation._id,
              }
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Load messages
          |--------------------------------------------------------------------------
          */

          const messagesResult =
            await apiRequest(
              `${API_BASE_URL}/chat/conversations/${currentConversation._id}/messages`,
              {
                method: 'GET',
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const messagesData =
            messagesResult.data as {
              messages?: ChatMessage[];
              message?: string;
            };

          if (
            !messagesResult.response.ok
          ) {
            throw new Error(
              messagesData.message ||
                'Failed to load messages'
            );
          }

          const loadedMessages =
            messagesData.messages ||
            [];

          messageIdsRef.current =
            new Set(
              loadedMessages.map(
                (
                  message
                ) =>
                  message._id
              )
            );

          setMessages(
            loadedMessages
          );

          /*
          |--------------------------------------------------------------------------
          | Mark as read
          |--------------------------------------------------------------------------
          */

          await fetch(
            `${API_BASE_URL}/chat/conversations/${currentConversation._id}/read`,
            {
              method: 'PATCH',
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );
        } catch (err) {
          console.error(
            'Load chat error:',
            err
          );

          show(
            err instanceof Error
              ? err.message
              : 'Failed to load chat'
          );
        } finally {
          setChatLoading(
            false
          );
        }
      },
      [show]
    );

  /*
  |--------------------------------------------------------------------------
  | OPEN CHAT TAB
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      activeTab !== 'chat'
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        void loadConversation();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    activeTab,
    loadConversation,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SEND CHAT MESSAGE
  |--------------------------------------------------------------------------
  */

  const sendMsg =
    useCallback(
      async () => {
        const content =
          newMsg.trim();

        if (!content) {
          return;
        }

        if (!conversation) {
          show(
            'You do not have a chat conversation yet. Please contact the event admin.'
          );
          return;
        }

        const token =
          localStorage.getItem(
            'token'
          );

        if (!token) {
          show(
            'You are not logged in'
          );
          return;
        }

        setChatSending(
          true
        );

        try {
          const socket =
            socketRef.current;

          /*
          |--------------------------------------------------------------------------
          | SOCKET.IO
          |--------------------------------------------------------------------------
          */

          if (
            socket &&
            socket.connected
          ) {
            await new Promise<void>(
              (
                resolve,
                reject
              ) => {
                socket.emit(
                  'send_message',
                  {
                    conversationId:
                      conversation._id,
                    content,
                  },
                  (
                    result: SocketSendResult
                  ) => {
                    if (
                      !result?.success
                    ) {
                      reject(
                        new Error(
                          result?.error ||
                            'Failed to send message'
                        )
                      );

                      return;
                    }

                    if (
                      result.message &&
                      !messageIdsRef.current.has(
                        result.message._id
                      )
                    ) {
                      messageIdsRef.current.add(
                        result.message._id
                      );

                      setMessages(
                        (
                          previous
                        ) => [
                          ...previous,
                          result.message!,
                        ]
                      );
                    }

                    resolve();
                  }
                );
              }
            );
          } else {
            /*
            |--------------------------------------------------------------------------
            | REST FALLBACK
            |--------------------------------------------------------------------------
            */

            const result =
              await apiRequest(
                `${API_BASE_URL}/chat/conversations/${conversation._id}/messages`,
                {
                  method: 'POST',
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                    'Content-Type':
                      'application/json',
                  },
                  body: JSON.stringify({
                    content,
                  }),
                }
              );

            const data =
              result.data as {
                message?: ChatMessage;
                error?: string;
              };

            if (
              !result.response.ok
            ) {
              throw new Error(
                data.error ||
                  'Failed to send message'
              );
            }

            if (
              data.message &&
              !messageIdsRef.current.has(
                data.message._id
              )
            ) {
              messageIdsRef.current.add(
                data.message._id
              );

              setMessages(
                (
                  previous
                ) => [
                  ...previous,
                  data.message!,
                ]
              );
            }
          }

          setNewMsg('');
        } catch (err) {
          console.error(
            'Send chat message error:',
            err
          );

          show(
            err instanceof Error
              ? err.message
              : 'Failed to send message'
          );
        } finally {
          setChatSending(
            false
          );
        }
      },
      [
        conversation,
        newMsg,
        show,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | UPLOAD DOCUMENT
  |--------------------------------------------------------------------------
  |
  | requestId is optional.
  |
  | Normal upload:
  |   file + eventId
  |
  | Requested document:
  |   file + eventId + requestId
  |
  */

  const uploadFile =
    useCallback(
      async (
        file: File,
        requestId?: string
      ) => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

          if (!token) {
            show(
              'You are not logged in'
            );
            return;
          }

          const eventId =
            participantEvent?.event?._id;

          if (!eventId) {
            show(
              'No event assigned'
            );
            return;
          }

          /*
          |--------------------------------------------------------------------------
          | File type validation
          |--------------------------------------------------------------------------
          */

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

          /*
          |--------------------------------------------------------------------------
          | File size validation
          |--------------------------------------------------------------------------
          */

          const maxSize =
            10 * 1024 * 1024;

          if (
            file.size > maxSize
          ) {
            show(
              'File size must be less than 10MB'
            );
            return;
          }

          setUploading(
            true
          );

          /*
          |--------------------------------------------------------------------------
          | FormData
          |--------------------------------------------------------------------------
          */

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

          /*
          |--------------------------------------------------------------------------
          | Attach the specific document request
          |--------------------------------------------------------------------------
          */

          if (requestId) {
            formData.append(
              'requestId',
              requestId
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Backend upload
          |--------------------------------------------------------------------------
          */

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

          if (
            !result.response.ok
          ) {
            throw new Error(
              data.message ||
                'Failed to upload document'
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Add returned MongoDB document
          |--------------------------------------------------------------------------
          */

          if (
            data.document
          ) {
            setDocuments(
              (
                previous
              ) => [
                data.document!,
                ...previous,
              ]
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Update the matching request
          |--------------------------------------------------------------------------
          */

          if (requestId) {
            setDocumentRequests(
              (
                previous
              ) =>
                previous.map(
                  (
                    request
                  ) => {
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
          setUploading(
            false
          );
        }
      },
      [
        participantEvent,
        show,
      ]
    );

  // /*
  // |--------------------------------------------------------------------------
  // | GENERIC FILE SELECTION
  // |--------------------------------------------------------------------------
  // */

  // const handleFileChange =
  //   async (
  //     event: ChangeEvent<HTMLInputElement>
  //   ) => {
  //     const file =
  //       event.target.files?.[0];

  //     if (!file) {
  //       return;
  //     }

  //     await uploadFile(
  //       file
  //     );

  //     event.target.value =
  //       '';
  //   };

  /*
  |--------------------------------------------------------------------------
  | REQUEST-SPECIFIC FILE SELECTION
  |--------------------------------------------------------------------------
  */

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

      event.target.value =
        '';
    };

  /*
  |--------------------------------------------------------------------------
  | DOWNLOAD DOCUMENT
  |--------------------------------------------------------------------------
  */

  const downloadDocument =
    useCallback(
      async (
        documentId: string,
        originalName: string
      ) => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

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

          if (
            !response.ok
          ) {
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
                // Ignore invalid JSON.
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
            document.createElement(
              'a'
            );

          anchor.href =
            url;

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

  /*
  |--------------------------------------------------------------------------
  | EVENT
  |--------------------------------------------------------------------------
  */

  const event =
    participantEvent?.event;

  const registrationStatus =
    participantEvent?.status ||
    'pending';

  /*
  |--------------------------------------------------------------------------
  | DOCUMENT REQUEST COUNTS
  |--------------------------------------------------------------------------
  */

  const pendingDocumentRequests =
    documentRequests.filter(
      (
        request
      ) =>
        request.status ===
        'pending'
    );

  const pendingDocumentRequestCount =
    pendingDocumentRequests.length;

  /*
  |--------------------------------------------------------------------------
  | DATE FORMAT
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | DATE RANGE
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const navItems = [
    {
      id: 'home',
      label: 'Overview',
    },
    {
      id: 'documents',
      label: `Documents (${documents.length})`,
    },
    {
      id: 'announcements',
      label: 'Announcements',
    },
    {
      id: 'chat',
      label: 'Chat with Admin',
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | REGISTRATION PROGRESS
  |--------------------------------------------------------------------------
  */

  const progress = [
    {
      label: 'Registration',
      done:
        registrationStatus ===
        'registered',
    },

    {
      label: 'Email Confirmed',
      done: true,
    },

    {
      label: 'Documents Uploaded',
      done:
        documents.length > 0,
    },

    {
      label: 'Documents Approved',
      done:
        documents.length > 0 &&
        documents.every(
          (
            doc
          ) =>
            doc.status ===
            'approved'
        ),
    },

    {
      label: 'Check-in Ready',
      done:
        participantEvent?.registrationCompleted ||
        false,
    },
  ];

  const nextProgressIndex =
    progress.findIndex(
      (
        item
      ) => !item.done
    );

  /*
  |--------------------------------------------------------------------------
  | ENABLED MODULES
  |--------------------------------------------------------------------------
  */

  // const enabledModules =
  //   useMemo(() => {
  //     if (
  //       !event?.modules
  //     ) {
  //       return [];
  //     }

  //     const moduleLabels: Record<
  //       string,
  //       string
  //     > = {
  //       participants:
  //         'Participants',

  //       registration:
  //         'Registration',

  //       schedule:
  //         'Schedule',

  //       documents:
  //         'Documents',

  //       announcements:
  //         'Announcements',

  //       chat:
  //         'Chat',

  //       accommodation:
  //         'Accommodation',

  //       travel:
  //         'Travel',
  //     };

  //     return Object.entries(
  //       event.modules
  //     )
  //       .filter(
  //         (
  //           [, enabled]
  //         ) => enabled
  //       )
  //       .map(
  //         (
  //           [key]
  //         ) =>
  //           moduleLabels[
  //             key
  //           ] || key
  //       );
  //   }, [event]);

  /*
  |--------------------------------------------------------------------------
  | LATEST ANNOUNCEMENT
  |--------------------------------------------------------------------------
  */

  const latestAnnouncement =
    announcements[0] ||
    null;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | NO EVENT
  |--------------------------------------------------------------------------
  */

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
              Your participant account
              exists, but you are not
              currently associated with
              an event.
            </p>

          </div>

        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN DASHBOARD
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-[#FAFAF7]">

      {/* =====================================================
          NOTIFICATION
      ====================================================== */}

      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-elevated text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}

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

        {/* ===================================================
            HERO
        ==================================================== */}

        <div className="gradient-primary rounded-2xl p-6 text-white shadow-card">

          <p className="text-white/70 text-sm">
            Welcome back,
          </p>

          <h1 className="font-display text-3xl mt-1 mb-4">
            {participant?.name}
          </h1>

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

        {/* ===================================================
            TABS
        ==================================================== */}

        <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#E8E8F0] shadow-soft w-fit">

          {navItems.map(
            (
              tab
            ) => (
              <button
                key={
                  tab.id
                }
                onClick={() =>
                  setActiveTab(
                    tab.id as typeof activeTab
                  )
                }
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab ===
                  tab.id
                    ? 'bg-[#5B6FD4] text-white shadow-sm'
                    : 'text-[#9090A8] hover:text-[#5A5A72]'
                }`}
              >
                {tab.id ===
                'documents' ? (
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
            )
          )}

        </div>

        {/* ===================================================
            HOME
        ==================================================== */}

        {activeTab ===
          'home' && (
          <div className="space-y-5">

            {/* Registration Progress */}

            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">

              <h3 className="font-semibold text-[#1A1A2E] mb-4">
                Registration Progress
              </h3>

              <div className="space-y-3">

                {progress.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.label
                      }
                      className="flex items-center gap-3"
                    >

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          item.done
                            ? 'bg-[#3D9E8C]'
                            : index ===
                              nextProgressIndex
                            ? 'bg-[#EEF2FF] border-2 border-[#5B6FD4]'
                            : 'bg-[#F0F0F8]'
                        }`}
                      >

                        {item.done ? (
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        ) : index ===
                          nextProgressIndex ? (
                          <span className="text-[#5B6FD4] text-xs font-bold">
                            →
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#D0D0E0]" />
                        )}

                      </div>

                      <span
                        className={`text-sm ${
                          item.done
                            ? 'text-[#1A1A2E] font-medium'
                            : 'text-[#9090A8]'
                        }`}
                      >
                        {
                          item.label
                        }
                      </span>

                      {!item.done &&
                        index ===
                          nextProgressIndex && (
                          <span className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-2 py-0.5 rounded-full font-medium ml-auto">
                            Next
                          </span>
                        )}

                    </div>
                  )
                )}

              </div>

            </div>

            {/* Details */}

            <div className="grid sm:grid-cols-2 gap-4">

              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

                <h3 className="font-semibold text-[#1A1A2E] mb-3 text-sm">
                  Your Details
                </h3>

                <div className="space-y-2.5">

                  {[
                    {
                      label: 'Name',
                      value:
                        participant?.name ||
                        '—',
                    },
                    {
                      label: 'Role',
                      value:
                        participant?.role ||
                        'Participant',
                    },
                    {
                      label: 'Email',
                      value:
                        participant?.email ||
                        '—',
                    },
                    {
                      label: 'Event',
                      value:
                        event.name ||
                        '—',
                    },
                  ].map(
                    (
                      field
                    ) => (
                      <div
                        key={
                          field.label
                        }
                        className="flex justify-between text-sm gap-4"
                      >

                        <span className="text-[#9090A8]">
                          {
                            field.label
                          }
                        </span>

                        <span className="text-[#1A1A2E] font-medium text-right break-all">
                          {
                            field.value
                          }
                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>

              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

                <h3 className="font-semibold text-[#1A1A2E] mb-3 text-sm">
                  Event Information
                </h3>

                <div className="space-y-2.5">

                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-[#9090A8]">
                      Event
                    </span>

                    <span className="text-[#1A1A2E] font-medium text-right">
                      {event.name}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-[#9090A8]">
                      Type
                    </span>

                    <span className="text-[#1A1A2E] font-medium text-right capitalize">
                      {event.type ||
                        'Event'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-[#9090A8]">
                      Location
                    </span>

                    <span className="text-[#1A1A2E] font-medium text-right">
                      {event.location ||
                        'Not specified'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-[#9090A8]">
                      Status
                    </span>

                    <span className="text-[#3D9E8C] font-medium capitalize">
                      {registrationStatus}
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* Enabled Modules */}
{/* 
            {enabledModules.length >
              0 && (
              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

                <h3 className="font-semibold text-[#1A1A2E] mb-3 text-sm">
                  Available Event Features
                </h3>

                <div className="flex flex-wrap gap-2">

                  {enabledModules.map(
                    (
                      module
                  ) => (
                      <span
                        key={
                          module
                        }
                        className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1.5 rounded-full font-medium"
                      >
                        {
                          module
                        }
                      </span>
                    )
                  )}

                </div>

              </div>
            )} */}

            {/* =================================================
                DOCUMENT REQUESTS
            ================================================== */}

            {/* <div
              className={`bg-white rounded-2xl border shadow-soft p-5 ${
                pendingDocumentRequestCount >
                0
                  ? 'border-[#F3C5B3]'
                  : 'border-[#E8E8F0]'
              }`}
            >

              <div className="flex items-center justify-between mb-3">

                <div>

                  <h3 className="font-semibold text-[#1A1A2E] text-sm">
                    Document Requests
                  </h3>

                  <p className="text-xs text-[#9090A8] mt-1">
                    Documents requested by your event administrator.
                  </p>

                </div>

                {pendingDocumentRequestCount >
                  0 && (
                  <span className="bg-[#FEF3ED] text-[#E8824A] px-2.5 py-1 rounded-full text-xs font-semibold">
                    {pendingDocumentRequestCount}{' '}
                    pending
                  </span>
                )}

              </div>

              {documentRequests.length ===
              0 ? (
                <div className="text-center py-4">

                  <p className="text-sm text-[#9090A8]">
                    No document requests yet.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {documentRequests
                    .filter(
                      (
                        request
                      ) =>
                        request.status ===
                          'pending' ||
                        request.status ===
                          'rejected'
                    )
                    .slice(0, 3)
                    .map(
                      (
                        request
                      ) => (
                        <div
                          key={
                            request._id
                          }
                          className="rounded-xl bg-[#FAFAF7] border border-[#E8E8F0] p-4"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <p className="text-sm font-semibold text-[#1A1A2E]">
                                {
                                  request.documentName
                                }
                              </p>

                              {request.description && (
                                <p className="text-xs text-[#5A5A72] mt-1">
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
                              className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                                request.status ===
                                'rejected'
                                  ? 'bg-[#FDECEC] text-[#D95B5B]'
                                  : 'bg-[#FEF3ED] text-[#E8824A]'
                              }`}
                            >
                              {request.status ===
                              'rejected'
                                ? 'Rejected'
                                : 'Pending'}
                            </span>

                          </div>

                        </div>
                      )
                    )}

                  {pendingDocumentRequestCount >
                    0 && (
                    <button
                      onClick={() =>
                        setActiveTab(
                          'documents'
                        )
                      }
                      className="text-xs text-[#5B6FD4] font-medium hover:underline"
                    >
                      View and upload requested documents →
                    </button>
                  )}

                </div>
              )}

            </div> */}

            {/* Document Status */}
{/* 
            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

              <h3 className="font-semibold text-[#1A1A2E] mb-3 text-sm">
                Document Status
              </h3>

              {documents.length ===
              0 ? (
                <div className="text-center py-4">

                  <p className="text-sm text-[#D95B5B] font-medium">
                    No documents uploaded
                  </p>

                  <button
                    onClick={() =>
                      setActiveTab(
                        'documents'
                      )
                    }
                    className="mt-2 text-xs text-[#5B6FD4] font-medium hover:underline"
                  >
                    Upload now →
                  </button>

                </div>
              ) : (
                <div className="space-y-2">

                  {documents.map(
                    (
                      doc
                    ) => (
                      <div
                        key={
                          doc._id
                        }
                        className="flex items-center justify-between text-sm gap-3"
                      >

                        <span className="text-[#5A5A72] truncate">
                          {doc.name ||
                            doc.originalName ||
                            'Document'}
                        </span>

                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
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

                      </div>
                    )
                  )}

                </div>
              )}

            </div> */}

            {/* Latest Announcement */}

            {latestAnnouncement && (
              <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

                <div className="flex items-center justify-between mb-3">

                  <h3 className="font-semibold text-[#1A1A2E] text-sm">
                    Latest Announcement
                  </h3>

                  <button
                    onClick={() =>
                      setActiveTab(
                        'announcements'
                      )
                    }
                    className="text-xs text-[#5B6FD4] hover:underline font-medium"
                  >
                    View all
                  </button>

                </div>

                <p className="font-medium text-sm text-[#1A1A2E] mb-1">
                  {
                    latestAnnouncement.title
                  }
                </p>

                <p className="text-xs text-[#5A5A72] leading-relaxed line-clamp-2">
                  {
                    latestAnnouncement.content
                  }
                </p>

                <p className="text-xs text-[#9090A8] mt-2">
                  {formatDate(
                    latestAnnouncement.createdAt
                  )}
                </p>

              </div>
            )}

            {/* Chat CTA */}

            <button
              onClick={() =>
                setActiveTab(
                  'chat'
                )
              }
              className="w-full gradient-teal text-white rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition-opacity text-left shadow-card"
            >

              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">

                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>

              </div>

              <div>

                <p className="font-semibold">
                  Chat with the Event Team
                </p>

                <p className="text-sm text-white/80">
                  Have a question?
                  We're here to help.
                </p>

              </div>

              <span className="ml-auto text-white/70">
                →
              </span>

            </button>

          </div>
        )}

        {/* ===================================================
            DOCUMENTS
        ==================================================== */}

        {activeTab ===
          'documents' && (
          <div className="space-y-4">

            {/* Document information */}

            {/* <div className="bg-[#EEF2FF] border border-[#D9DEFA] rounded-2xl p-4 flex gap-3">

              <span className="text-[#5B6FD4]">
                ℹ
              </span>

              <div>

                <p className="text-sm font-medium text-[#5B6FD4]">
                  Document Submission
                </p>

                <p className="text-xs text-[#5A5A72] mt-1">
                  Upload the documents requested
                  by your event administrator.
                  Supported formats are PDF,
                  JPG and PNG, up to 10MB.
                </p>

              </div>

            </div> */}

            {/* =================================================
                REQUESTED DOCUMENTS
            ================================================== */}

            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5">

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h3 className="font-semibold text-[#1A1A2E]">
                    Document Requests
                  </h3>

                  <p className="text-xs text-[#9090A8] mt-1">
                    Upload each document requested by the event administrator.
                  </p>

                </div>

                {pendingDocumentRequestCount >
                  0 && (
                  <span className="bg-[#FEF3ED] text-[#E8824A] px-2.5 py-1 rounded-full text-xs font-semibold">
                    {pendingDocumentRequestCount}{' '}
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
                    (
                      request
                    ) => {

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
                          key={
                            request._id
                          }
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

                          {/* Pending upload */}

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
                                  PDF, JPG, PNG up to 10MB
                                </p>

                              </label>

                            </div>
                          )}

                          {/* Submitted */}

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

                          {/* Approved */}

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

            {/* =================================================
                EXISTING DOCUMENTS
            ================================================== */}

            <div className="pt-2">

              <h3 className="font-semibold text-[#1A1A2E] mb-3">
                Uploaded Documents
              </h3>

            </div>

            {documents.length >
            0 ? (
              documents.map(
                (
                  doc
                ) => {
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
                      key={
                        doc._id
                      }
                      className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-5 flex items-center gap-4"
                    >

                      {/* File icon */}

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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>

                      </div>

                      {/* File information */}

                      <div className="flex-1 min-w-0">

                        <p className="font-medium text-[#1A1A2E] text-sm truncate">
                          {
                            displayName
                          }
                        </p>

                        <p className="text-xs text-[#9090A8]">
                          {fileSize}{' '}
                          MB ·{' '}
                          {formatDate(
                            doc.createdAt
                          )}
                        </p>

                      </div>

                      {/* Status */}

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

                      {/* Download */}

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
                }
              )
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>

                </div>

                <p className="text-sm text-[#9090A8]">
                  No documents uploaded yet.
                </p>

              </div>
            )}

            {/* =================================================
                GENERIC UPLOAD
            ================================================== */}

            {/* <div className="pt-2">

              <h3 className="font-semibold text-[#1A1A2E] mb-3">
                Upload Other Document
              </h3>

            </div> */}
{/* 
            <label
              className={`w-full border-2 border-dashed border-[#D0D0E8] rounded-2xl p-8 text-center hover:border-[#5B6FD4] transition-colors bg-white block ${
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
                onChange={
                  handleFileChange
                }
              />

              <div className="w-10 h-10 bg-[#EEF2FF] rounded-xl flex items-center justify-center mx-auto mb-2">

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
                  : 'Upload a document'}
              </p>

              <p className="text-xs text-[#9090A8] mt-0.5">
                PDF, JPG, PNG up to 10MB
              </p>

            </label> */}

          </div>
        )}

        {/* ===================================================
            ANNOUNCEMENTS
        ==================================================== */}

        {activeTab ===
          'announcements' && (
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
                (
                  announcement
                ) => (
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

        {/* ===================================================
            CHAT
        ==================================================== */}

        {activeTab ===
          'chat' && (
          <div
            className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden flex flex-col"
            style={{
              height:
                '480px',
            }}
          >

            {/* Chat header */}

            <div className="px-5 py-4 border-b border-[#E8E8F0] flex items-center gap-3">

              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">

                {conversation?.admin?.name
                  ?.slice(
                    0,
                    2
                  )
                  .toUpperCase() ||
                  'EA'}

              </div>

              <div className="flex-1">

                <p className="text-sm font-semibold text-[#1A1A2E]">
                  {conversation?.admin?.name ||
                    'Event Admin'}
                </p>

                <p className="text-xs flex items-center gap-1">

                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      socketConnected
                        ? 'bg-[#3D9E8C]'
                        : 'bg-[#D0D0E0]'
                    }`}
                  />

                  <span
                    className={
                      socketConnected
                        ? 'text-[#3D9E8C]'
                        : 'text-[#9090A8]'
                    }
                  >
                    {socketConnected
                      ? 'Online'
                      : 'Connecting...'}
                  </span>

                </p>

              </div>

            </div>

            {/* Messages */}

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {chatLoading ? (
                <div className="text-center py-12">

                  <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-3" />

                  <p className="text-sm text-[#9090A8]">
                    Loading conversation...
                  </p>

                </div>
              ) : !conversation ? (
                <div className="text-center py-12">

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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>

                  </div>

                  <p className="text-sm font-medium text-[#1A1A2E] mb-1">
                    No chat conversation yet
                  </p>

                  <p className="text-xs text-[#9090A8] max-w-xs mx-auto">
                    The event admin needs to
                    start a conversation with
                    you before you can send
                    messages.
                  </p>

                </div>
              ) : messages.length ===
                0 ? (
                <div className="text-center py-12 text-sm text-[#9090A8]">
                  No messages yet.
                  Say hello!
                </div>
              ) : (
                messages.map(
                  (
                    message
                  ) => {
                    const isMine =
                      message.sender?._id ===
                      participant?.id;

                    return (
                      <div
                        key={
                          message._id
                        }
                        className={`flex gap-3 ${
                          isMine
                            ? 'flex-row-reverse'
                            : ''
                        }`}
                      >

                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto">

                          {isMine
                            ? participant?.name
                                ?.charAt(
                                  0
                                )
                                .toUpperCase() ||
                              'P'
                            : message.sender?.name
                                ?.slice(
                                  0,
                                  2
                                )
                                .toUpperCase() ||
                              'EA'}

                        </div>

                        <div
                          className={`max-w-xs flex flex-col gap-1 ${
                            isMine
                              ? 'items-end'
                              : 'items-start'
                          }`}
                        >

                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMine
                                ? 'gradient-primary text-white rounded-tr-sm'
                                : 'bg-[#F3F2EC] text-[#1A1A2E] rounded-tl-sm'
                            }`}
                          >
                            {
                              message.content
                            }
                          </div>

                          <p className="text-xs text-[#C0C0D0]">
                            {new Date(
                              message.createdAt
                            ).toLocaleTimeString(
                              'en-US',
                              {
                                hour:
                                  '2-digit',
                                minute:
                                  '2-digit',
                              }
                            )}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

            {/* Message input */}

            <div className="p-4 border-t border-[#E8E8F0]">

              <div className="flex gap-3">

                <input
                  type="text"
                  value={
                    newMsg
                  }
                  onChange={(
                    event
                  ) =>
                    setNewMsg(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      void sendMsg();
                    }
                  }}
                  disabled={
                    !conversation ||
                    chatSending
                  }
                  placeholder={
                    conversation
                      ? 'Type a message...'
                      : 'Waiting for admin to start chat...'
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />

                <button
                  onClick={() =>
                    void sendMsg()
                  }
                  disabled={
                    !conversation ||
                    !newMsg.trim() ||
                    chatSending
                  }
                  className="gradient-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chatSending
                    ? 'Sending...'
                    : 'Send'}
                </button>

              </div>

              {!socketConnected &&
                conversation && (
                  <p className="text-xs text-[#E8824A] mt-2">
                    Real-time connection
                    unavailable. Messages
                    will use the backup
                    connection.
                  </p>
                )}

            </div>
 
          </div>
        )}

      </div>
    </div>
  );
}