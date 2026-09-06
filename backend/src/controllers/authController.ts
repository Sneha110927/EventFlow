import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User";

// =========================================================
// REGISTER
// =========================================================

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role:
        role === "admin"
          ? "admin"
          : "participant",
    });

    return res.status(201).json({
      message:
        "User registered successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// LOGIN
// =========================================================

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
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_SECRET is not defined"
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      secret,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// FORGOT PASSWORD
// =========================================================

export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message:
          "Email address is required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(404).json({
        message:
          "No account found with this email",
      });
    }

    // Generate a random reset token
    const resetToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    // Store only the hashed token
    // in MongoDB
    const hashedToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // Token expires after 15 minutes
    const resetTokenExpiry =
      new Date(
        Date.now() +
          15 * 60 * 1000
      );

    user.resetPasswordToken =
      hashedToken;

    user.resetPasswordExpires =
      resetTokenExpiry;

    await user.save();

    // Development reset link.
    // Later we will send this through email.
    const resetLink =
      `http://localhost:5173/reset-password?resetToken=${resetToken}`;

    console.log(
      "Password reset link:",
      resetLink
    );

    return res.status(200).json({
      message:
        "Password reset link generated",

      resetLink,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// RESET PASSWORD
// =========================================================

export const resetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    // Express/TypeScript may treat route parameters
    // as string | string[], so make sure we have
    // a single string.
    const tokenParam = req.params.token;

    const token = Array.isArray(tokenParam)
      ? tokenParam[0]
      : tokenParam;

    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        message:
          "Reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message:
          "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    // Hash the token received from
    // the reset URL
    const hashedToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // Find the user with:
    // 1. Matching reset token
    // 2. Token that has not expired
    const user =
      await User.findOne({
        resetPasswordToken:
          hashedToken,

        resetPasswordExpires: {
          $gt: new Date(),
        },
      });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired reset token",
      });
    }

    // Hash the new password
    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // Update password
    user.password =
      hashedPassword;

    // Remove reset token so it
    // cannot be used again
    user.resetPasswordToken =
      undefined;

    user.resetPasswordExpires =
      undefined;

    await user.save();

    return res.status(200).json({
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};