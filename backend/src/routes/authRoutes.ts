import { Router } from "express";

import {
  register,
  registerAdmin,
  sendAdminLoginOTP,
  verifyAdminLoginOTP,
  sendParticipantLoginOTP,
  verifyParticipantLoginOTP,
} from "../controllers/authController";

const router = Router();

router.post(
  "/register",
  register
);

router.post(
  "/admin/register",
  registerAdmin
);

router.post(
  "/admin/send-otp",
  sendAdminLoginOTP
);

router.post(
  "/admin/verify-otp",
  verifyAdminLoginOTP
);

router.post(
  "/participant/send-otp",
  sendParticipantLoginOTP
);

router.post(
  "/participant/verify-otp",
  verifyParticipantLoginOTP
);

export default router;