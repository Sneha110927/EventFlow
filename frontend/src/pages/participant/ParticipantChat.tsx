import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  io,
  Socket,
} from "socket.io-client";

const API_URL =
  "http://localhost:5000";

interface ParticipantChatProps {
  participantId: string;
  participantName: string;
}

interface Sender {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "participant";
}

interface Message {
  _id: string;
  conversation: string;
  sender: Sender;
  content: string;
  readAt?: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  admin: Sender;
  participant: Sender;
  lastMessage?: Message;
  lastMessageAt?: string;
}

interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

export default function ParticipantChat({
  participantId,
  participantName,
}: ParticipantChatProps) {
  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [newMsg, setNewMsg] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [typing, setTyping] =
    useState(false);

  const [socketConnected, setSocketConnected] =
    useState(false);

  const socketRef =
    useRef<Socket | null>(null);

  const conversationRef =
    useRef<Conversation | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  // =========================================================
  // Keep conversation ref updated
  // =========================================================

  useEffect(() => {
    conversationRef.current =
      conversation;
  }, [conversation]);

  // =========================================================
  // Scroll to latest message
  // =========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================================================
  // Add message without duplicates
  // =========================================================

  const addMessage = (
    message: Message
  ) => {
    setMessages((previous) => {
      if (
        previous.some(
          (item) =>
            item._id === message._id
        )
      ) {
        return previous;
      }

      return [
        ...previous,
        message,
      ];
    });
  };

  // =========================================================
  // Load messages
  // =========================================================

  const loadMessages = async (
    conversationId: string,
    token: string
  ) => {
    const response =
      await fetch(
        `${API_URL}/api/chat/conversations/${conversationId}/messages`,
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
          "Failed to load messages"
      );
    }

    setMessages(
      data.messages || []
    );
  };

  // =========================================================
  // Load or create conversation
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          throw new Error(
            "You are not logged in"
          );
        }

        // ---------------------------------------------------
        // Get existing conversations
        // ---------------------------------------------------

        const response =
          await fetch(
            `${API_URL}/api/chat/conversations`,
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
              "Failed to load conversations"
          );
        }

        const conversations:
          Conversation[] =
          data.conversations ||
          [];

        let current =
          conversations.find(
            (item) =>
              item.participant?._id ===
              participantId
          );

        // ---------------------------------------------------
        // If conversation does not exist,
        // create/get one automatically.
        // ---------------------------------------------------

        if (!current) {
          const createResponse =
            await fetch(
              `${API_URL}/api/chat/conversations`,
              {
                method: "POST",
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({}),
              }
            );

          const createData =
            await createResponse.json();

          if (!createResponse.ok) {
            throw new Error(
              createData.message ||
                "Failed to create conversation"
            );
          }

          current =
            createData.conversation;
        }

        if (cancelled) {
          return;
        }

        if (current) {
          setConversation(
            current
          );

          conversationRef.current =
            current;

          await loadMessages(
            current._id,
            token
          );
        }
      } catch (error) {
        console.error(
          "Participant chat error:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [participantId]);

  // =========================================================
  // Socket connection
  // =========================================================

  useEffect(() => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      return;
    }

    const socket =
      io(API_URL, {
        auth: {
          token,
        },
      });

    socketRef.current =
      socket;

    // -------------------------------------------------------
    // CONNECT
    // -------------------------------------------------------

    socket.on(
      "connect",
      () => {
        console.log(
          "Participant Socket.IO connected:",
          socket.id
        );

        setSocketConnected(
          true
        );

        const current =
          conversationRef.current;

        if (current) {
          console.log(
            "Participant joining conversation:",
            current._id
          );

          socket.emit(
            "join_conversation",
            {
              conversationId:
                current._id,
            }
          );
        }
      }
    );

    // -------------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------------

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "Participant Socket.IO disconnected:",
          reason
        );

        setSocketConnected(
          false
        );
      }
    );

    // -------------------------------------------------------
    // NEW MESSAGE
    // -------------------------------------------------------

    socket.on(
      "new_message",
      (
        message: Message
      ) => {
        console.log(
          "Participant received message:",
          message
        );

        const current =
          conversationRef.current;

        if (
          !current ||
          message.conversation !==
            current._id
        ) {
          return;
        }

        addMessage(
          message
        );
      }
    );

    // -------------------------------------------------------
    // TYPING START
    // -------------------------------------------------------

    socket.on(
      "typing_start",
      (
        data: {
          userId: string;
        }
      ) => {
        if (
          data?.userId !==
          participantId
        ) {
          setTyping(true);
        }
      }
    );

    // -------------------------------------------------------
    // TYPING STOP
    // -------------------------------------------------------

    socket.on(
      "typing_stop",
      (
        data: {
          userId: string;
        }
      ) => {
        if (
          data?.userId !==
          participantId
        ) {
          setTyping(false);
        }
      }
    );

    // -------------------------------------------------------
    // SOCKET ERROR
    // -------------------------------------------------------

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Participant Socket.IO connection error:",
          error.message
        );
      }
    );

    socket.on(
      "chat_error",
      (data) => {
        console.error(
          "Participant chat error:",
          data?.message
        );
      }
    );

    // -------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }
    };
  }, [participantId]);

  // =========================================================
  // Join conversation whenever conversation becomes ready
  // =========================================================

  useEffect(() => {
    const socket =
      socketRef.current;

    if (
      !socket ||
      !socket.connected ||
      !conversation
    ) {
      return;
    }

    console.log(
      "Participant joining conversation:",
      conversation._id
    );

    socket.emit(
      "join_conversation",
      {
        conversationId:
          conversation._id,
      }
    );
  }, [conversation]);

  // =========================================================
  // Send message
  // =========================================================

  const sendMessage = () => {
    const content =
      newMsg.trim();

    const current =
      conversation;

    const socket =
      socketRef.current;

    if (
      !content ||
      !current ||
      !socket ||
      !socket.connected
    ) {
      console.error(
        "Cannot send message:",
        {
          hasContent:
            !!content,
          hasConversation:
            !!current,
          hasSocket:
            !!socket,
          socketConnected:
            socket?.connected,
        }
      );

      return;
    }

    setSending(true);

    socket.emit(
      "send_message",
      {
        conversationId:
          current._id,

        content,
      },
      (
        response: SendMessageResponse
      ) => {
        setSending(false);

        if (!response?.success) {
          console.error(
            "Message send failed:",
            response?.error
          );

          return;
        }

        console.log(
          "Participant message sent:",
          response.message
        );

        setNewMsg("");

        socket.emit(
          "typing_stop",
          {
            conversationId:
              current._id,
          }
        );
      }
    );
  };

  // =========================================================
  // Typing
  // =========================================================

  const handleTyping = (
    value: string
  ) => {
    setNewMsg(value);

    const current =
      conversation;

    const socket =
      socketRef.current;

    if (
      !current ||
      !socket ||
      !socket.connected
    ) {
      return;
    }

    if (value.trim()) {
      socket.emit(
        "typing_start",
        {
          conversationId:
            current._id,
        }
      );
    } else {
      socket.emit(
        "typing_stop",
        {
          conversationId:
            current._id,
        }
      );
    }
  };

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft h-[480px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#5B6FD4] rounded-full animate-spin mx-auto mb-3" />

          <p className="text-sm text-[#9090A8]">
            Loading chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden flex flex-col"
      style={{
        height: "480px",
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="px-5 py-4 border-b border-[#E8E8F0] flex items-center gap-3">

        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
          EA
        </div>

        <div>
          <p className="text-sm font-semibold text-[#1A1A2E]">
            Event Admin
          </p>

          <p
            className={`text-xs flex items-center gap-1 ${
              socketConnected
                ? "text-[#3D9E8C]"
                : "text-[#D95B5B]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                socketConnected
                  ? "bg-[#3D9E8C]"
                  : "bg-[#D95B5B]"
              }`}
            />

            {socketConnected
              ? "Online"
              : "Connecting..."}
          </p>
        </div>

      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {!conversation && (
          <div className="text-center py-12">

            <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mx-auto mb-3">
              💬
            </div>

            <p className="text-sm font-medium text-[#1A1A2E]">
              Unable to start conversation
            </p>

            <p className="text-xs text-[#9090A8] mt-1">
              Please try refreshing the page.
            </p>

          </div>
        )}

        {conversation &&
          messages.length === 0 && (
            <div className="text-center py-12 text-sm text-[#9090A8]">
              No messages yet. Say hello!
            </div>
          )}

        {messages.map(
          (message) => {
            const isMine =
              message.sender?._id ===
              participantId;

            return (
              <div
                key={message._id}
                className={`flex gap-3 ${
                  isMine
                    ? "flex-row-reverse"
                    : ""
                }`}
              >

                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto">
                  {isMine
                    ? participantName
                        .charAt(0)
                        .toUpperCase()
                    : "EA"}
                </div>

                <div
                  className={`max-w-xs flex flex-col gap-1 ${
                    isMine
                      ? "items-end"
                      : "items-start"
                  }`}
                >

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? "gradient-primary text-white rounded-tr-sm"
                        : "bg-[#F3F2EC] text-[#1A1A2E] rounded-tl-sm"
                    }`}
                  >
                    {message.content}
                  </div>

                  <p className="text-xs text-[#C0C0D0]">
                    {new Date(
                      message.createdAt
                    ).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>

                </div>

              </div>
            )
          }
        )}

        {typing && (
          <p className="text-xs text-[#9090A8]">
            Event Admin is typing...
          </p>
        )}

        <div
          ref={messagesEndRef}
        />

      </div>

      {/* =====================================================
          INPUT
      ====================================================== */}

      <div className="p-4 border-t border-[#E8E8F0]">

        <div className="flex gap-3">

          <input
            type="text"
            value={newMsg}
            onChange={(e) =>
              handleTyping(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              socketConnected
                ? "Type a message..."
                : "Connecting..."
            }
            disabled={
              !conversation ||
              !socketConnected ||
              sending
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10 transition-all disabled:opacity-50"
          />

          <button
            onClick={
              sendMessage
            }
            disabled={
              !newMsg.trim() ||
              !conversation ||
              !socketConnected ||
              sending
            }
            className="gradient-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : "Send"}
          </button>

        </div>

      </div>

    </div>
  );
}