import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/User";
import OTP from "../models/OTP";


// ============================================================
// JWT HELPER
// ============================================================

const generateToken = (userId: string, role: "admin" | "participant") => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured in .env");
  }

  return jwt.sign(
    {
      userId,
      role,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};


// ============================================================
// REGISTER
// ============================================================

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const userRole =
      role === "admin"
        ? "admin"
        : "participant";

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      mobile: mobile
        ? mobile.replace(/\D/g, "")
        : undefined,
      password: hashedPassword,
      role: userRole,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      message: "Server error during registration.",
    });
  }
};


// ============================================================
// ADMIN LOGIN
// ============================================================

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // --------------------------------------------------------
    // Participants cannot use normal email/password login
    // --------------------------------------------------------

    if (user.role !== "admin") {
      return res.status(403).json({
        message:
          "Participants must login using their mobile number and OTP.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "This account does not have a password.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(
      user._id.toString(),
      user.role
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Server error during login.",
    });
  }
};


// ============================================================
// PARTICIPANT - SEND OTP
// ============================================================
//
// Used by:
// Participant Portal
//
// IMPORTANT:
// This is different from invitation OTP.
//
// Invitation:
// /api/invitations/:token/send-otp
//
// Participant Portal:
// /api/auth/participant/send-otp
//
// The participant must already exist in the database.
// ============================================================

export const sendParticipantOTP = async (
  req: Request,
  res: Response
) => {
  try {
    const { mobile } = req.body;

    console.log(
      "🔥 PARTICIPANT PORTAL SEND OTP CALLED"
    );

    console.log(
      "📱 Mobile received:",
      mobile
    );

    if (!mobile) {
      return res.status(400).json({
        message:
          "Mobile number is required.",
      });
    }

    const cleanMobile =
      String(mobile).replace(/\D/g, "");

    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        message:
          "Please enter a valid 10-digit mobile number.",
      });
    }

    // --------------------------------------------------------
    // Find existing participant
    // --------------------------------------------------------

    const participant =
      await User.findOne({
        mobile: cleanMobile,
        role: "participant",
      });

    if (!participant) {
      return res.status(404).json({
        message:
          "No participant account is registered with this mobile number. Please use the invitation link first.",
      });
    }

// --------------------------------------------------------
// Generate OTP
// --------------------------------------------------------

const otp = crypto
  .randomInt(100000, 1000000)
  .toString();

console.log(
  `📱 Sending participant OTP via MSG91 to ${cleanMobile}`
);

    // --------------------------------------------------------
    // Hash OTP
    // --------------------------------------------------------

    const otpHash =
      await bcrypt.hash(
        otp,
        10
      );

    // --------------------------------------------------------
    // OTP expires in 5 minutes
    // --------------------------------------------------------

    const expiresAt =
      new Date(
        Date.now() +
        5 * 60 * 1000
      );

    // --------------------------------------------------------
    // We don't have an invitation token here.
    //
    // So create a unique identifier for the portal OTP.
    // --------------------------------------------------------

    const portalToken =
      `portal:${cleanMobile}`;

    // Delete previous OTP
    await OTP.deleteMany({
      invitationToken: portalToken,
    });

    // Store new OTP
    await OTP.create({
      mobile: cleanMobile,
      otpHash,
      invitationToken: portalToken,
      name: participant.name,
      expiresAt,
      attempts: 0,
    });

    // --------------------------------------------------------
// Send OTP through MSG91
// --------------------------------------------------------

const authKey = process.env.MSG91_AUTH_KEY;
const templateId = process.env.MSG91_TEMPLATE_ID;

if (!authKey || !templateId) {
  throw new Error(
    "MSG91_AUTH_KEY or MSG91_TEMPLATE_ID is missing"
  );
}

const mobileWithCountryCode = `91${cleanMobile}`;

const msg91Response = await fetch(
  "https://control.msg91.com/api/v5/flow/",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      authkey: authKey,
    },

    body: JSON.stringify({
      template_id: templateId,

      recipients: [
        {
          mobiles: mobileWithCountryCode,
          OTP: otp,
        },
      ],
    }),
  }
);

const msg91Data = await msg91Response.json();

console.log(
  "MSG91 response:",
  msg91Data
);

if (!msg91Response.ok) {
  console.error(
    "MSG91 failed:",
    msg91Data
  );

  return res.status(500).json({
    message:
      "Unable to send OTP through SMS service.",
  });
}

console.log(
  `📱 Participant OTP SMS request sent to ${cleanMobile}`
);
    return res.status(200).json({
      message:
        "OTP generated successfully.",
    });

  } catch (error) {
    console.error(
      "Participant send OTP error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to generate OTP.",
    });
  }
};


// ============================================================
// PARTICIPANT - VERIFY OTP
// ============================================================

