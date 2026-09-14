import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import {
  getAllEventParticipants,
  getEventParticipants,
} from "../controllers/eventParticipantController";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getAllEventParticipants
);


router.get(
  "/event/:eventId",
  authMiddleware,
  getEventParticipants
);

export default router;