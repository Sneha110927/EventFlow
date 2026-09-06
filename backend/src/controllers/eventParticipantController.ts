import { Response } from "express";

import EventParticipant from "../models/EventParticipant";
import Event from "../models/Event";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

// =========================================================
// GET ALL PARTICIPANTS
// =========================================================

export const getAllEventParticipants = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // -------------------------------------------------------
    // Check authentication
    // -------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // -------------------------------------------------------
    // Only admin can view all participants
    // -------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view participants",
      });
    }

    // -------------------------------------------------------
    // Get all actual event participants
    // -------------------------------------------------------

    const participants = await EventParticipant.find()
      .populate(
        "user",
        "name email role createdAt"
      )
      .populate(
        "event",
        "name type"
      )
      .sort({
        createdAt: -1,
      });

    // -------------------------------------------------------
    // Return participants
    // -------------------------------------------------------

    return res.status(200).json({
      participants,
    });
  } catch (error) {
    console.error(
      "Get all event participants error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// =========================================================
// GET PARTICIPANTS OF AN EVENT
// =========================================================

export const getEventParticipants = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // -------------------------------------------------------
    // Check authentication
    // -------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // -------------------------------------------------------
    // Only admin can view event participants
    // -------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view event participants",
      });
    }

    // -------------------------------------------------------
    // Get event ID
    // -------------------------------------------------------

    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    // -------------------------------------------------------
    // Check whether event exists
    // -------------------------------------------------------

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // -------------------------------------------------------
    // Get participants
    // -------------------------------------------------------

    const participants = await EventParticipant.find({
      event: eventId,
    })
      .populate(
        "user",
        "name email role createdAt"
      )
      .sort({
        createdAt: -1,
      });

    // -------------------------------------------------------
    // Return participants
    // -------------------------------------------------------

    return res.status(200).json({
      event: {
        id: event._id,
        name: event.name,
        type: event.type,
      },
      participants,
    });
  } catch (error) {
    console.error(
      "Get event participants error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// =========================================================
// GET EVENTS OF LOGGED-IN PARTICIPANT
// =========================================================

export const getMyEvents = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // -------------------------------------------------------
    // Check authentication
    // -------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // -------------------------------------------------------
    // Get event memberships for logged-in user
    // -------------------------------------------------------

    const eventParticipants =
      await EventParticipant.find({
        user: req.user.userId,
      })
        .populate(
          "event",
          "name type description startDate endDate location modules"
        )
        .sort({
          createdAt: -1,
        });

    // -------------------------------------------------------
    // Return events
    // -------------------------------------------------------

    return res.status(200).json({
      events: eventParticipants,
    });
  } catch (error) {
    console.error(
      "Get my events error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};
