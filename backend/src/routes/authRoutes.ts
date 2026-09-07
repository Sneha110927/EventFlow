import { Router } from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,

  // Participant OTP
  sendParticipantOTP,
  verifyParticipantOTP,
} from "../controllers/authController";


const router = Router();


// ============================================================
// ADMIN / GENERAL AUTH
// ============================================================

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPassword
);


// ============================================================
// PARTICIPANT PORTAL OTP
// ============================================================

// Send OTP
router.post(
  "/participant/send-otp",
  sendParticipantOTP
);


// Verify OTP
router.post(
  "/participant/verify-otp",
  verifyParticipantOTP
);


export default router;