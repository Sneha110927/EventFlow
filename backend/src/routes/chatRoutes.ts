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

router.get(
  "/participants",
  authMiddleware,
  getChatParticipants
);

router.get(
  "/conversations",
  authMiddleware,
  getMyConversations
);

router.post(
  "/conversations",
  authMiddleware,
  createConversation
);

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


router.patch(
  "/conversations/:conversationId/read",
  authMiddleware,
  markMessagesRead
);

export default router;