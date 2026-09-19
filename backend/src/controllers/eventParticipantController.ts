import { Response } from "express";

import EventParticipant from "../models/EventParticipant";
import Event from "../models/Event";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

export const getAllEventParticipants = async (
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
        message: "Only admins can view participants",
      });
    }

    const participants = await EventParticipant.find()
      .populate(
        "user",
        "name email role createdAt"
      )
      .populate(
        "event",
        "name type description startDate endDate location meetingLink modules"
      )
      .sort({
        createdAt: -1,
      });

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

export const getEventParticipants = async (
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
        message: "Only admins can view event participants",
      });
    }

    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

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

    return res.status(200).json({
      event: {
        id: event._id,
        name: event.name,
        type: event.type,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        meetingLink: event.meetingLink,
        modules: event.modules,
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

export const getMyEvents = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }
console.log("🔥 NEW getMyEvents IS RUNNING");
    const eventParticipants = await EventParticipant.find({
      user: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    const events = await Promise.all(
      eventParticipants.map(async (participant) => {
        const event = await Event.findById(
          participant.event
        );

        return {
          ...participant.toObject(),
          event: event
            ? {
                _id: event._id,
                name: event.name,
                type: event.type,
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
                location: event.location,
                meetingLink: event.meetingLink,
                modules: event.modules,
              }
            : null,
        };
      })
    );

    console.log(
      "========== PARTICIPANT EVENTS =========="
    );

    console.log(
      JSON.stringify(events, null, 2)
    );

    console.log(
      "=========================================" 
    );

    return res.status(200).json({
      events,
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