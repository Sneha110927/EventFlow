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

const generateToken = (
  userId: string,
  role: "admin" | "participant"
) => {
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
// EMAIL TRANSPORTER
// ============================================================

const createEmailTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error(
      "EMAIL_USER or EMAIL_APP_PASSWORD is not configured in .env"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
};

// ============================================================
// SEND OTP EMAIL
// ============================================================

const sendOTPEmail = async (
  email: string,
  otp: string
) => {
  const transporter = createEmailTransporter();

  const emailUser = process.env.EMAIL_USER;

  await transporter.sendMail({
    from: `"EventFlow" <${emailUser}>`,
    to: email,
    subject: "Your EventFlow Verification OTP",

    text: `
Your EventFlow verification OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

If you did not request this OTP, you can safely ignore this email.
`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          color: #1A1A2E;
        "
      >

        <h2 style="margin-bottom: 10px;">
          EventFlow
        </h2>

        <p>
          Your verification OTP is:
        </p>

        <div
          style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            background: #EEF2FF;
            color: #5B6FD4;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
          "
        >
          ${otp}
        </div>

        <p>
          This OTP is valid for
          <strong>5 minutes</strong>.
        </p>

        <p>
          Do not share this OTP with anyone.
        </p>

        <p
          style="
            color: #9090A8;
            font-size: 13px;
          "
        >
          If you did not request this OTP,
          you can safely ignore this email.
        </p>

      </div>
    `,
  });
};

// ============================================================
// REGISTER USER
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

    // --------------------------------------------------------
    // Validate required fields
    // --------------------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    // --------------------------------------------------------
    // Normalize email
    // --------------------------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // Check existing user
    // --------------------------------------------------------

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "User with this email already exists.",
      });
    }

    // --------------------------------------------------------
    // Hash password
    // --------------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // --------------------------------------------------------
    // Determine role
    // --------------------------------------------------------

    const userRole =
      role === "admin"
        ? "admin"
        : "participant";

    // --------------------------------------------------------
    // Create user
    // --------------------------------------------------------

    const user =
      await User.create({
        name: name.trim(),

        email: normalizedEmail,

        mobile: mobile
          ? mobile.replace(/\D/g, "")
          : undefined,


        role: userRole,
      });

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(201).json({
      message:
        "User registered successfully.",

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
      message:
        "Server error during registration.",
    });
  }
};

// ============================================================
// ADMIN - SEND EMAIL OTP
// ============================================================

export const sendAdminLoginOTP =
  async (
    req: Request,
    res: Response
  ) => {

    try {
      // ------------------------------------------------------
      // Get email
      // ------------------------------------------------------

      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          message:
            "Email address is required.",
        });
      }

      // ------------------------------------------------------
      // Find admin
      // ------------------------------------------------------

      const admin =
        await User.findOne({
          email,
          role: "admin",
        });

      if (!admin) {
        return res.status(401).json({
          message:
            "No admin account found with this email address.",
        });
      }

      // ------------------------------------------------------
      // Generate secure 6-digit OTP
      // ------------------------------------------------------

      const otp =
        crypto
          .randomInt(
            100000,
            1000000
          )
          .toString();

      // ------------------------------------------------------
      // Hash OTP
      // ------------------------------------------------------

      const otpHash =
        await bcrypt.hash(
          otp,
          10
        );

      // ------------------------------------------------------
      // OTP expires after 5 minutes
      // ------------------------------------------------------

      const expiresAt =
        new Date(
          Date.now() +
            5 * 60 * 1000
        );

      // ------------------------------------------------------
      // Delete previous admin OTP
      // ------------------------------------------------------

      await OTP.deleteMany({
        email,
        purpose:
          "admin-login",
      });

      // ------------------------------------------------------
      // Store OTP
      // ------------------------------------------------------

      await OTP.create({
        email,

        otpHash,

        purpose:
          "admin-login",

        expiresAt,

        attempts: 0,
      });

      // ------------------------------------------------------
      // Send OTP through Gmail
      // ------------------------------------------------------

      await sendOTPEmail(
        email,
        otp
      );

      console.log(
        `📧 Admin login OTP sent to ${email}`
      );

      // ------------------------------------------------------
      // Response
      // ------------------------------------------------------

      return res.status(200).json({
        message:
          "OTP has been sent to your email address.",
      });

    } catch (error) {

      console.error(
        "Send admin OTP error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to send OTP. Please try again.",
      });
    }
  };

// ============================================================
// ADMIN - VERIFY EMAIL OTP
// ============================================================

export const verifyAdminLoginOTP =
  async (
    req: Request,
    res: Response
  ) => {

    try {
      // ------------------------------------------------------
      // Get email and OTP
      // ------------------------------------------------------

      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      const otp =
        req.body.otp
          ?.trim();

      // ------------------------------------------------------
      // Validate input
      // ------------------------------------------------------

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required.",
        });
      }

      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          message:
            "OTP must be 6 digits.",
        });
      }

      // ------------------------------------------------------
      // Find admin
      // ------------------------------------------------------

      const admin =
        await User.findOne({
          email,
          role: "admin",
        });

      if (!admin) {
        return res.status(401).json({
          message:
            "Admin account not found.",
        });
      }

      // ------------------------------------------------------
      // Find latest OTP
      // ------------------------------------------------------

      const otpRecord =
        await OTP.findOne({
          email,
          purpose:
            "admin-login",
        }).sort({
          createdAt: -1,
        });

      if (!otpRecord) {
        return res.status(400).json({
          message:
            "OTP not found. Please request a new OTP.",
        });
      }

      // ------------------------------------------------------
      // Check expiry
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // Check maximum attempts
      // ------------------------------------------------------

      if (
        otpRecord.attempts >= 5
      ) {

        await OTP.deleteOne({
          _id: otpRecord._id,
        });

        return res.status(429).json({
          message:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      // ------------------------------------------------------
      // Compare OTP
      // ------------------------------------------------------

      const isValid =
        await bcrypt.compare(
          otp,
          otpRecord.otpHash
        );

      // ------------------------------------------------------
      // Invalid OTP
      // ------------------------------------------------------

      if (!isValid) {

        otpRecord.attempts += 1;

        await otpRecord.save();

        return res.status(401).json({
          message:
            "Invalid OTP.",
        });
      }

      // ------------------------------------------------------
      // OTP is valid
      // ------------------------------------------------------

      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      // ------------------------------------------------------
      // Generate JWT
      // ------------------------------------------------------

      const token =
        generateToken(
          admin._id.toString(),
          "admin"
        );

      console.log(
        `✅ Admin ${admin.email} logged in successfully.`
      );

      // ------------------------------------------------------
      // Response
      // ------------------------------------------------------

      return res.status(200).json({
        message:
          "Admin login successful.",

        token,

        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
        },
      });

    } catch (error) {

      console.error(
        "Verify admin OTP error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to verify OTP.",
      });
    }
  };

  // ============================================================
// PARTICIPANT - SEND EMAIL OTP
// ============================================================

export const sendParticipantLoginOTP =
  async (
    req: Request,
    res: Response
  ) => {

    try {
      // ------------------------------------------------------
      // Get email
      // ------------------------------------------------------

      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          message:
            "Email address is required.",
        });
      }

      // ------------------------------------------------------
      // Find participant
      // ------------------------------------------------------

      const participant =
        await User.findOne({
          email,
          role: "participant",
        });

      if (!participant) {
        return res.status(404).json({
          message:
            "No participant account found with this email address.",
        });
      }

      // ------------------------------------------------------
      // Generate secure 6-digit OTP
      // ------------------------------------------------------

      const otp =
        crypto
          .randomInt(
            100000,
            1000000
          )
          .toString();

      // ------------------------------------------------------
      // Hash OTP
      // ------------------------------------------------------

      const otpHash =
        await bcrypt.hash(
          otp,
          10
        );

      // ------------------------------------------------------
      // OTP expires after 5 minutes
      // ------------------------------------------------------

      const expiresAt =
        new Date(
          Date.now() +
            5 * 60 * 1000
        );

      // ------------------------------------------------------
      // Delete previous participant OTP
      // ------------------------------------------------------

      await OTP.deleteMany({
        email,
        purpose:
          "participant-login",
      });

      // ------------------------------------------------------
      // Store OTP
      // ------------------------------------------------------

      await OTP.create({
        email,

        otpHash,

        purpose:
          "participant-login",

        expiresAt,

        attempts: 0,
      });

      // ------------------------------------------------------
      // Send OTP through Gmail
      // ------------------------------------------------------

      await sendOTPEmail(
        email,
        otp
      );

      console.log(
        `📧 Participant login OTP sent to ${email}`
      );

      // ------------------------------------------------------
      // Response
      // ------------------------------------------------------

      return res.status(200).json({
        message:
          "OTP has been sent to your email address.",
      });

    } catch (error) {

      console.error(
        "Send participant OTP error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to send OTP. Please try again.",
      });
    }
  };

  // ============================================================
// PARTICIPANT - VERIFY EMAIL OTP
// ============================================================

export const verifyParticipantLoginOTP =
  async (
    req: Request,
    res: Response
  ) => {

    try {
      // ------------------------------------------------------
      // Get email and OTP
      // ------------------------------------------------------

      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      const otp =
        req.body.otp
          ?.trim();

      // ------------------------------------------------------
      // Validate input
      // ------------------------------------------------------

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required.",
        });
      }

      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          message:
            "OTP must be 6 digits.",
        });
      }

      // ------------------------------------------------------
      // Find participant
      // ------------------------------------------------------

      const participant =
        await User.findOne({
          email,
          role: "participant",
        });

      if (!participant) {
        return res.status(404).json({
          message:
            "Participant account not found.",
        });
      }

      // ------------------------------------------------------
      // Find latest participant OTP
      // ------------------------------------------------------

      const otpRecord =
        await OTP.findOne({
          email,
          purpose:
            "participant-login",
        }).sort({
          createdAt: -1,
        });

      if (!otpRecord) {
        return res.status(400).json({
          message:
            "OTP not found. Please request a new OTP.",
        });
      }

      // ------------------------------------------------------
      // Check expiry
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // Check maximum attempts
      // ------------------------------------------------------

      if (
        otpRecord.attempts >= 5
      ) {

        await OTP.deleteOne({
          _id: otpRecord._id,
        });

        return res.status(429).json({
          message:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      // ------------------------------------------------------
      // Compare OTP
      // ------------------------------------------------------

      const isValid =
        await bcrypt.compare(
          otp,
          otpRecord.otpHash
        );

      // ------------------------------------------------------
      // Invalid OTP
      // ------------------------------------------------------

      if (!isValid) {

        otpRecord.attempts += 1;

        await otpRecord.save();

        return res.status(401).json({
          message:
            "Invalid OTP.",
        });
      }

      // ------------------------------------------------------
      // OTP is valid
      // ------------------------------------------------------

      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      // ------------------------------------------------------
      // Generate JWT
      // ------------------------------------------------------

      const token =
        generateToken(
          participant._id.toString(),
          "participant"
        );

      console.log(
        `✅ Participant ${participant.email} logged in successfully.`
      );

      // ------------------------------------------------------
      // Response
      // ------------------------------------------------------

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
        "Verify participant OTP error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to verify OTP.",
      });
    }
  };