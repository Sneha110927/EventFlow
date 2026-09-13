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

// =========================================================
// CREATE INVITATION
// =========================================================

export const createInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    // -------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    // -------------------------------------------------------
    // ADMIN CHECK
    // -------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can send invitations",
      });
    }

    // -------------------------------------------------------
    // REQUEST DATA
    // -------------------------------------------------------

    const {
      name,
      email,
      eventId,
    } = req.body;

    if (
      !name ||
      !email ||
      !eventId
    ) {
      return res.status(400).json({
        message:
          "Name, email and event are required",
      });
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // -------------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------------

    if (
      !normalizedEmail.includes("@")
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid email address",
      });
    }

    // -------------------------------------------------------
    // FIND EVENT
    // -------------------------------------------------------

    const event =
      await Event.findById(
        eventId
      );

    if (!event) {
      return res.status(404).json({
        message:
          "Event not found",
      });
    }

    // -------------------------------------------------------
    // GENERATE INVITATION TOKEN
    // -------------------------------------------------------

    const token =
      crypto
        .randomBytes(32)
        .toString("hex");

    // -------------------------------------------------------
    // EXPIRATION
    // 7 DAYS
    // -------------------------------------------------------

    const expiresAt =
      new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
      );

    // -------------------------------------------------------
    // CREATE INVITATION
    // -------------------------------------------------------

    const invitation =
      await Invitation.create({

        name:
          name.trim(),

        email:
          normalizedEmail,

        event:
          eventId,

        invitedBy:
          req.user.userId,

        status:
          "pending",

        token,

        expiresAt,
      });

    // -------------------------------------------------------
    // CREATE PARTICIPANT INVITATION LINK
    // -------------------------------------------------------

    const invitationLink =
      `http://localhost:5173/accept-invitation?token=${token}`;

    console.log(
      "📨 Invitation created:",
      {
        id:
          invitation._id,

        email:
          invitation.email,

        name:
          invitation.name,

        event:
          event.name,
      }
    );

    // -------------------------------------------------------
    // SEND EMAIL
    // -------------------------------------------------------

    await sendInvitationEmail({

      to:
        invitation.email,

      name:
        invitation.name,

      eventName:
        event.name,

      invitationLink,
    });

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return res.status(201).json({

      message:
        "Invitation sent successfully",

      invitation,
    });

  } catch (error) {

    console.error(
      "Create invitation error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create invitation",
    });
  }
};

// =========================================================
// GET ALL INVITATIONS
// =========================================================

export const getInvitations = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only admins can view invitations",
      });
    }

    const invitations =
      await Invitation.find()
        .populate(
          "event",
          "name type"
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
      message:
        "Server error",
    });
  }
};

// =========================================================
// GET INVITATION BY TOKEN
// =========================================================

export const getInvitationByToken = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const token =
      Array.isArray(
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
        "name type description startDate endDate location"
      );

    if (!invitation) {
      return res.status(404).json({
        message:
          "Invitation not found",
      });
    }

    // -------------------------------------------------------
    // CHECK EXPIRATION
    // -------------------------------------------------------

    if (
      invitation.status === "pending" &&
      invitation.expiresAt <
        new Date()
    ) {

      invitation.status =
        "expired";

      await invitation.save();
    }

    if (
      invitation.status === "expired"
    ) {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    // -------------------------------------------------------
    // IMPORTANT:
    // Do NOT reject accepted invitations here if you want
    // participants to be able to return later.
    // -------------------------------------------------------

    return res.status(200).json({

      invitation: {

        id:
          invitation._id,

        name:
          invitation.name,

        email:
          invitation.email,

        status:
          invitation.status,

        expiresAt:
          invitation.expiresAt,

        event:
          invitation.event,
      },
    });

  } catch (error) {

    console.error(
      "Get invitation error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",
    });
  }
};

// =========================================================
// SEND EMAIL OTP FOR INVITATION
// =========================================================

