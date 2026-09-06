import { Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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

    const { name, email, eventId } = req.body;

    if (!name || !email || !eventId) {
      return res.status(400).json({
        message: "Name, email and event are required",
      });
    }

    // -------------------------------------------------------
    // FIND EVENT
    // -------------------------------------------------------

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // -------------------------------------------------------
    // GENERATE INVITATION TOKEN
    // -------------------------------------------------------

    const token = crypto.randomBytes(32).toString("hex");

    // Invitation expires after 7 days
    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    // -------------------------------------------------------
    // CREATE INVITATION IN DATABASE
    // -------------------------------------------------------

    const invitation = await Invitation.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      event: eventId,
      invitedBy: req.user.userId,
      status: "pending",
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
      to: invitation.email,
      name: invitation.name,
      eventName: event.name,
      invitationLink,
    });

    // -------------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------------

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
        message: "Only admins can view invitations",
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

export const getInvitationByToken = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { token } = req.params;

    // -------------------------------------------------------
    // CHECK TOKEN
    // -------------------------------------------------------

    if (!token) {
      return res.status(400).json({
        message: "Invitation token is required",
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

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    // -------------------------------------------------------
    // CHECK EXPIRATION
    // -------------------------------------------------------

    if (
      invitation.status === "pending" &&
      invitation.expiresAt < new Date()
    ) {
      invitation.status = "expired";

      await invitation.save();
    }

    // -------------------------------------------------------
    // CHECK STATUS
    // -------------------------------------------------------

    if (
      invitation.status === "expired"
    ) {
      return res.status(410).json({
        message: "This invitation has expired",
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
        id: invitation._id,
        name: invitation.name,
        email: invitation.email,
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
// ACCEPT INVITATION
// =========================================================

export const acceptInvitation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // -------------------------------------------------------
    // CHECK TOKEN
    // -------------------------------------------------------

    if (!token) {
      return res.status(400).json({
        message: "Invitation token is required",
      });
    }

    // -------------------------------------------------------
    // FIND INVITATION
    // -------------------------------------------------------

    const invitation = await Invitation.findOne({
      token,
    });

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    // -------------------------------------------------------
    // CHECK INVITATION STATUS
    // -------------------------------------------------------

    if (invitation.status === "accepted") {
      return res.status(409).json({
        message:
          "This invitation has already been accepted",
      });
    }

    if (invitation.status === "expired") {
      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    // -------------------------------------------------------
    // CHECK EXPIRATION
    // -------------------------------------------------------

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";

      await invitation.save();

      return res.status(410).json({
        message:
          "This invitation has expired",
      });
    }

    // -------------------------------------------------------
    // CHECK WHETHER USER ALREADY EXISTS
    // -------------------------------------------------------

    const existingUser = await User.findOne({
      email: invitation.email,
    });

    // =======================================================
    // CASE 1: USER ALREADY EXISTS
    // =======================================================

    if (existingUser) {

      // Check whether this user is already part
      // of this event
      const existingParticipant =
        await EventParticipant.findOne({
          event: invitation.event,
          user: existingUser._id,
        });

      if (existingParticipant) {
        invitation.status = "accepted";

        await invitation.save();

        return res.status(200).json({
          message:
            "You are already registered for this event. Please login.",
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
          },
          existingAccount: true,
        });
      }

      // Add existing user to this event
      await EventParticipant.create({
        event: invitation.event,
        user: existingUser._id,
        status: "accepted",
        registrationCompleted: false,
        joinedAt: new Date(),
      });

      // Mark invitation as accepted
      invitation.status = "accepted";

      await invitation.save();

      return res.status(200).json({
        message:
          "Invitation accepted successfully. Please login with your existing account.",
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        existingAccount: true,
      });
    }

    // =======================================================
    // CASE 2: NEW USER
    // =======================================================

    if (!password) {
      return res.status(400).json({
        message:
          "Please create a password for your new account.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    // -------------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // -------------------------------------------------------
    // CREATE USER
    // -------------------------------------------------------

    const user = await User.create({
      name: invitation.name,
      email: invitation.email,
      password: hashedPassword,
      role: "participant",
    });

    // -------------------------------------------------------
    // CREATE EVENT PARTICIPANT
    // -------------------------------------------------------

    await EventParticipant.create({
      event: invitation.event,
      user: user._id,
      status: "accepted",
      registrationCompleted: false,
      joinedAt: new Date(),
    });

    // -------------------------------------------------------
    // MARK INVITATION AS ACCEPTED
    // -------------------------------------------------------

    invitation.status = "accepted";

    await invitation.save();

    // -------------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------------

    return res.status(201).json({
      message:
        "Account created and invitation accepted successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      existingAccount: false,
    });

  } catch (error) {
    console.error(
      "Accept invitation error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};