export const verifyParticipantOTP = async (
  req: Request,
  res: Response
) => {
  try {
    const { mobile, otp } = req.body;

    console.log(
      "🔥 PARTICIPANT PORTAL VERIFY OTP CALLED"
    );

    if (!mobile || !otp) {
      return res.status(400).json({
        message:
          "Mobile number and OTP are required.",
      });
    }

    const cleanMobile =
      String(mobile).replace(/\D/g, "");

    const cleanOTP =
      String(otp).trim();

    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        message:
          "Invalid mobile number.",
      });
    }

    if (!/^\d{6}$/.test(cleanOTP)) {
      return res.status(400).json({
        message:
          "OTP must be 6 digits.",
      });
    }

    // --------------------------------------------------------
    // Find participant
    // --------------------------------------------------------

    const participant =
      await User.findOne({
        mobile: cleanMobile,
        role: "participant",
      });

    if (!participant) {
      return res.status(404).json({
        message:
          "Participant account not found.",
      });
    }

    // --------------------------------------------------------
    // Find OTP
    // --------------------------------------------------------

    const portalToken =
      `portal:${cleanMobile}`;

    const otpRecord =
      await OTP.findOne({
        invitationToken: portalToken,
        mobile: cleanMobile,
      });

    if (!otpRecord) {
      return res.status(400).json({
        message:
          "OTP not found or expired. Please request a new OTP.",
      });
    }

    // --------------------------------------------------------
    // Check expiration
    // --------------------------------------------------------

    if (
      otpRecord.expiresAt.getTime() <
      Date.now()
    ) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    // --------------------------------------------------------
    // Check attempts
    // --------------------------------------------------------

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        message:
          "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    // --------------------------------------------------------
    // Compare OTP
    // --------------------------------------------------------

    const isValid =
      await bcrypt.compare(
        cleanOTP,
        otpRecord.otpHash
      );

    if (!isValid) {

      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(401).json({
        message:
          "Invalid OTP.",
      });
    }

    // --------------------------------------------------------
    // OTP is valid
    // --------------------------------------------------------

    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    // --------------------------------------------------------
    // Generate JWT
    // --------------------------------------------------------

    const token =
      generateToken(
        participant._id.toString(),
        "participant"
      );

    console.log(
      `✅ Participant ${participant.name} logged in successfully.`
    );

    return res.status(200).json({
      message:
        "Participant login successful.",

      token,

      user: {
        id: participant._id,
        name: participant.name,
        email: participant.email,
        mobile: participant.mobile,
        role: participant.role,
      },
    });

  } catch (error) {
    console.error(
      "Participant verify OTP error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to verify OTP.",
    });
  }
};


// ============================================================
// FORGOT PASSWORD
// ============================================================

export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message:
          "Email is required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
        role: "admin",
      });

    // Don't reveal whether the account exists
    if (!user) {
      return res.status(200).json({
        message:
          "If an admin account exists with this email, a password reset link has been sent.",
      });
    }

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken =
      resetToken;

    user.resetPasswordExpires =
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    await user.save();

    const emailUser =
      process.env.EMAIL_USER;

    const emailPassword =
      process.env.EMAIL_APP_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.error(
        "Email credentials are missing."
      );

      return res.status(500).json({
        message:
          "Email service is not configured.",
      });
    }

    const transporter =
      nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

    const frontendURL =
      "http://localhost:5173";

    const resetLink =
      `${frontendURL}/?resetToken=${resetToken}`;

    await transporter.sendMail({
      from: emailUser,
      to: user.email,
      subject:
        "EventFlow Password Reset",
      text:
        `Click the following link to reset your password:\n\n${resetLink}\n\nThis link expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>EventFlow Password Reset</h2>

          <p>
            You requested a password reset for your EventFlow admin account.
          </p>

          <p>
            Click the button below:
          </p>

          <p>
            <a
              href="${resetLink}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#5B6FD4;
                color:white;
                text-decoration:none;
                border-radius:8px;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This link expires in 15 minutes.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "If an admin account exists with this email, a password reset link has been sent.",
    });

  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to process password reset request.",
    });
  }
};


// ============================================================
// RESET PASSWORD
// ============================================================

export const resetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { token } =
      req.params;

    const { password } =
      req.body;

    if (!token) {
      return res.status(400).json({
        message:
          "Reset token is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        message:
          "New password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    const user =
      await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: {
          $gt: new Date(),
        },
        role: "admin",
      });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired reset token.",
      });
    }

    user.password =
      await bcrypt.hash(
        password,
        10
      );

    user.resetPasswordToken =
      undefined;

    user.resetPasswordExpires =
      undefined;

    await user.save();

    return res.status(200).json({
      message:
        "Password reset successfully.",
    });

  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to reset password.",
    });
  }
};