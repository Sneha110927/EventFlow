
import crypto from "crypto";
import bcrypt from "bcryptjs";
import OTP from "../models/OTP";

export const generateAndStoreOTP = async (
  mobile: string,
  name: string,
  invitationToken: string
): Promise<string> => {
  // Generate a secure 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Hash OTP before storing it
  const otpHash = await bcrypt.hash(otp, 10);

  // OTP expires in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Remove any previous OTP for this invitation
  await OTP.deleteMany({
    invitationToken,
  });

  // Store the new OTP
  await OTP.create({
    mobile,
    otpHash,
    invitationToken,
    name,
    expiresAt,
    attempts: 0,
  });

  // Development only:
  // We will replace this with real SMS sending later.
  console.log(`🔐 OTP for ${mobile}: ${otp}`);

  return otp;
};