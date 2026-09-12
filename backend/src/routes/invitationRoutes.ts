import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  createInvitation,
  getInvitations,
  getInvitationByToken,
  acceptInvitation,
  sendInvitationOTP,
  verifyInvitationOTP,
  deleteInvitation,
} from "../controllers/invitationController";

const router = Router();

// =========================================================
// ADMIN ROUTES
// =========================================================

// ---------------------------------------------------------
// CREATE INVITATION
// ---------------------------------------------------------

router.post(
  "/",
  authMiddleware,
  createInvitation
);

// ---------------------------------------------------------
// GET ALL INVITATIONS
// ---------------------------------------------------------

router.get(
  "/",
  authMiddleware,
  getInvitations
);

// ---------------------------------------------------------
// DELETE INVITATION / REMOVE PARTICIPANT
// ---------------------------------------------------------
//
// DELETE:
// /api/invitations/:invitationId
//
// ---------------------------------------------------------

router.delete(
  "/:invitationId",
  authMiddleware,
  deleteInvitation
);

// =========================================================
// PUBLIC INVITATION ROUTES
// =========================================================

// ---------------------------------------------------------
// GET INVITATION DETAILS
// ---------------------------------------------------------

router.get(
  "/accept/:token",
  getInvitationByToken
);

// ---------------------------------------------------------
// OLD PASSWORD-BASED ACCEPT ROUTE
// ---------------------------------------------------------

router.post(
  "/accept/:token",
  acceptInvitation
);

// =========================================================
// OTP AUTHENTICATION ROUTES
// =========================================================

// ---------------------------------------------------------
// SEND OTP
// ---------------------------------------------------------

router.post(
  "/:token/send-otp",
  sendInvitationOTP
);

// ---------------------------------------------------------
// VERIFY OTP
// ---------------------------------------------------------

router.post(
  "/:token/verify-otp",
  verifyInvitationOTP
);

export default router;