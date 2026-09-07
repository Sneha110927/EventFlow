
import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  createInvitation,
  getInvitations,
  getInvitationByToken,
  acceptInvitation,
  sendInvitationOTP,
  verifyInvitationOTP,
} from "../controllers/invitationController";

const router = Router();

// ===============================
// Admin routes
// ===============================

router.post("/", authMiddleware, createInvitation);

router.get("/", authMiddleware, getInvitations);

// ===============================
// Public invitation routes
// ===============================

// Get invitation details
router.get(
  "/accept/:token",
  getInvitationByToken
);

// Old password-based invitation acceptance
router.post(
  "/accept/:token",
  acceptInvitation
);

// ===============================
// OTP authentication routes
// ===============================

// Send OTP to participant's mobile
router.post(
  "/:token/send-otp",
  sendInvitationOTP
);

// Verify OTP and create/login participant
router.post(
  "/:token/verify-otp",
  verifyInvitationOTP
);

export default router;