export const sendInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const token =
      Array.isArray(
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

    // -------------------------------------------------------
    // FIND INVITATION
    // -------------------------------------------------------

    const invitation =
      await Invitation.findOne({
        token,
      });

    if (!invitation) {
      return res.status(404).json({
        message:
          "Invitation not found",
      });
    }

    // -------------------------------------------------------
    // CHECK EXPIRATION
    // -------------------------------------------------------

    if (
      invitation.status !==
        "expired" &&
      invitation.expiresAt <
        new Date()
    ) {

      invitation.status =
        "expired";

      await invitation.save();
    }

    if (
      invitation.status ===
      "expired"
    ) {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    // -------------------------------------------------------
    // GET EMAIL FROM INVITATION
    // -------------------------------------------------------

    const email =
      invitation.email
        .trim()
        .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message:
          "No email address is associated with this invitation.",
      });
    }

    // -------------------------------------------------------
    // GENERATE OTP
    // -------------------------------------------------------

    await generateAndStoreEmailOTP(
      email,
      "participant-login",
      token
    );

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return res.status(200).json({

      message:
        "OTP sent to your email address.",

      email,

      expiresIn:
        300,
    });

  } catch (error) {

    console.error(
      "Send invitation OTP error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to send OTP.",
    });
  }
};

// =========================================================
// VERIFY INVITATION EMAIL OTP
// =========================================================

