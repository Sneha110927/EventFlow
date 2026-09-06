import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware";

import upload from "../config/upload";

import {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  approveDocument,
  rejectDocument,
  downloadDocument,
} from "../controllers/documentController";

const router = Router();


// =========================================================
// PARTICIPANT
// =========================================================

// Upload document
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

// Get participant's own documents
router.get(
  "/my-documents",
  authMiddleware,
  getMyDocuments
);


// =========================================================
// ADMIN
// =========================================================

// Get all uploaded documents
router.get(
  "/",
  authMiddleware,
  getAllDocuments
);

// Approve document
router.put(
  "/:id/approve",
  authMiddleware,
  approveDocument
);

// Reject document
router.put(
  "/:id/reject",
  authMiddleware,
  rejectDocument
);


// =========================================================
// DOWNLOAD
// =========================================================

router.get(
  "/:id/download",
  authMiddleware,
  downloadDocument
);

export default router;