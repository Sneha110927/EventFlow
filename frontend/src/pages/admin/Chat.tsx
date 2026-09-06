import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  io,
  Socket,
} from "socket.io-client";

const API_URL =
  "http://localhost:5000/api/chat";

const SOCKET_URL =
  "http://localhost:5000";

// =========================================================
// TYPES
// =========================================================

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "participant";
}

interface LastMessage {
  _id: string;
  content: string;
  sender: User;
  createdAt: string;
}

interface Conversation {
  _id: string;
  admin: User;
  participant: User;
  lastMessage?: LastMessage;
  lastMessageAt?: string;
}

interface ChatParticipant {
  participant: User;

  event?: {
    _id: string;
    name: string;
    type: string;
  };

  conversation?: Conversation | null;
}

interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  readAt?: string;
  createdAt: string;
}

interface ConversationUpdatedPayload {
  conversationId: string;
  message?: Message;
  lastMessage?: LastMessage | Message;
  lastMessageAt?: string;
  adminId: string;
  participantId: string;
}

interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

// =========================================================
// HELPERS
// =========================================================

const getToken = () => {
  return localStorage.getItem("token");
};

const getInitials = (
  name: string
) => {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .map(
      (part) =>
        part.charAt(0)
    )
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const formatTime = (
  date?: string
) => {
  if (!date) {
    return "";
  }

  return new Date(
    date
  ).toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

// =========================================================
// COMPONENT
// =========================================================

export default function Chat() {
  // =======================================================
  // PARTICIPANTS
  // =======================================================

  const [
    participants,
    setParticipants,
  ] = useState<
    ChatParticipant[]
  >([]);

  const [
    selectedParticipantId,
    setSelectedParticipantId,
  ] = useState<
    string | null
  >(null);

  // =======================================================
  // CONVERSATION
  // =======================================================

  const [
    conversation,
    setConversation,
  ] = useState<
    Conversation | null
  >(null);

  // =======================================================
  // MESSAGES
  // =======================================================

  const [
    messages,
    setMessages,
  ] = useState<Message[]>(
    []
  );

  const [
    newMsg,
    setNewMsg,
  ] = useState("");

  // =======================================================
  // LOADING
  // =======================================================

  const [
    loadingParticipants,
    setLoadingParticipants,
  ] = useState(true);

  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  // =======================================================
  // SEARCH
  // =======================================================

  const [
    search,
    setSearch,
  ] = useState("");

  // =======================================================
  // SOCKET
  // =======================================================

  const [
    socket,
    setSocket,
  ] = useState<
    Socket | null
  >(null);

  // =======================================================
  // REFS
  // =======================================================

  /*
   * Stores the currently open conversation.
   *
   * This is important because Socket.IO listeners are
   * created only once. Using a ref prevents the listener
   * from using an old/stale conversation value.
   */

  const currentConversationIdRef =
    useRef<string | null>(
      null
    );

  // =======================================================
  // SELECTED PARTICIPANT
  // =======================================================

  const selectedParticipant =
    useMemo(() => {
      return participants.find(
        (item) =>
          item.participant
            ._id ===
          selectedParticipantId
      );
    }, [
      participants,
      selectedParticipantId,
    ]);

  // =======================================================
  // LOAD PARTICIPANTS
  // =======================================================

  const loadParticipants =
    useCallback(
      async (
        searchValue = ""
      ) => {
        try {
          setLoadingParticipants(
            true
          );

          const token =
            getToken();

          if (!token) {
            console.error(
              "Authentication token not found"
            );

            return;
          }

          const trimmedSearch =
            searchValue.trim();

          const query =
            trimmedSearch
              ? `?search=${encodeURIComponent(
                  trimmedSearch
                )}`
              : "";

          const response =
            await fetch(
              `${API_URL}/participants${query}`,
              {
                method: "GET",

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
                "Failed to load participants"
            );
          }

          const fetchedParticipants =
            data.participants ||
            [];

          setParticipants(
            fetchedParticipants
          );

          /*
           * Keep the current participant selected
           * if they still exist in the search results.
           *
           * Otherwise select the first result.
           */

          setSelectedParticipantId(
            (currentSelectedId) => {
              const stillExists =
                fetchedParticipants.some(
                  (
                    item: ChatParticipant
                  ) =>
                    item.participant
                      ._id ===
                    currentSelectedId
                );

              if (
                stillExists
              ) {
                return currentSelectedId;
              }

              if (
                fetchedParticipants.length >
                0
              ) {
                return fetchedParticipants[0]
                  .participant
                  ._id;
              }

              return null;
            }
          );
        } catch (error) {
          console.error(
            "Load participants error:",
            error
          );
        } finally {
          setLoadingParticipants(
            false
          );
        }
      },
      []
    );

  // =======================================================
  // LOAD PARTICIPANTS + SEARCH
  // =======================================================

  /*
   * This single effect handles both:
   *
   * 1. Initial loading
   * 2. Searching
   *
   * There is NO separate:
   *
   * useEffect(() => {
   *   loadParticipants();
   * }, []);
   *
   * Therefore the React cascading-render warning
   * is avoided.
   */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadParticipants(
          search
        );
      }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    search,
    loadParticipants,
  ]);

  // =======================================================
  // CONNECT SOCKET.IO
  // =======================================================

  useEffect(() => {
    const token =
      getToken();

    if (!token) {
      console.error(
        "Cannot connect to chat socket: token missing"
      );

      return;
    }

    /*
     * ONE socket connection for the entire component.
     *
     * Do NOT add conversation to this dependency array.
     */

    const newSocket =
      io(
        SOCKET_URL,
        {
          auth: {
            token,
          },

          transports: [
            "websocket",
            "polling",
          ],
        }
      );

    // =====================================================
    // CONNECT
    // =====================================================

    newSocket.on(
      "connect",
      () => {
        console.log(
          "Chat Socket connected:",
          newSocket.id
        );

        /*
         * If a conversation was already selected
         * before the socket connected, join it now.
         */

        const conversationId =
          currentConversationIdRef.current;

        if (
          conversationId
        ) {
          newSocket.emit(
            "join_conversation",
            {
              conversationId,
            }
          );
        }
      }
    );

    // =====================================================
    // CONNECT ERROR
    // =====================================================

    newSocket.on(
      "connect_error",
      (error) => {
        console.error(
          "Chat Socket connection error:",
          error.message
        );
      }
    );

    // =====================================================
    // DISCONNECT
    // =====================================================

    newSocket.on(
      "disconnect",
      (reason) => {
        console.log(
          "Chat Socket disconnected:",
          reason
        );
      }
    );

    // =====================================================
    // NEW MESSAGE
    // =====================================================

    newSocket.on(
      "new_message",
      (message: Message) => {
        if (!message) {
          return;
        }

        const currentConversationId =
          currentConversationIdRef.current;

        /*
         * Only add the message to the open chat
         * if it belongs to the currently opened
         * conversation.
         */

        if (
          currentConversationId ===
          message.conversation
        ) {
          setMessages(
            (previous) => {
              /*
               * Socket.IO backend may emit the same
               * message through multiple rooms.
               *
               * Prevent duplicates using _id.
               */

              const alreadyExists =
                previous.some(
                  (item) =>
                    item._id ===
                    message._id
                );

              if (
                alreadyExists
              ) {
                return previous;
              }

              return [
                ...previous,
                message,
              ];
            }
          );
        }

        // -------------------------------------------------
        // UPDATE SIDEBAR
        // -------------------------------------------------

        setParticipants(
          (previous) =>
            previous.map(
              (item) => {
                if (
                  item.conversation
                    ?._id ===
                  message.conversation
                ) {
                  return {
                    ...item,

                    conversation:
                      {
                        ...item.conversation,

                        lastMessage:
                          message,

                        lastMessageAt:
                          message.createdAt,
                      },
                  };
                }

                return item;
              }
            )
        );
      }
    );

    // =====================================================
    // CONVERSATION UPDATED
    // =====================================================

    newSocket.on(
      "conversation_updated",
      (
        update: ConversationUpdatedPayload
      ) => {
        if (!update) {
          return;
        }

        const lastMessage =
          update.lastMessage ||
          update.message;

        setParticipants(
          (previous) =>
            previous.map(
              (item) => {
                /*
                 * First try to match using conversation ID.
                 */

                if (
                  item.conversation
                    ?._id ===
                  update.conversationId
                ) {
                  if (
                    !item.conversation
                  ) {
                    return item;
                  }

                  return {
                    ...item,

                    conversation:
                      {
                        ...item.conversation,

                        lastMessage:
                          lastMessage as LastMessage,

                        lastMessageAt:
                          update.lastMessageAt ||
                          lastMessage?.createdAt,
                      },
                  };
                }

                /*
                 * If there is no conversation yet,
                 * match using participant ID.
                 */

                if (
                  item.participant
                    ._id ===
                  update.participantId
                ) {
                  return item;
                }

                return item;
              }
            )
        );
      }
    );

    // =====================================================
    // CHAT ERROR
    // =====================================================

    newSocket.on(
      "chat_error",
      (data: {
        message?: string;
      }) => {
        console.error(
          "Chat error:",
          data?.message
        );
      }
    );

    // =====================================================
    // SAVE SOCKET
    // =====================================================

    setSocket(
      newSocket
    );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      console.log(
        "Closing Chat Socket"
      );

      newSocket.removeAllListeners();

      newSocket.disconnect();

      setSocket(null);
    };
  }, []);

  // =======================================================
  // OPEN CONVERSATION
  // =======================================================

  const openConversation =
    async (
      participantId: string
    ) => {
      try {
        setSelectedParticipantId(
          participantId
        );

        /*
         * Clear old messages immediately so the previous
         * participant's messages are not shown while the
         * new conversation is loading.
         */

        setMessages([]);

        setConversation(
          null
        );

        /*
         * Temporarily clear current conversation ID.
         */

        currentConversationIdRef.current =
          null;

        setLoadingMessages(
          true
        );

        const token =
          getToken();

        if (!token) {
          console.error(
            "Authentication token not found"
          );

          return;
        }

        // =================================================
        // CREATE OR GET CONVERSATION
        // =================================================

        const conversationResponse =
          await fetch(
            `${API_URL}/conversations`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify(
                {
                  participantId,
                }
              ),
            }
          );

        const conversationData =
          await conversationResponse.json();

        if (
          !conversationResponse.ok
        ) {
          throw new Error(
            conversationData.message ||
              "Failed to create conversation"
          );
        }

        const currentConversation =
          conversationData.conversation as Conversation;

        if (
          !currentConversation
        ) {
          throw new Error(
            "Conversation was not returned by server"
          );
        }

        // =================================================
        // SET CONVERSATION
        // =================================================

        setConversation(
          currentConversation
        );

        /*
         * Store the current conversation in the ref.
         *
         * Socket.IO listeners will use this value.
         */

        currentConversationIdRef.current =
          currentConversation._id;

        // =================================================
        // LOAD MESSAGES
        // =================================================

        const messagesResponse =
          await fetch(
            `${API_URL}/conversations/${currentConversation._id}/messages`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const messagesData =
          await messagesResponse.json();

        if (
          !messagesResponse.ok
        ) {
          throw new Error(
            messagesData.message ||
              "Failed to load messages"
          );
        }

        /*
         * Before setting loaded messages, make sure the
         * user hasn't already switched to another
         * conversation while the request was running.
         */

        if (
          currentConversationIdRef.current ===
          currentConversation._id
        ) {
          setMessages(
            messagesData.messages ||
              []
          );
        }

        // =================================================
        // JOIN SOCKET ROOM
        // =================================================

        if (
          socket?.connected
        ) {
          socket.emit(
            "join_conversation",
            {
              conversationId:
                currentConversation._id,
            }
          );
        }

        // =================================================
        // MARK AS READ
        // =================================================

        await fetch(
          `${API_URL}/conversations/${currentConversation._id}/read`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error(
          "Open conversation error:",
          error
        );
      } finally {
        setLoadingMessages(
          false
        );
      }
    };

  // =======================================================
  // SEND MESSAGE
  // =======================================================

  const send = () => {
    if (
      !newMsg.trim() ||
      !conversation ||
      !socket ||
      !socket.connected ||
      sending
    ) {
      return;
    }

    const content =
      newMsg.trim();

    setSending(true);

    socket.emit(
      "send_message",
      {
        conversationId:
          conversation._id,

        content,
      },
      (
        response: SendMessageResponse
      ) => {
        setSending(false);

        if (
          !response?.success
        ) {
          console.error(
            "Send message error:",
            response?.error
          );

          return;
        }

        /*
         * The server sends "new_message".
         *
         * That event adds the message to the UI.
         *
         * Therefore we don't manually add it here.
         */

        setNewMsg("");
      }
    );
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      className="h-full flex overflow-hidden"
      style={{
        height:
          "calc(100vh - 56px)",
      }}
    >
      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <div className="w-72 bg-white border-r border-[#E8E8F0] flex flex-col shrink-0">
        {/* ----------------------------------------------- */}
        {/* HEADER */}
        {/* ----------------------------------------------- */}

        <div className="p-4 border-b border-[#E8E8F0]">
          <h3 className="font-semibold text-[#1A1A2E] mb-3">
            Messages
          </h3>

          {/* SEARCH */}

          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9090A8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E8F0] bg-[#FAFAF7] text-sm text-[#1A1A2E] placeholder:text-[#C0C0D0] focus:outline-none focus:border-[#5B6FD4] transition-all"
            />
          </div>
        </div>

        {/* ----------------------------------------------- */}
        {/* PARTICIPANT LIST */}
        {/* ----------------------------------------------- */}

        <div className="flex-1 overflow-y-auto">
          {loadingParticipants ? (
            <div className="p-6 text-center text-sm text-[#9090A8]">
              Loading participants...
            </div>
          ) : participants.length ===
            0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-[#1A1A2E]">
                No participants found
              </p>

              <p className="text-xs text-[#9090A8] mt-1">
                Try another name or email
              </p>
            </div>
          ) : (
            participants.map(
              (item) => {
                const participant =
                  item.participant;

                const isSelected =
                  selectedParticipantId ===
                  participant._id;

                const lastMessage =
                  item.conversation
                    ?.lastMessage;

                return (
                  <button
                    key={
                      participant._id
                    }
                    onClick={() =>
                      openConversation(
                        participant._id
                      )
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors text-left ${
                      isSelected
                        ? "bg-[#EEF2FF]"
                        : ""
                    }`}
                  >
                    {/* AVATAR */}

                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#5B6FD4] font-semibold text-sm">
                        {getInitials(
                          participant.name
                        )}
                      </div>

                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#3D9E8C] border-2 border-white" />
                    </div>

                    {/* INFORMATION */}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-[#1A1A2E] truncate">
                          {
                            participant.name
                          }
                        </p>

                        {lastMessage && (
                          <span className="text-xs text-[#9090A8] shrink-0 ml-1">
                            {formatTime(
                              lastMessage.createdAt
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#9090A8] truncate">
                        {lastMessage
                          ? lastMessage.content
                          : "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              }
            )
          )}
        </div>
      </div>

      {/* ================================================= */}
      {/* CHAT AREA */}
      {/* ================================================= */}

      <div className="flex-1 flex flex-col bg-[#FAFAF7]">
        {!selectedParticipant ? (
          /* --------------------------------------------- */
          /* NO PARTICIPANT */
          /* --------------------------------------------- */

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                <svg
                  className="w-7 h-7 text-[#9090A8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 3.582-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-[#1A1A2E]">
                Select a participant
              </p>

              <p className="text-xs text-[#9090A8] mt-1">
                Choose a participant to
                start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ------------------------------------------- */}
            {/* CHAT HEADER */}
            {/* ------------------------------------------- */}

            <div className="bg-white border-b border-[#E8E8F0] px-6 py-4 flex items-center gap-4">
              {/* AVATAR */}

              <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#5B6FD4] font-semibold text-sm">
                {getInitials(
                  selectedParticipant
                    .participant
                    .name
                )}
              </div>

              {/* USER INFO */}

              <div>
                <p className="font-semibold text-[#1A1A2E]">
                  {
                    selectedParticipant
                      .participant
                      .name
                  }
                </p>

                <p className="text-xs text-[#9090A8]">
                  {
                    selectedParticipant
                      .participant
                      .email
                  }
                </p>
              </div>

              {/* ROLE */}

              <div className="ml-auto flex gap-2">
                <span className="text-xs bg-[#E6F4F1] text-[#3D9E8C] px-2.5 py-1 rounded-full font-medium">
                  Participant
                </span>
              </div>
            </div>

            {/* ------------------------------------------- */}
            {/* MESSAGES */}
            {/* ------------------------------------------- */}

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="text-center py-16">
                  <p className="text-sm text-[#9090A8]">
                    Loading messages...
                  </p>
                </div>
              ) : messages.length ===
                0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-soft">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03-8-9-8s-9 3.582-9 8z"
                      />
                    </svg>
                  </div>

                  <p className="text-sm font-medium text-[#1A1A2E]">
                    No messages yet
                  </p>

                  <p className="text-xs text-[#9090A8] mt-1">
                    Start a conversation
                    with{" "}
                    {
                      selectedParticipant
                        .participant
                        .name
                    }
                  </p>
                </div>
              ) : (
                messages.map(
                  (msg) => {
                    const isAdmin =
                      msg.sender
                        .role ===
                      "admin";

                    return (
                      <div
                        key={
                          msg._id
                        }
                        className={`flex gap-3 ${
                          isAdmin
                            ? "flex-row-reverse"
                            : ""
                        }`}
                      >
                        {/* AVATAR */}

                        {!isAdmin ? (
                          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#5B6FD4] text-xs font-semibold shrink-0 mt-auto">
                            {getInitials(
                              msg.sender
                                .name
                            )}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto">
                            EA
                          </div>
                        )}

                        {/* MESSAGE */}

                        <div
                          className={`max-w-sm flex flex-col gap-1 ${
                            isAdmin
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isAdmin
                                ? "gradient-primary text-white rounded-tr-sm"
                                : "bg-white text-[#1A1A2E] shadow-soft rounded-tl-sm border border-[#E8E8F0]"
                            }`}
                          >
                            {
                              msg.content
                            }
                          </div>

                          <p className="text-xs text-[#C0C0D0]">
                            {formatTime(
                              msg.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            {/* ------------------------------------------- */}
            {/* MESSAGE INPUT */}
            {/* ------------------------------------------- */}

            <div className="bg-white border-t border-[#E8E8F0] p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={
                    newMsg
                  }
                  onChange={(
                    e
                  ) =>
                    setNewMsg(
                      e.target
                        .value
                    )
                  }
                  onKeyDown={(
                    e
                  ) => {
                    if (
                      e.key ===
                        "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();

                      send();
                    }
                  }}
                  placeholder={`Message ${
                    selectedParticipant
                      .participant
                      .name
                  }...`}
                  disabled={
                    !conversation ||
                    sending
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all disabled:opacity-60"
                />

                <button
                  onClick={
                    send
                  }
                  disabled={
                    !newMsg.trim() ||
                    !conversation ||
                    !socket ||
                    !socket.connected ||
                    sending
                  }
                  className="gradient-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending
                    ? "Sending..."
                    : "Send"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}