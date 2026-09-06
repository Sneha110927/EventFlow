import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  getChatParticipants,
  getMyConversations,
  createConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
} from "../controllers/chatController";

const router = Router();

// Admin participant list
router.get(
  "/participants",
  authMiddleware,
  getChatParticipants
);

// Conversations
router.get(
  "/conversations",
  authMiddleware,
  getMyConversations
);

// Create/find conversation
router.post(
  "/conversations",
  authMiddleware,
  createConversation
);

// Messages
router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  getMessages
);

router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  sendMessage
);

// Read
router.patch(
  "/conversations/:conversationId/read",
  authMiddleware,
  markMessagesRead
);

export default router;