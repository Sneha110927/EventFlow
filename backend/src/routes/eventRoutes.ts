import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController";

import {
  getMyEvents,
} from "../controllers/eventParticipantController";

const router = Router();


router.post(
  "/",
  authMiddleware,
  createEvent
);


router.get(
  "/",
  authMiddleware,
  getEvents
);

router.get(
  "/my-events",
  authMiddleware,
  getMyEvents
);


router.get(
  "/:id",
  authMiddleware,
  getEventById
);

router.put(
  "/:id",
  authMiddleware,
  updateEvent
);


router.delete(
  "/:id",
  authMiddleware,
  deleteEvent
);

export default router;