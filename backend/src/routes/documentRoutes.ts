import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import upload from "../config/upload";

import {
  getDocumentEvents,
  getDocumentParticipants,
  createDocumentRequest,
  getDocumentRequests,
  getMyDocumentRequests,
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  approveDocument,
  rejectDocument,
  downloadDocument,
} from "../controllers/documentController";

const router = Router();

router.get(
  "/events",
  authMiddleware,
  getDocumentEvents
);

router.get(
  "/participants",
  authMiddleware,
  getDocumentParticipants
);


router.post(
  "/requests",
  authMiddleware,
  createDocumentRequest
);


router.get(
  "/requests",
  authMiddleware,
  getDocumentRequests
);

router.get(
  "/my-requests",
  authMiddleware,
  getMyDocumentRequests
);
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

router.get(
  "/my-documents",
  authMiddleware,
  getMyDocuments
);


router.get(
  "/",
  authMiddleware,
  getAllDocuments
);


router.put(
  "/:id/approve",
  authMiddleware,
  approveDocument
);

router.put(
  "/:id/reject",
  authMiddleware,
  rejectDocument
);

router.get(
  "/:id/download",
  authMiddleware,
  downloadDocument
);

export default router;