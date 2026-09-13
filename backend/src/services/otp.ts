import crypto from "crypto";
import bcrypt from "bcryptjs";

import OTP from "../models/OTP";
import { sendOTPViaEmail } from "./emailService";

// =========================================================
// GENERATE AND STORE EMAIL OTP
// =========================================================

export const generateAndStoreEmailOTP = async (
  email: string,
  purpose:
    | "admin-login"
    | "participant-login",
  invitationToken?: string
): Promise<void> => {

  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  // -------------------------------------------------------
  // Generate secure 6-digit OTP
  // -------------------------------------------------------

  const otp =
    crypto
      .randomInt(
        100000,
        1000000
      )
      .toString();

  // -------------------------------------------------------
  // Hash OTP
  // -------------------------------------------------------

  const otpHash =
    await bcrypt.hash(
      otp,
      10
    );

  // -------------------------------------------------------
  // OTP expires in 5 minutes
  // -------------------------------------------------------

  const expiresAt =
    new Date(
      Date.now() +
      5 * 60 * 1000
    );

  // -------------------------------------------------------
  // Remove previous OTP
  // -------------------------------------------------------

  const deleteFilter =
    purpose === "participant-login" &&
    invitationToken
      ? {
          email:
            normalizedEmail,

          purpose,

          invitationToken,
        }
      : {
          email:
            normalizedEmail,

          purpose,
        };

  await OTP.deleteMany(
    deleteFilter
  );

  // -------------------------------------------------------
  // Store OTP
  // -------------------------------------------------------

  await OTP.create({

    email:
      normalizedEmail,

    otpHash,

    purpose,

    invitationToken,

    expiresAt,

    attempts: 0,
  });

  // -------------------------------------------------------
  // Send OTP email
  // -------------------------------------------------------

  await sendOTPViaEmail(
    normalizedEmail,
    otp
  );

  console.log(
    `🔐 Email OTP generated for ${normalizedEmail}`
  );
};