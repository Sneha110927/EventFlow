import { Router } from "express";

import {
  register,
  sendAdminLoginOTP,
  verifyAdminLoginOTP,
  sendParticipantLoginOTP,
  verifyParticipantLoginOTP,
} from "../controllers/authController";

const router = Router();

// ============================================================
// GENERAL AUTH
// ============================================================

// Register
router.post(
  "/register",
  register
);

// ============================================================
// ADMIN EMAIL OTP LOGIN
// ============================================================

// Send OTP to admin email
router.post(
  "/admin/send-otp",
  sendAdminLoginOTP
);

// Verify admin email OTP
router.post(
  "/admin/verify-otp",
  verifyAdminLoginOTP
);

// ============================================================
// PARTICIPANT EMAIL OTP LOGIN
// ============================================================

// Normal participant login from EventFlow main page
//
// POST /api/auth/participant/send-otp
//
// Body:
// {
//   "email": "participant@gmail.com"
// }

router.post(
  "/participant/send-otp",
  sendParticipantLoginOTP
);

// Verify participant OTP
//
// POST /api/auth/participant/verify-otp
//
// Body:
// {
//   "email": "participant@gmail.com",
//   "otp": "123456"
// }

router.post(
  "/participant/verify-otp",
  verifyParticipantLoginOTP
);

export default router;