import { Router } from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

const router = Router();

// Register
router.post(
  "/register",
  register
);

// Login
router.post(
  "/login",
  login
);

// Forgot password
router.post(
  "/forgot-password",
  forgotPassword
);

// Reset password
router.post(
  "/reset-password/:token",
  resetPassword
);

export default router;