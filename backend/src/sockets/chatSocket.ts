import {
  Server,
  Socket,
} from "socket.io";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Conversation from "../models/Conversation";
import Message from "../models/Message";

interface SocketUser {
  userId: string;
  role: "admin" | "participant";
}

interface AuthenticatedSocket
  extends Socket {
  user?: SocketUser;
}

interface JwtPayload {
  userId: string;
  role: "admin" | "participant";
}

interface SendMessageData {
  conversationId: string;
  content: string;
}

interface SendMessageCallback {
  success: boolean;
  message?: any;
  error?: string;
}

export const setupChatSocket = (
  io: Server
) => {
  // =====================================================
  // SOCKET AUTHENTICATION
  // =====================================================

  io.use(
    (
      socket: AuthenticatedSocket,
      next
    ) => {
      try {
        const token =
          socket.handshake.auth?.token;

        if (!token) {
          return next(
            new Error(
              "Authentication required"
            )
          );
        }

        const secret =
          process.env.JWT_SECRET;

        if (!secret) {
          return next(
            new Error(
              "JWT_SECRET is missing"
            )
          );
        }

        const decoded =
          jwt.verify(
            token,
            secret
          ) as JwtPayload;

        if (
          !decoded.userId ||
          !decoded.role
        ) {
          return next(
            new Error(
              "Invalid token payload"
            )
          );
        }

        socket.user = {
          userId: decoded.userId,
          role: decoded.role,
        };

        next();
      } catch (error) {
        console.error(
          "Socket authentication error:",
          error
        );

        next(
          new Error(
            "Invalid authentication token"
          )
        );
      }
    }
  );

  // =====================================================
  // CONNECTION
  // =====================================================

  io.on(
    "connection",
    (
      socket: AuthenticatedSocket
    ) => {
      if (!socket.user) {
        socket.disconnect();
        return;
      }

      const userId =
        socket.user.userId;

      const role =
        socket.user.role;

      console.log(
        `Socket connected: ${userId} (${role})`
      );

      // =================================================
      // PERSONAL USER ROOM
      // =================================================

      socket.join(
        `user:${userId}`
      );

      // =================================================
      // JOIN CONVERSATION
      // =================================================

      socket.on(
        "join_conversation",
        async (
          data: {
            conversationId: string;
          }
        ) => {
          try {
            const conversationId =
              data?.conversationId;

            if (!conversationId) {
              console.error(
                "join_conversation: conversationId missing"
              );
              return;
            }

            if (
              !mongoose.Types.ObjectId.isValid(
                conversationId
              )
            ) {
              console.error(
                "join_conversation: invalid conversation ID"
              );
              return;
            }

            const conversation =
              await Conversation.findById(
                conversationId
              );

            if (!conversation) {
              console.error(
                "Conversation not found:",
                conversationId
              );
              return;
            }

            // -------------------------------------------
            // CHECK USER BELONGS TO CONVERSATION
            // -------------------------------------------

            const isAdmin =
              conversation.admin.toString() ===
              userId;

            const isParticipant =
              conversation.participant.toString() ===
              userId;

            if (
              !isAdmin &&
              !isParticipant
            ) {
              console.error(
                `User ${userId} tried to join unauthorized conversation`
              );

              return;
            }

            const room =
              `conversation:${conversationId}`;

            socket.join(room);

            console.log(
              `User ${userId} joined ${room}`
            );
          } catch (error) {
            console.error(
              "Join conversation error:",
              error
            );
          }
        }
      );

      // =================================================
      // LEAVE CONVERSATION
      // =================================================

      socket.on(
        "leave_conversation",
        (
          data: {
            conversationId: string;
          }
        ) => {
          const conversationId =
            data?.conversationId;

          if (!conversationId) {
            return;
          }

          socket.leave(
            `conversation:${conversationId}`
          );

          console.log(
            `User ${userId} left conversation:${conversationId}`
          );
        }
      );

      // =================================================
      // SEND MESSAGE
      // =================================================

      socket.on(
        "send_message",
        async (
          data: SendMessageData,
          callback?: (
            response: SendMessageCallback
          ) => void
        ) => {
          try {
            const conversationId =
              data?.conversationId;

            const content =
              data?.content?.trim();

            // -------------------------------------------
            // VALIDATION
            // -------------------------------------------

            if (
              !conversationId ||
              !content
            ) {
              callback?.({
                success: false,
                error:
                  "Conversation ID and message are required",
              });

              return;
            }

            if (
              !mongoose.Types.ObjectId.isValid(
                conversationId
              )
            ) {
              callback?.({
                success: false,
                error:
                  "Invalid conversation ID",
              });

              return;
            }

            // -------------------------------------------
            // FIND CONVERSATION
            // -------------------------------------------

            const conversation =
              await Conversation.findById(
                conversationId
              );

            if (!conversation) {
              callback?.({
                success: false,
                error:
                  "Conversation not found",
              });

              return;
            }

            // -------------------------------------------
            // CHECK ACCESS
            // -------------------------------------------

            const isAdmin =
              conversation.admin.toString() ===
              userId;

            const isParticipant =
              conversation.participant.toString() ===
              userId;

            if (
              !isAdmin &&
              !isParticipant
            ) {
              callback?.({
                success: false,
                error:
                  "You are not allowed to send messages in this conversation",
              });

              return;
            }

            // -------------------------------------------
            // SAVE MESSAGE
            // -------------------------------------------

            const message =
              await Message.create({
                conversation:
                  new mongoose.Types.ObjectId(
                    conversationId
                  ),

                sender:
                  new mongoose.Types.ObjectId(
                    userId
                  ),

                content,
              });

            // -------------------------------------------
            // UPDATE CONVERSATION
            // -------------------------------------------

            conversation.lastMessage =
              message._id;

            conversation.lastMessageAt =
              new Date();

            await conversation.save();

            // -------------------------------------------
            // POPULATE MESSAGE
            // -------------------------------------------

            const populatedMessage =
              await Message.findById(
                message._id
              ).populate(
                "sender",
                "name email role"
              );

            if (!populatedMessage) {
              callback?.({
                success: false,
                error:
                  "Failed to load saved message",
              });

              return;
            }

            // -------------------------------------------
            // ROOM
            // -------------------------------------------

            const room =
              `conversation:${conversationId}`;

            console.log(
              `Broadcasting message ${message._id} to ${room}`
            );

            // -------------------------------------------
            // SEND TO BOTH USERS
            // -------------------------------------------

            io.to(room).emit(
              "new_message",
              populatedMessage
            );

            // -------------------------------------------
            // ALSO SEND TO PERSONAL ROOMS
            //
            // This handles the case where one side has
            // not joined the conversation room yet.
            // -------------------------------------------

            const adminId =
              conversation.admin.toString();

            const participantId =
              conversation.participant.toString();

            io.to(
              `user:${adminId}`
            ).emit(
              "new_message",
              populatedMessage
            );

            io.to(
              `user:${participantId}`
            ).emit(
              "new_message",
              populatedMessage
            );

            // -------------------------------------------
            // CONVERSATION UPDATE
            // -------------------------------------------

            const update = {
              conversationId,

              message:
                populatedMessage,

              lastMessage:
                populatedMessage,

              lastMessageAt:
                conversation.lastMessageAt,

              adminId,

              participantId,
            };

            io.to(
              `user:${adminId}`
            ).emit(
              "conversation_updated",
              update
            );

            io.to(
              `user:${participantId}`
            ).emit(
              "conversation_updated",
              update
            );

            // -------------------------------------------
            // ACKNOWLEDGEMENT
            // -------------------------------------------

            callback?.({
              success: true,
              message:
                populatedMessage,
            });

            console.log(
              `Message sent successfully: ${message._id}`
            );
          } catch (error) {
            console.error(
              "Socket send message error:",
              error
            );

            callback?.({
              success: false,
              error:
                "Failed to send message",
            });
          }
        }
      );

      // =================================================
      // TYPING START
      // =================================================

      socket.on(
        "typing_start",
        (
          data: {
            conversationId: string;
          }
        ) => {
          const conversationId =
            data?.conversationId;

          if (!conversationId) {
            return;
          }

          socket
            .to(
              `conversation:${conversationId}`
            )
            .emit(
              "typing_start",
              {
                userId,
              }
            );
        }
      );

      // =================================================
      // TYPING STOP
      // =================================================

      socket.on(
        "typing_stop",
        (
          data: {
            conversationId: string;
          }
        ) => {
          const conversationId =
            data?.conversationId;

          if (!conversationId) {
            return;
          }

          socket
            .to(
              `conversation:${conversationId}`
            )
            .emit(
              "typing_stop",
              {
                userId,
              }
            );
        }
      );

      // =================================================
      // DISCONNECT
      // =================================================

      socket.on(
        "disconnect",
        (reason) => {
          console.log(
            `Socket disconnected: ${userId}`,
            reason
          );
        }
      );
    }
  );
};