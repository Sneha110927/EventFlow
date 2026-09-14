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


router.post(
  "/",
  authMiddleware,
  createInvitation
);

router.get(
  "/",
  authMiddleware,
  getInvitations
);

router.delete(
  "/:invitationId",
  authMiddleware,
  deleteInvitation
);

// PUBLIC INVITATION ROUTES
// =========================================================

// ---------------------------------------------------------
// GET INVITATION DETAILS
// ---------------------------------------------------------

router.get(
  "/accept/:token",
  getInvitationByToken
);-

router.post(
  "/accept/:token",
  acceptInvitation
);

router.post(
  "/:token/send-otp",
  sendInvitationOTP
);

router.post(
  "/:token/verify-otp",
  verifyInvitationOTP
);

export default router;