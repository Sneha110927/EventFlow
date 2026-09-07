import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createAnnouncement,
  getAdminAnnouncements,
  getParticipantAnnouncements,
  markAnnouncementAsRead,
} from "../controllers/announcementController";

const router = Router();

// Admin: create a new announcement
router.post("/", authMiddleware, createAnnouncement);

// Admin: get announcements for an event
router.get("/admin", authMiddleware, getAdminAnnouncements);

// Participant: get announcements for their events
router.get("/participant", authMiddleware, getParticipantAnnouncements);

// Participant: mark an announcement as read
router.patch("/:id/read", authMiddleware, markAnnouncementAsRead);

export default router;