import crypto from "crypto";
import bcrypt from "bcryptjs";

import OTP from "../models/OTP";
import { sendOTPViaEmail } from "./emailService";

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


  const otp =
    crypto
      .randomInt(
        100000,
        1000000
      )
      .toString();


  const otpHash =
    await bcrypt.hash(
      otp,
      10
    );

  const expiresAt =
    new Date(
      Date.now() +
      5 * 60 * 1000
    );

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


  await OTP.create({

    email:
      normalizedEmail,

    otpHash,

    purpose,

    invitationToken,

    expiresAt,

    attempts: 0,
  });


  await sendOTPViaEmail(
    normalizedEmail,
    otp
  );

  console.log(
    `🔐 Email OTP generated for ${normalizedEmail}`
  );
};