import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  getAllEventParticipants,
  getEventParticipants,
} from "../controllers/eventParticipantController";

const router = Router();

// =========================================================
// GET ALL ACTUAL PARTICIPANTS
// =========================================================

router.get(
  "/",
  authMiddleware,
  getAllEventParticipants
);

// =========================================================
// GET PARTICIPANTS OF A SPECIFIC EVENT
// =========================================================

router.get(
  "/event/:eventId",
  authMiddleware,
  getEventParticipants
);

export default router;