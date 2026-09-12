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

/*
|--------------------------------------------------------------------------
| Admin document management
|--------------------------------------------------------------------------
*/

// Events available for document management
router.get(
  "/events",
  authMiddleware,
  getDocumentEvents
);

// Participants belonging to an event
router.get(
  "/participants",
  authMiddleware,
  getDocumentParticipants
);

// Create document request
router.post(
  "/requests",
  authMiddleware,
  createDocumentRequest
);

// Get document requests
router.get(
  "/requests",
  authMiddleware,
  getDocumentRequests
);

/*
|--------------------------------------------------------------------------
| Participant document management
|--------------------------------------------------------------------------
*/

// Participant's own document requests
router.get(
  "/my-requests",
  authMiddleware,
  getMyDocumentRequests
);

// Participant uploads document
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

// Participant's own uploaded documents
router.get(
  "/my-documents",
  authMiddleware,
  getMyDocuments
);

/*
|--------------------------------------------------------------------------
| Admin document list
|--------------------------------------------------------------------------
*/

// All documents
router.get(
  "/",
  authMiddleware,
  getAllDocuments
);

/*
|--------------------------------------------------------------------------
| Document actions
|--------------------------------------------------------------------------
*/

// Approve
router.put(
  "/:id/approve",
  authMiddleware,
  approveDocument
);

// Reject
router.put(
  "/:id/reject",
  authMiddleware,
  rejectDocument
);

// Download
router.get(
  "/:id/download",
  authMiddleware,
  downloadDocument
);

export default router;