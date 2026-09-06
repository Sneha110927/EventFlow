import { Response } from "express";
import mongoose from "mongoose";

import Conversation from "../models/Conversation";
import Message from "../models/Message";
import User from "../models/User";
import EventParticipant from "../models/EventParticipant";

import { AuthRequest } from "../middleware/authMiddleware";

// =========================================================
// HELPER - GET PARAMETER AS STRING
// =========================================================

const getParamString = (
  value: string | string[] | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

// =========================================================
// GET CHAT PARTICIPANTS - ADMIN
// =========================================================

export const getChatParticipants = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can access chat participants",
      });
    }

    // =====================================================
    // SEARCH
    // =====================================================

    const search =
      typeof req.query.search ===
      "string"
        ? req.query.search.trim()
        : "";

    // =====================================================
    // GET EVENT PARTICIPANTS
    // =====================================================

    const eventParticipants =
      await EventParticipant.find()
        .populate(
          "user",
          "name email role"
        )
        .populate(
          "event",
          "name type"
        )
        .sort({
          createdAt: -1,
        });

    // =====================================================
    // FILTER SEARCH
    // =====================================================

    const filtered =
      eventParticipants.filter(
        (item) => {
          const user =
            item.user as any;

          if (!user) {
            return false;
          }

          if (!search) {
            return true;
          }

          const name =
            user.name
              ?.toLowerCase() || "";

          const email =
            user.email
              ?.toLowerCase() || "";

          return (
            name.includes(
              search.toLowerCase()
            ) ||
            email.includes(
              search.toLowerCase()
            )
          );
        }
      );

    // =====================================================
    // REMOVE DUPLICATE USERS
    // =====================================================

    const uniqueParticipants =
      new Map<string, any>();

    for (const item of filtered) {
      const user =
        item.user as any;

      if (!user) {
        continue;
      }

      const userId =
        user._id.toString();

      if (
        !uniqueParticipants.has(
          userId
        )
      ) {
        uniqueParticipants.set(
          userId,
          item
        );
      }
    }

    // =====================================================
    // BUILD RESULT
    // =====================================================

    const result: Array<{
      participant: any;
      event: any;
      conversation: any;
    }> = [];

    for (
      const item of uniqueParticipants.values()
    ) {
      const user =
        item.user as any;

      const conversation =
        await Conversation.findOne({
          admin: req.user.userId,
          participant: user._id,
        }).populate(
          "lastMessage"
        );

      result.push({
        participant: user,
        event: item.event,
        conversation,
      });
    }

    return res.status(200).json({
      participants: result,
    });
  } catch (error) {
    console.error(
      "Get chat participants error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load chat participants",
    });
  }
};

// =========================================================
// GET MY CONVERSATIONS
// =========================================================

export const getMyConversations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const filter =
      req.user.role === "admin"
        ? {
            admin: req.user.userId,
          }
        : {
            participant: req.user.userId,
          };

    const conversations =
      await Conversation.find(filter)
        .populate(
          "admin",
          "name email role"
        )
        .populate(
          "participant",
          "name email role"
        )
        .populate(
          "lastMessage"
        )
        .sort({
          lastMessageAt: -1,
          updatedAt: -1,
        });

    return res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      message: "Failed to load conversations",
    });
  }
};

