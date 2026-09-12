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

// =========================================================
// CREATE INVITATION
// =========================================================

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

    const {
      name,
      email,
      eventId,
    } = req.body;

    if (!name || !email || !eventId) {
      return res.status(400).json({
        message: "Name, email and event are required",
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

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    const invitation =
      await Invitation.create({
        name: name.trim(),

        email: email
          .trim()
          .toLowerCase(),

        event: eventId,

        invitedBy: req.user.userId,

        status: "pending",

        token,

        expiresAt,
      });

    const invitationLink =
      `http://localhost:5173/accept-invitation?token=${token}`;

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
      message: "Server error",
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
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
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
      message: "Server error",
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
      Array.isArray(req.params.token)
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

    if (
      invitation.status === "pending" &&
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

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

    if (
      invitation.status === "accepted"
    ) {
      return res.status(409).json({
        message:
          "This invitation has already been accepted",
      });
    }

    return res.status(200).json({
      invitation: {
        id: invitation._id,

        name: invitation.name,

        email: invitation.email,

        mobile: invitation.mobile
          ? `******${invitation.mobile.slice(-4)}`
          : undefined,

        status: invitation.status,

        expiresAt: invitation.expiresAt,

        event: invitation.event,
      },
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

// =========================================================
// SEND OTP FOR INVITATION
// =========================================================

export const sendInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const token =
      Array.isArray(req.params.token)
        ? req.params.token[0]
        : req.params.token;

    const {
      mobile,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        message:
          "Invitation token is required",
      });
    }

    if (!mobile) {
      return res.status(400).json({
        message:
          "Mobile number is required",
      });
    }

    const cleanMobile =
      mobile
        .toString()
        .replace(/\D/g, "");

    if (
      cleanMobile.length !== 10
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid 10-digit mobile number",
      });
    }

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

    if (
      invitation.status === "accepted"
    ) {
      return res.status(409).json({
        message:
          "This invitation has already been accepted",
      });
    }

    if (
      invitation.status === "expired"
    ) {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    if (
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

      await invitation.save();

      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    invitation.mobile =
      cleanMobile;

    await invitation.save();

    const otp =
      crypto.randomInt(
        100000,
        1000000
      ).toString();

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

    await OTP.deleteMany({
      invitationToken: token,
    });

    await OTP.create({
      mobile: cleanMobile,

      otpHash,

      invitationToken: token,

      name: invitation.name,

      expiresAt,

      attempts: 0,
    });

    console.log(
      `🔐 OTP for ${cleanMobile}: ${otp}`
    );

    return res.status(200).json({
      message:
        "OTP sent successfully",

      expiresIn: 300,

      mobile:
        `******${cleanMobile.slice(-4)}`,
    });

  } catch (error) {
    console.error(
      "Send invitation OTP error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// VERIFY INVITATION OTP
// =========================================================

export const verifyInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const token =
      Array.isArray(req.params.token)
        ? req.params.token[0]
        : req.params.token;

    const {
      otp,
    } = req.body;

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

    if (!invitation.mobile) {
      return res.status(400).json({
        message:
          "Mobile number not found. Please enter your mobile number first.",
      });
    }

    if (
      invitation.status === "accepted"
    ) {
      return res.status(409).json({
        message:
          "This invitation has already been accepted",
      });
    }

    if (
      invitation.status === "expired"
    ) {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    if (
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

      await invitation.save();

      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    const otpRecord =
      await OTP.findOne({
        invitationToken: token,
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

    const isValidOTP =
      await bcrypt.compare(
        otp.toString(),
        otpRecord.otpHash
      );

    if (!isValidOTP) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({
        message: "Invalid OTP",

        attemptsRemaining:
          5 -
          otpRecord.attempts,
      });
    }

    // =======================================================
    // OTP VALID
    // =======================================================

    let user =
      await User.findOne({
        email: invitation.email,
      });

    if (user) {
      user.mobile =
        invitation.mobile;

      await user.save();

    } else {
      user =
        await User.create({
          name: invitation.name,

          email: invitation.email,

          mobile: invitation.mobile,

          role: "participant",
        });
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

          registrationCompleted:
            false,

          joinedAt: new Date(),
        });
    }

    invitation.status =
      "accepted";

    await invitation.save();

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

    const jwtToken =
      jwt.sign(
        {
          userId:
            user._id.toString(),

          role:
            user.role,
        },

        jwtSecret,

        {
          expiresIn: "7d",
        }
      );

    return res.status(200).json({
      message:
        "OTP verified successfully. Login successful.",

      token: jwtToken,

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
      "Verify invitation OTP error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// DELETE INVITATION / REMOVE PARTICIPANT
// =========================================================
//
// ADMIN ACTION
//
// This performs the actual MongoDB deletion.
//
// 1. Find invitation
// 2. Find participant account
// 3. Remove participant from THIS event
// 4. Delete OTP
// 5. Delete invitation
//
// IMPORTANT:
// The User account is NOT deleted.
//
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

    if (req.user.role !== "admin") {
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
    // SAVE EVENT ID
    // -------------------------------------------------------

    const eventId =
      invitation.event;

    // -------------------------------------------------------
    // FIND PARTICIPANT USER
    // -------------------------------------------------------

    const participant =
      await User.findOne({
        email:
          invitation.email,

        role:
          "participant",
      });

    // -------------------------------------------------------
    // REMOVE PARTICIPANT FROM THIS EVENT
    // -------------------------------------------------------

    if (participant) {
      const result =
        await EventParticipant.deleteOne({
          event: eventId,

          user: participant._id,
        });

      console.log(
        "EventParticipant removed:",
        result.deletedCount
      );
    }

    // -------------------------------------------------------
    // DELETE RELATED OTP RECORDS
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
        participant ? true : false,
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
// LEGACY PASSWORD-BASED FLOW
// =========================================================

export const acceptInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  return res.status(410).json({
    message:
      "Password-based invitation acceptance is no longer supported. Please use mobile OTP verification.",
  });
};