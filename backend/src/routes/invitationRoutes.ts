import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  createInvitation,
  getInvitations,
  getInvitationByToken,
  acceptInvitation,
} from "../controllers/invitationController";

const router = Router();

// Admin routes
router.post("/", authMiddleware, createInvitation);
router.get("/", authMiddleware, getInvitations);

// Public invitation routes
router.get(
  "/accept/:token",
  getInvitationByToken
);

router.post(
  "/accept/:token",
  acceptInvitation
);

export default router;