export const verifyInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const token =
      Array.isArray(
        req.params.token
      )
        ? req.params.token[0]
        : req.params.token;

    const otp =
      req.body.otp
        ?.toString()
        .trim();

    // -------------------------------------------------------
    // VALIDATE TOKEN
    // -------------------------------------------------------

    if (!token) {
      return res.status(400).json({
        message:
          "Invitation token is required",
      });
    }

    // -------------------------------------------------------
    // VALIDATE OTP
    // -------------------------------------------------------

    if (!otp) {
      return res.status(400).json({
        message:
          "OTP is required",
      });
    }

    if (
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        message:
          "OTP must be 6 digits",
      });
    }

    // -------------------------------------------------------
    // FIND INVITATION
    // -------------------------------------------------------

    const invitation =
      await Invitation.findOne({
        token,
      });

    if (!invitation) {
      return res.status(404).json({
        message:
          "Invitation not found",
      });
    }

    // -------------------------------------------------------
    // CHECK EXPIRATION
    // -------------------------------------------------------

    if (
      invitation.status !==
        "expired" &&
      invitation.expiresAt <
        new Date()
    ) {

      invitation.status =
        "expired";

      await invitation.save();
    }

    if (
      invitation.status ===
      "expired"
    ) {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    // -------------------------------------------------------
    // EMAIL FROM INVITATION
    // -------------------------------------------------------

    const email =
      invitation.email
        .trim()
        .toLowerCase();

    // -------------------------------------------------------
    // FIND OTP
    // -------------------------------------------------------

    const otpRecord =
      await OTP.findOne({

        email,

        purpose:
          "participant-login",

        invitationToken:
          token,

      }).sort({
        createdAt: -1,
      });

    if (!otpRecord) {
      return res.status(400).json({
        message:
          "OTP not found or expired. Please request a new OTP.",
      });
    }

    // -------------------------------------------------------
    // CHECK OTP EXPIRATION
    // -------------------------------------------------------

    if (
      otpRecord.expiresAt <
      new Date()
    ) {

      await OTP.deleteOne({
        _id:
          otpRecord._id,
      });

      return res.status(400).json({
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    // -------------------------------------------------------
    // MAX ATTEMPTS
    // -------------------------------------------------------

    if (
      otpRecord.attempts >= 5
    ) {

      await OTP.deleteOne({
        _id:
          otpRecord._id,
      });

      return res.status(429).json({
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // -------------------------------------------------------
    // VERIFY OTP
    // -------------------------------------------------------

    const isValidOTP =
      await bcrypt.compare(
        otp,
        otpRecord.otpHash
      );

    if (!isValidOTP) {

      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({

        message:
          "Invalid OTP",

        attemptsRemaining:
          5 -
          otpRecord.attempts,
      });
    }

    // -------------------------------------------------------
    // OTP VALID
    // -------------------------------------------------------

    await OTP.deleteOne({
      _id:
        otpRecord._id,
    });

    // -------------------------------------------------------
    // FIND OR CREATE PARTICIPANT
    // -------------------------------------------------------

    let user =
      await User.findOne({

        email,

        role:
          "participant",

      });

    if (!user) {

      user =
        await User.create({

          name:
            invitation.name,

          email,

          role:
            "participant",
        });

    } else {

      // Update name if necessary
      if (
        invitation.name &&
        user.name !==
          invitation.name
      ) {

        user.name =
          invitation.name;

        await user.save();
      }
    }

    // -------------------------------------------------------
    // EVENT PARTICIPANT
    // -------------------------------------------------------

    let eventParticipant =
      await EventParticipant.findOne({

        event:
          invitation.event,

        user:
          user._id,
      });

    if (!eventParticipant) {

      eventParticipant =
        await EventParticipant.create({

          event:
            invitation.event,

          user:
            user._id,

          status:
            "accepted",

          registrationCompleted:
            false,

          joinedAt:
            new Date(),
        });

    }

    // -------------------------------------------------------
    // MARK INVITATION ACCEPTED
    // -------------------------------------------------------

    if (
      invitation.status !==
      "accepted"
    ) {

      invitation.status =
        "accepted";

      await invitation.save();
    }

    // -------------------------------------------------------
    // JWT
    // -------------------------------------------------------

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not defined in .env"
      );
    }

    const jwtToken =
      jwt.sign(

        {
          userId:
            user._id.toString(),

          role:
            "participant",
        },

        jwtSecret,

        {
          expiresIn:
            "7d",
        }
      );

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return res.status(200).json({

      message:
        "OTP verified successfully. Login successful.",

      token:
        jwtToken,

      user: {

        id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,
      },
    });

  } catch (error) {

    console.error(
      "Verify invitation OTP error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",
    });
  }
};

// =========================================================
// DELETE INVITATION / REMOVE PARTICIPANT
// =========================================================

export const deleteInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    // -------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    // -------------------------------------------------------
    // ADMIN CHECK
    // -------------------------------------------------------

    if (
      req.user.role !==
      "admin"
    ) {
      return res.status(403).json({
        message:
          "Only admins can remove participants",
      });
    }

    // -------------------------------------------------------
    // GET INVITATION ID
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // FIND INVITATION
    // -------------------------------------------------------

    const invitation =
      await Invitation.findById(
        invitationId
      );

    if (!invitation) {
      return res.status(404).json({
        message:
          "Invitation not found",
      });
    }

    // -------------------------------------------------------
    // EVENT
    // -------------------------------------------------------

    const eventId =
      invitation.event;

    // -------------------------------------------------------
    // FIND PARTICIPANT
    // -------------------------------------------------------

    const participant =
      await User.findOne({

        email:
          invitation.email,

        role:
          "participant",
      });

    // -------------------------------------------------------
    // REMOVE PARTICIPANT FROM EVENT
    // -------------------------------------------------------

    if (participant) {

      const result =
        await EventParticipant.deleteOne({

          event:
            eventId,

          user:
            participant._id,
        });

      console.log(
        "EventParticipant removed:",
        result.deletedCount
      );
    }

    // -------------------------------------------------------
    // DELETE OTP RECORDS
    // -------------------------------------------------------

    const otpResult =
      await OTP.deleteMany({

        invitationToken:
          invitation.token,
      });

    console.log(
      "OTP records removed:",
      otpResult.deletedCount
    );

    // -------------------------------------------------------
    // DELETE INVITATION
    // -------------------------------------------------------

    const invitationResult =
      await Invitation.deleteOne({

        _id:
          invitation._id,
      });

    console.log(
      "Invitation removed:",
      invitationResult.deletedCount
    );

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return res.status(200).json({

      message:
        "Participant removed successfully",

      invitationDeleted:
        invitationResult.deletedCount,

      participantRemoved:
        participant
          ? true
          : false,
    });

  } catch (error) {

    console.error(
      "Delete invitation/participant error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",
    });
  }
};

// =========================================================
// ACCEPT INVITATION
// =========================================================
//
// Old password-based acceptance is removed.
// Participant now uses email OTP.
// =========================================================

export const acceptInvitation = async (
  req: AuthRequest,
  res: Response
) => {

  return res.status(410).json({

    message:
      "Password-based invitation acceptance is no longer supported. Please use email OTP verification.",
  });
};