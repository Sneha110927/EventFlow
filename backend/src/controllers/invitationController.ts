import { Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import OTP from "../models/OTP";
import Invitation from "../models/Invitation";
import Event from "../models/Event";
import User from "../models/User";
import EventParticipant from "../models/EventParticipant";

import { AuthRequest } from "../middleware/authMiddleware";

import { sendInvitationEmail } from "../services/emailService";
import { generateAndStoreEmailOTP } from "../services/otp";

export const createInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can send invitations",
      });
    }

    const { name, email, eventId } = req.body;

    if (!name || !email || !eventId) {
      return res.status(400).json({
        message: "Name, email and event are required",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail.includes("@")) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    const expiresAt = new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    const invitation =
      await Invitation.create({
        name: name.trim(),
        email: normalizedEmail,
        event: eventId,
        invitedBy: req.user.userId,
        status: "pending",
        token,
        expiresAt,
      });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const invitationLink =
      `${frontendUrl}/accept-invitation?token=${token}`;

    await sendInvitationEmail({
      to: invitation.email,
      name: invitation.name,
      eventName: event.name,
      invitationLink,
    });

    return res.status(201).json({
      message: "Invitation sent successfully",
      invitation,
    });
  } catch (error) {
    console.error(
      "Create invitation error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create invitation",
    });
  }
};

