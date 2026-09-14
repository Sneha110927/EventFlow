import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  createAnnouncement,
  getAdminAnnouncements,
  getParticipantAnnouncements,
  markAnnouncementAsRead,
} from "../controllers/announcementController";

const router = Router();

router.post("/", authMiddleware, createAnnouncement);

router.get("/admin", authMiddleware, getAdminAnnouncements);

router.get("/participant", authMiddleware, getParticipantAnnouncements);

router.patch("/:id/read", authMiddleware, markAnnouncementAsRead);

export default router;