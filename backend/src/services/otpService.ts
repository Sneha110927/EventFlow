import crypto from "crypto";
import bcrypt from "bcryptjs";
import OTP from "../models/OTP";
import { sendOTPViaMSG91 } from "./msg91";

export const generateAndStoreOTP = async (
  mobile: string,
  name: string,
  invitationToken: string
): Promise<string> => {

  // Generate secure 6-digit OTP
  const otp = crypto
    .randomInt(100000, 1000000)
    .toString();

  // Hash OTP before storing
  const otpHash = await bcrypt.hash(otp, 10);

  // OTP expires in 5 minutes
  const expiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  // Delete previous OTP
  await OTP.deleteMany({
    invitationToken,
  });

  // Store OTP hash
  await OTP.create({
    mobile,
    otpHash,
    invitationToken,
    name,
    expiresAt,
    attempts: 0,
  });

  // Send OTP through MSG91
  await sendOTPViaMSG91(
    mobile,
    otp
  );

  console.log(
    `📱 OTP sent to ${mobile}`
  );

  return otp;
};