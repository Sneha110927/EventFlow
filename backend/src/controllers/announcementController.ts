import { Request, Response } from "express";
import mongoose from "mongoose";
import Announcement from "../models/Announcement";
import EventParticipant from "../models/EventParticipant";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "participant";
  };
}

// ============================================================
// CREATE ANNOUNCEMENT
// ============================================================

export const createAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, content, target, eventId } = req.body;

    if (!title || !content || !eventId) {
      res.status(400).json({
        message: "Title, content and event are required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({
        message: "Invalid event ID",
      });
      return;
    }

    if (!["all", "confirmed", "pending"].includes(target)) {
      res.status(400).json({
        message: "Invalid announcement target",
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const announcement = await Announcement.create({
      event: eventId,
      title: title.trim(),
      content: content.trim(),
      target,
      sentBy: req.user.id,
      readBy: [],
    });

    const populatedAnnouncement = await Announcement.findById(
      announcement._id
    )
      .populate("sentBy", "name email")
      .populate("event", "name");

    res.status(201).json({
      message: "Announcement created successfully",
      announcement: populatedAnnouncement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);

    res.status(500).json({
      message: "Failed to create announcement",
    });
  }
};

// ============================================================
// GET ADMIN ANNOUNCEMENTS
// ============================================================

export const getAdminAnnouncements = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.query;

    if (!eventId || typeof eventId !== "string") {
      res.status(400).json({
        message: "Event ID is required",
      });
      return;
    }

    const announcements = await Announcement.find({
      event: eventId,
    })
      .populate("sentBy", "name email")
      .populate("event", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      announcements,
    });
  } catch (error) {
    console.error("Get announcements error:", error);

    res.status(500).json({
      message: "Failed to load announcements",
    });
  }
};

// ============================================================
// GET PARTICIPANT ANNOUNCEMENTS
// ============================================================

export const getParticipantAnnouncements = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Find all events this participant belongs to
    const participations = await EventParticipant.find({
      user: req.user.id,
    }).select("event status");

    if (participations.length === 0) {
      res.status(200).json({
        announcements: [],
      });
      return;
    }

    const announcements = [];

    for (const participation of participations) {
      const eventAnnouncements = await Announcement.find({
        event: participation.event,
      })
        .populate("sentBy", "name")
        .populate("event", "name")
        .sort({ createdAt: -1 });

      for (const announcement of eventAnnouncements) {
        // Everyone in the event receives "all"
        if (announcement.target === "all") {
          announcements.push(announcement);
        }

        // "Confirmed Only" = EventParticipant status "accepted"
        else if (
          announcement.target === "confirmed" &&
          participation.status === "accepted"
        ) {
          announcements.push(announcement);
        }

        // "Pending Only" = EventParticipant status "pending"
        else if (
          announcement.target === "pending" &&
          participation.status === "pending"
        ) {
          announcements.push(announcement);
        }
      }
    }

    res.status(200).json({
      announcements,
    });
  } catch (error) {
    console.error("Get participant announcements error:", error);

    res.status(500).json({
      message: "Failed to load announcements",
    });
  }
};

// ============================================================
// MARK ANNOUNCEMENT AS READ
// ============================================================

export const markAnnouncementAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user?.id) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      res.status(404).json({
        message: "Announcement not found",
      });
      return;
    }

    const alreadyRead = announcement.readBy.some(
      (userId) => userId.toString() === req.user!.id
    );

    if (!alreadyRead) {
      announcement.readBy.push(
        new mongoose.Types.ObjectId(req.user.id)
      );

      await announcement.save();
    }

    res.status(200).json({
      message: "Announcement marked as read",
    });
  } catch (error) {
    console.error("Mark announcement read error:", error);

    res.status(500).json({
      message: "Failed to mark announcement as read",
    });
  }
};