export const getInvitations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view invitations",
      });
    }

    const invitations =
      await Invitation.find()
        .populate(
          "event",
          "name type description startDate endDate location venue modules"
        )
        .populate(
          "invitedBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      invitations,
    });
  } catch (error) {
    console.error(
      "Get invitations error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const resendInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can resend invitations",
      });
    }

    const invitationId =
      Array.isArray(req.params.invitationId)
        ? req.params.invitationId[0]
        : req.params.invitationId;

    if (!invitationId) {
      return res.status(400).json({
        message: "Invitation ID is required",
      });
    }

    const invitation =
      await Invitation.findById(
        invitationId
      );

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        message:
          `This invitation cannot be resent because its status is "${invitation.status}".`,
      });
    }

    if (
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

      await invitation.save();

      return res.status(410).json({
        message:
          "This invitation has expired. Please create a new invitation.",
      });
    }

    const event = await Event.findById(
      invitation.event
    );

    if (!event) {
      return res.status(404).json({
        message:
          "Event associated with this invitation was not found",
      });
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const invitationLink =
      `${frontendUrl}/accept-invitation?token=${invitation.token}`;

    await sendInvitationEmail({
      to: invitation.email,
      name: invitation.name,
      eventName: event.name,
      invitationLink,
    });

    return res.status(200).json({
      message:
        "Invitation resent successfully",

      invitation: {
        id: invitation._id,
        email: invitation.email,
        name: invitation.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error(
      "Resend invitation error:",
      error
    );

    return res.status(500).json({
      message: "Failed to resend invitation",
    });
  }
};

export const getInvitationByToken = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const token = Array.isArray(
      req.params.token
    )
      ? req.params.token[0]
      : req.params.token;

    if (!token) {
      return res.status(400).json({
        message:
          "Invitation token is required",
      });
    }

    const invitation =
      await Invitation.findOne({
        token,
      }).populate(
        "event",
        "name type description startDate endDate location venue modules"
      );

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (
      invitation.status === "pending" &&
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

      await invitation.save();
    }

    if (invitation.status === "expired") {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    const invitationData = {
      id: invitation._id,
      _id: invitation._id,
      name: invitation.name,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      event: invitation.event,
    };

    return res.status(200).json({
      invitation: invitationData,

      name: invitation.name,

      email: invitation.email,

      status: invitation.status,

      expiresAt: invitation.expiresAt,

      event: invitation.event,
    });
  } catch (error) {
    console.error(
      "Get invitation error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const sendInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const token = Array.isArray(
      req.params.token
    )
      ? req.params.token[0]
      : req.params.token;

    if (!token) {
      return res.status(400).json({
        message:
          "Invitation token is required",
      });
    }

    const invitation =
      await Invitation.findOne({
        token,
      });

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (
      invitation.status !== "expired" &&
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

      await invitation.save();
    }

    if (invitation.status === "expired") {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    const email =
      invitation.email
        ?.trim()
        .toLowerCase();

    if (
      !email ||
      !email.includes("@")
    ) {
      return res.status(400).json({
        message:
          "This invitation does not contain a valid email address.",
      });
    }

    await OTP.deleteMany({
      email,
      purpose: "participant-login",
      invitationToken: token,
    });

    await generateAndStoreEmailOTP(
      email,
      "participant-login",
      token
    );

    return res.status(200).json({
      message:
        "OTP sent to your email address.",
      email,
      expiresIn: 300,
    });
  } catch (error) {
    console.error(
      "Send invitation OTP error:",
      error
    );

    return res.status(500).json({
      message: "Failed to send OTP.",
    });
  }
};

export const verifyInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const token = Array.isArray(
      req.params.token
    )
      ? req.params.token[0]
      : req.params.token;

    const otp =
      req.body.otp
        ?.toString()
        .trim();

    if (!token) {
      return res.status(400).json({
        message:
          "Invitation token is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "OTP must be 6 digits",
      });
    }

    const invitation =
      await Invitation.findOne({
        token,
      });

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (
      invitation.status !== "expired" &&
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

      await invitation.save();
    }

    if (invitation.status === "expired") {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    const email =
      invitation.email
        ?.trim()
        .toLowerCase();

    if (
      !email ||
      !email.includes("@")
    ) {
      return res.status(400).json({
        message:
          "This invitation does not contain a valid email address.",
      });
    }

    const otpRecord =
      await OTP.findOne({
        email,
        purpose: "participant-login",
        invitationToken: token,
      }).sort({
        createdAt: -1,
      });

    if (!otpRecord) {
      return res.status(400).json({
        message:
          "OTP not found or expired. Please request a new OTP.",
      });
    }

    if (
      otpRecord.expiresAt < new Date()
    ) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    const isValidOTP =
      await bcrypt.compare(
        otp,
        otpRecord.otpHash
      );

    if (!isValidOTP) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({
        message: "Invalid OTP",

        attemptsRemaining:
          5 - otpRecord.attempts,
      });
    }

    let user = await User.findOne({
      email,
    });

    if (!user) {
      user = await User.create({
        name: invitation.name,
        email,
        role: "participant",
      });
    } else if (
      user.role !== "participant"
    ) {
      return res.status(409).json({
        message:
          "An account with this email already exists with a different role. Please contact the event administrator.",
      });
    } else {
      if (
        invitation.name &&
        user.name !== invitation.name
      ) {
        user.name = invitation.name;

        await user.save();
      }
    }

    let eventParticipant =
      await EventParticipant.findOne({
        event: invitation.event,
        user: user._id,
      });

    if (!eventParticipant) {
      eventParticipant =
        await EventParticipant.create({
          event: invitation.event,
          user: user._id,
          status: "accepted",
          registrationCompleted: false,
          joinedAt: new Date(),
        });
    } else if (
      eventParticipant.status !== "accepted"
    ) {
      eventParticipant.status = "accepted";

      eventParticipant.joinedAt =
        eventParticipant.joinedAt ||
        new Date();

      await eventParticipant.save();
    }

    if (
      invitation.status !== "accepted"
    ) {
      invitation.status = "accepted";

      await invitation.save();
    }

    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not defined in .env"
      );
    }

    const jwtToken = jwt.sign(
      {
        userId: user._id.toString(),
        role: "participant",
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const event =
      await Event.findById(
        invitation.event
      );

    return res.status(200).json({
      message:
        "OTP verified successfully. Login successful.",

      token: jwtToken,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },

      event,
    });
  } catch (error) {
    console.error(
      "Verify invitation OTP error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can remove participants",
      });
    }

    const invitationId =
      Array.isArray(
        req.params.invitationId
      )
        ? req.params.invitationId[0]
        : req.params.invitationId;

    if (!invitationId) {
      return res.status(400).json({
        message:
          "Invitation ID is required",
      });
    }

    const invitation =
      await Invitation.findById(
        invitationId
      );

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    const eventId =
      invitation.event;

    const participant =
      await User.findOne({
        email: invitation.email,
        role: "participant",
      });

    if (participant) {
      await EventParticipant.deleteOne({
        event: eventId,
        user: participant._id,
      });
    }

    await OTP.deleteMany({
      invitationToken:
        invitation.token,
    });

    const invitationResult =
      await Invitation.deleteOne({
        _id: invitation._id,
      });

    return res.status(200).json({
      message:
        "Participant removed successfully",

      invitationDeleted:
        invitationResult.deletedCount,

      participantRemoved:
        Boolean(participant),
    });
  } catch (error) {
    console.error(
      "Delete invitation/participant error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const acceptInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  return res.status(410).json({
    message:
      "Password-based invitation acceptance is no longer supported. Please use email OTP verification.",
  });
};