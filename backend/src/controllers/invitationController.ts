
import { Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import OTP from "../models/OTP";
import Invitation from "../models/Invitation";
import Event from "../models/Event";
import User from "../models/User";
import EventParticipant from "../models/EventParticipant";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendInvitationEmail } from "../services/emailService";
import jwt from "jsonwebtoken";

// =========================================================
// CREATE INVITATION
// =========================================================
// ADMIN PROVIDES:
// name + email + event
//
// MOBILE IS NOT REQUIRED HERE.
//
// Participant will provide mobile later when opening
// the invitation link.
// =========================================================

export const createInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // -------------------------------------------------------
    // CHECK AUTHENTICATION
    // -------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // -------------------------------------------------------
    // CHECK ADMIN
    // -------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can send invitations",
      });
    }

    // -------------------------------------------------------
    // GET REQUEST DATA
    // -------------------------------------------------------

    const {
      name,
      email,
      eventId,
    } = req.body;

    // -------------------------------------------------------
    // CHECK REQUIRED FIELDS
    // -------------------------------------------------------

    if (!name || !email || !eventId) {
      return res.status(400).json({
        message:
          "Name, email and event are required",
      });
    }

    // -------------------------------------------------------
    // FIND EVENT
    // -------------------------------------------------------

    const event =
      await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
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
    // INVITATION EXPIRES AFTER 7 DAYS
    // -------------------------------------------------------

    const expiresAt =
      new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    // -------------------------------------------------------
    // CREATE INVITATION
    // -------------------------------------------------------
    // MOBILE IS NOT SAVED YET.
    // It will be saved when participant enters it.
    // -------------------------------------------------------

    const invitation =
      await Invitation.create({
        name:
          name.trim(),

        email:
          email
            .trim()
            .toLowerCase(),

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
    // CREATE INVITATION LINK
    // -------------------------------------------------------

    const invitationLink =
      `http://localhost:5173/accept-invitation?token=${token}`;

    // -------------------------------------------------------
    // SEND INVITATION EMAIL
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
    // SUCCESS RESPONSE
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
    // -------------------------------------------------------
    // CHECK AUTHENTICATION
    // -------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // -------------------------------------------------------
    // CHECK ADMIN
    // -------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can view invitations",
      });
    }

    // -------------------------------------------------------
    // GET INVITATIONS
    // -------------------------------------------------------

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
// This is called when participant opens:
//
// /accept-invitation?token=XXXXX
//
// Mobile may or may not exist yet.
// =========================================================

export const getInvitationByToken = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // -------------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------------

    const token =
      Array.isArray(req.params.token)
        ? req.params.token[0]
        : req.params.token;

    // -------------------------------------------------------
    // CHECK TOKEN
    // -------------------------------------------------------

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
      }).populate(
        "event",
        "name type description startDate endDate location"
      );

    // -------------------------------------------------------
    // CHECK INVITATION
    // -------------------------------------------------------

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
      invitation.expiresAt < new Date()
    ) {
      invitation.status =
        "expired";

      await invitation.save();
    }

    // -------------------------------------------------------
    // CHECK STATUS
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // RETURN INVITATION
    // -------------------------------------------------------

    return res.status(200).json({
      invitation: {
        id:
          invitation._id,

        name:
          invitation.name,

        email:
          invitation.email,

        // ---------------------------------------------------
        // MOBILE
        // ---------------------------------------------------
        // If participant has already entered mobile,
        // return only the last 4 digits.
        //
        // Otherwise mobile will be undefined.
        // ---------------------------------------------------

        mobile:
          invitation.mobile
            ? `******${invitation.mobile.slice(-4)}`
            : undefined,

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
      message: "Server error",
    });
  }
};

// =========================================================
// SEND OTP FOR INVITATION
// =========================================================
// PARTICIPANT ENTERS MOBILE HERE.
//
// Request:
//
// POST /api/invitations/:token/send-otp
//
// Body:
//
// {
//   "mobile": "9876543210"
// }
//
// The mobile is saved to the Invitation document.
// =========================================================