// =========================================================
// CREATE OR GET CONVERSATION - ADMIN
// =========================================================
export const createConversation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const {
      participantId,
      adminId,
    } = req.body;

    // =====================================================
    // ADMIN CREATES/GETS CONVERSATION
    // =====================================================

    if (
      req.user.role === "admin"
    ) {
      if (!participantId) {
        return res.status(400).json({
          message:
            "Participant ID is required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          participantId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid participant ID",
        });
      }

      const participant =
        await User.findById(
          participantId
        );

      if (!participant) {
        return res.status(404).json({
          message:
            "Participant not found",
        });
      }

      if (
        participant.role !==
        "participant"
      ) {
        return res.status(400).json({
          message:
            "Selected user is not a participant",
        });
      }

      let conversation =
        await Conversation.findOne({
          admin:
            req.user.userId,
          participant:
            participantId,
        });

      if (!conversation) {
        conversation =
          await Conversation.create({
            admin:
              new mongoose.Types.ObjectId(
                req.user.userId
              ),

            participant:
              new mongoose.Types.ObjectId(
                participantId
              ),
          });
      }

      const populated =
        await Conversation.findById(
          conversation._id
        )
          .populate(
            "admin",
            "name email role"
          )
          .populate(
            "participant",
            "name email role"
          )
          .populate(
            "lastMessage"
          );

      return res.status(200).json({
        conversation:
          populated,
      });
    }

    // =====================================================
    // PARTICIPANT CREATES/GETS CONVERSATION
    // =====================================================

    if (
      req.user.role ===
      "participant"
    ) {
      let selectedAdminId =
        adminId;

      // ---------------------------------------------------
      // If participant did not provide admin ID,
      // use the first admin.
      // ---------------------------------------------------

      if (!selectedAdminId) {
        const admin =
          await User.findOne({
            role: "admin",
          });

        if (!admin) {
          return res.status(404).json({
            message:
              "No admin is available for chat",
          });
        }

        selectedAdminId =
          admin._id.toString();
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          selectedAdminId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid admin ID",
        });
      }

      const admin =
        await User.findById(
          selectedAdminId
        );

      if (!admin) {
        return res.status(404).json({
          message:
            "Admin not found",
        });
      }

      if (
        admin.role !== "admin"
      ) {
        return res.status(400).json({
          message:
            "Selected user is not an admin",
        });
      }

      let conversation =
        await Conversation.findOne({
          admin:
            selectedAdminId,

          participant:
            req.user.userId,
        });

      if (!conversation) {
        conversation =
          await Conversation.create({
            admin:
              new mongoose.Types.ObjectId(
                selectedAdminId
              ),

            participant:
              new mongoose.Types.ObjectId(
                req.user.userId
              ),
          });
      }

      const populated =
        await Conversation.findById(
          conversation._id
        )
          .populate(
            "admin",
            "name email role"
          )
          .populate(
            "participant",
            "name email role"
          )
          .populate(
            "lastMessage"
          );

      return res.status(200).json({
        conversation:
          populated,
      });
    }

    return res.status(403).json({
      message:
        "Invalid user role",
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create conversation",
    });
  }
};

// =========================================================
// GET MESSAGES
// =========================================================

export const getMessages = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Fix:
    // string | string[] -> string
    const conversationId =
      getParamString(
        req.params.conversationId
      );

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    // Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(
        conversationId
      )
    ) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isAdmin =
      conversation.admin.toString() ===
      req.user.userId;

    const isParticipant =
      conversation.participant.toString() ===
      req.user.userId;

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({
        message:
          "You are not allowed to access this conversation",
      });
    }

    const messages =
      await Message.find({
        conversation:
          new mongoose.Types.ObjectId(
            conversationId
          ),
      })
        .populate(
          "sender",
          "name email role"
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      message: "Failed to load messages",
    });
  }
};

// =========================================================
// SEND MESSAGE - REST FALLBACK
// =========================================================

export const sendMessage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Fix:
    // string | string[] -> string
    const conversationId =
      getParamString(
        req.params.conversationId
      );

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    // Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(
        conversationId
      )
    ) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isAdmin =
      conversation.admin.toString() ===
      req.user.userId;

    const isParticipant =
      conversation.participant.toString() ===
      req.user.userId;

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({
        message:
          "You are not allowed to send messages in this conversation",
      });
    }

    // IMPORTANT:
    // Convert conversationId string to ObjectId
    const message =
      await Message.create({
        conversation:
          new mongoose.Types.ObjectId(
            conversationId
          ),

        sender:
          new mongoose.Types.ObjectId(
            req.user.userId
          ),

        content:
          content.trim(),
      });

    conversation.lastMessage =
      message._id;

    conversation.lastMessageAt =
      new Date();

    await conversation.save();

    const populated =
      await Message.findById(
        message._id
      ).populate(
        "sender",
        "name email role"
      );

    return res.status(201).json({
      message: populated,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    return res.status(500).json({
      message: "Failed to send message",
    });
  }
};

// =========================================================
// MARK MESSAGES AS READ
// =========================================================

export const markMessagesRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Fix:
    // string | string[] -> string
    const conversationId =
      getParamString(
        req.params.conversationId
      );

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    // Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(
        conversationId
      )
    ) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isParticipant =
      conversation.participant.toString() ===
      req.user.userId;

    const isAdmin =
      conversation.admin.toString() ===
      req.user.userId;

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({
        message:
          "You are not allowed to access this conversation",
      });
    }

    await Message.updateMany(
      {
        conversation:
          new mongoose.Types.ObjectId(
            conversationId
          ),

        sender: {
          $ne: new mongoose.Types.ObjectId(
            req.user.userId
          ),
        },

        readAt: {
          $exists: false,
        },
      },
      {
        $set: {
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error(
      "Mark messages read error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to mark messages as read",
    });
  }
};