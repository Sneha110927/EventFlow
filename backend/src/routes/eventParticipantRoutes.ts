import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  getAllEventParticipants,
  getEventParticipants,
  getMyEvents,
  deleteEventParticipant,
} from "../controllers/eventParticipantController";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getAllEventParticipants
);

router.get(
  "/my-events",
  authMiddleware,
  getMyEvents
);

router.get(
  "/event/:eventId",
  authMiddleware,
  getEventParticipants
);

router.delete(
  "/:participantId",
  authMiddleware,
  deleteEventParticipant
);

export default router;