export const sendInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // -------------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------------

    const token =
      Array.isArray(req.params.token)
        ? req.params.token[0]
        : req.params.token;

    // -------------------------------------------------------
    // GET MOBILE FROM PARTICIPANT
    // -------------------------------------------------------

    const {
      mobile,
    } = req.body;

    // -------------------------------------------------------
    // CHECK TOKEN
    // -------------------------------------------------------

    if (!token) {
      return res.status(400).json({
        message:
          "Invitation token is required",
      });
    }

    // -------------------------------------------------------
    // CHECK MOBILE
    // -------------------------------------------------------

    if (!mobile) {
      return res.status(400).json({
        message:
          "Mobile number is required",
      });
    }

    // -------------------------------------------------------
    // CLEAN MOBILE
    // -------------------------------------------------------

    const cleanMobile =
      mobile
        .toString()
        .replace(/\D/g, "");

    // -------------------------------------------------------
    // VALIDATE MOBILE
    // -------------------------------------------------------

    if (
      cleanMobile.length !== 10
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid 10-digit mobile number",
      });
    }

    // -------------------------------------------------------
    // FIND INVITATION
    // -------------------------------------------------------

    const invitation =
      await Invitation.findOne({
        token,
      });

    // -------------------------------------------------------
    // CHECK INVITATION
    // -------------------------------------------------------

    if (!invitation) {
      return res.status(404).json({
        message:
          "Invitation not found",
      });
    }

    // -------------------------------------------------------
    // CHECK STATUS
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // CHECK EXPIRATION
    // -------------------------------------------------------

    if (
      invitation.expiresAt < new Date()
    ) {
      invitation.status =
        "expired";

      await invitation.save();

      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    // =======================================================
    // SAVE PARTICIPANT MOBILE TO INVITATION
    // =======================================================

    invitation.mobile =
      cleanMobile;

    await invitation.save();

    // -------------------------------------------------------
    // GENERATE SECURE 6-DIGIT OTP
    // -------------------------------------------------------

    const otp =
      crypto.randomInt(
        100000,
        1000000
      ).toString();

    // -------------------------------------------------------
    // HASH OTP
    // -------------------------------------------------------

    const otpHash =
      await bcrypt.hash(
        otp,
        10
      );

    // -------------------------------------------------------
    // OTP EXPIRES IN 5 MINUTES
    // -------------------------------------------------------

    const expiresAt =
      new Date(
        Date.now() +
          5 * 60 * 1000
      );

    // -------------------------------------------------------
    // DELETE OLD OTP
    // -------------------------------------------------------

    await OTP.deleteMany({
      invitationToken:
        token,
    });

    // -------------------------------------------------------
    // SAVE OTP
    // -------------------------------------------------------

    await OTP.create({
      mobile:
        cleanMobile,

      otpHash,

      invitationToken:
        token,

      name:
        invitation.name,

      expiresAt,

      attempts:
        0,
    });

    // -------------------------------------------------------
    // DEVELOPMENT MODE
    // -------------------------------------------------------
    // Later this console.log will be replaced by an
    // actual SMS service such as MSG91 / Twilio / Exotel.
    // -------------------------------------------------------

    console.log(
      `🔐 OTP for ${cleanMobile}: ${otp}`
    );

    // -------------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({
      message:
        "OTP sent successfully",

      expiresIn:
        300,

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
// After OTP verification:
//
// 1. Find/create participant
// 2. Save mobile to User
// 3. Add participant to event
// 4. Mark invitation accepted
// 5. Create JWT
// 6. Participant goes to dashboard
// =========================================================

export const verifyInvitationOTP = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // -------------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------------

    const token =
      Array.isArray(req.params.token)
        ? req.params.token[0]
        : req.params.token;

    const {
      otp,
    } = req.body;

    // -------------------------------------------------------
    // CHECK TOKEN
    // -------------------------------------------------------

    if (!token) {
      return res.status(400).json({
        message:
          "Invitation token is required",
      });
    }

    // -------------------------------------------------------
    // CHECK OTP
    // -------------------------------------------------------

    if (!otp) {
      return res.status(400).json({
        message:
          "OTP is required",
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
    // CHECK MOBILE
    // -------------------------------------------------------

    if (!invitation.mobile) {
      return res.status(400).json({
        message:
          "Mobile number not found. Please enter your mobile number first.",
      });
    }

    // -------------------------------------------------------
    // CHECK INVITATION STATUS
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // CHECK INVITATION EXPIRATION
    // -------------------------------------------------------

    if (
      invitation.expiresAt < new Date()
    ) {
      invitation.status =
        "expired";

      await invitation.save();

      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    // -------------------------------------------------------
    // FIND OTP
    // -------------------------------------------------------

    const otpRecord =
      await OTP.findOne({
        invitationToken:
          token,
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
      otpRecord.expiresAt < new Date()
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
    // CHECK ATTEMPTS
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
        otp.toString(),
        otpRecord.otpHash
      );

    // -------------------------------------------------------
    // INVALID OTP
    // -------------------------------------------------------

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

    // =======================================================
    // OTP IS VALID
    // =======================================================

    // -------------------------------------------------------
    // FIND EXISTING USER
    // -------------------------------------------------------

    let user =
      await User.findOne({
        email:
          invitation.email,
      });

    // =======================================================
    // EXISTING USER
    // =======================================================

    if (user) {

      // -----------------------------------------------------
      // UPDATE MOBILE
      // -----------------------------------------------------

      user.mobile =
        invitation.mobile;

      await user.save();

    } else {

      // =====================================================
      // CREATE NEW PARTICIPANT
      // =====================================================

      user =
        await User.create({
          name:
            invitation.name,

          email:
            invitation.email,

          mobile:
            invitation.mobile,

          role:
            "participant",
        });
    }

    // -------------------------------------------------------
    // CHECK EVENT PARTICIPATION
    // -------------------------------------------------------

    let eventParticipant =
      await EventParticipant.findOne({
        event:
          invitation.event,

        user:
          user._id,
      });

    // -------------------------------------------------------
    // ADD TO EVENT IF NOT ALREADY ADDED
    // -------------------------------------------------------

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
    // MARK INVITATION AS ACCEPTED
    // -------------------------------------------------------

    invitation.status =
      "accepted";

    await invitation.save();

    // -------------------------------------------------------
    // DELETE USED OTP
    // -------------------------------------------------------

    await OTP.deleteOne({
      _id:
        otpRecord._id,
    });

    // -------------------------------------------------------
    // CREATE JWT
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
            user.role,
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

        mobile:
          user.mobile,

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
      message: "Server error",
    });
  }
};

// =========================================================
// ACCEPT INVITATION
// =========================================================
// LEGACY PASSWORD-BASED FLOW
// =========================================================
//
// This route is NO LONGER needed for the new participant
// OTP flow.
//
// New flow:
//
// invitation link
//      ↓
// enter mobile
//      ↓
// sendInvitationOTP()
//      ↓
// enter OTP
//      ↓
// verifyInvitationOTP()
//      ↓
// participant dashboard
//
// Kept temporarily so existing route imports do not break.
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
