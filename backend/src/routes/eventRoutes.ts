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

// =========================================================
// EVENT ROUTES
// =========================================================

// Create event
router.post(
  "/",
  authMiddleware,
  createEvent
);

// Get all events
router.get(
  "/",
  authMiddleware,
  getEvents
);

// Get events for logged-in participant
router.get(
  "/my-events",
  authMiddleware,
  getMyEvents
);

// Get one event
router.get(
  "/:id",
  authMiddleware,
  getEventById
);

// Update event
router.put(
  "/:id",
  authMiddleware,
  updateEvent
);

// Delete event
router.delete(
  "/:id",
  authMiddleware,
  deleteEvent
);

export default router;