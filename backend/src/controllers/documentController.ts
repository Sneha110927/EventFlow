import { Response } from "express";
import fs from "fs";

import DocumentModel from "../models/Document";
import Event from "../models/Event";
import EventParticipant from "../models/EventParticipant";
import { AuthRequest } from "../middleware/authMiddleware";

// =========================================================
// UPLOAD DOCUMENT - PARTICIPANT
// =========================================================

export const uploadDocument = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "participant") {
      return res.status(403).json({
        message: "Only participants can upload documents",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file",
      });
    }

    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const participant =
      await EventParticipant.findOne({
        event: eventId,
        user: req.user.userId,
      });

    if (!participant) {
      return res.status(403).json({
        message:
          "You are not registered for this event",
      });
    }

    const document =
      await DocumentModel.create({
        event: eventId,
        user: req.user.userId,

        name: req.file.originalname,
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,

        mimetype: req.file.mimetype,
        size: req.file.size,

        status: "pending",
      });

    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error(
      "Upload document error:",
      error
    );

    return res.status(500).json({
      message: "Failed to upload document",
    });
  }
};

// =========================================================
// GET MY DOCUMENTS - PARTICIPANT
// =========================================================

export const getMyDocuments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const documents =
      await DocumentModel.find({
        user: req.user.userId,
      })
        .populate(
          "event",
          "name type"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      documents,
    });
  } catch (error) {
    console.error(
      "Get my documents error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch documents",
    });
  }
};

// =========================================================
// GET ALL DOCUMENTS - ADMIN
// =========================================================

export const getAllDocuments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can view all documents",
      });
    }

    const documents =
      await DocumentModel.find()
        .populate(
          "user",
          "name email role"
        )
        .populate(
          "event",
          "name type"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      documents,
    });
  } catch (error) {
    console.error(
      "Get all documents error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch documents",
    });
  }
};

// =========================================================
// APPROVE DOCUMENT - ADMIN
// =========================================================

export const approveDocument = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can approve documents",
      });
    }

    const { id } = req.params;

    const document =
      await DocumentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    document.status = "approved";

    await document.save();

    const updatedDocument =
      await DocumentModel.findById(id)
        .populate(
          "user",
          "name email role"
        )
        .populate(
          "event",
          "name type"
        );

    return res.status(200).json({
      message:
        "Document approved successfully",
      document: updatedDocument,
    });
  } catch (error) {
    console.error(
      "Approve document error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to approve document",
    });
  }
};

// =========================================================
// REJECT DOCUMENT - ADMIN
// =========================================================

export const rejectDocument = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can reject documents",
      });
    }

    const { id } = req.params;

    const document =
      await DocumentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    document.status = "rejected";

    await document.save();

    const updatedDocument =
      await DocumentModel.findById(id)
        .populate(
          "user",
          "name email role"
        )
        .populate(
          "event",
          "name type"
        );

    return res.status(200).json({
      message:
        "Document rejected successfully",
      document: updatedDocument,
    });
  } catch (error) {
    console.error(
      "Reject document error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to reject document",
    });
  }
};

// =========================================================
// DOWNLOAD DOCUMENT
// =========================================================

export const downloadDocument = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    const document =
      await DocumentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const isAdmin =
      req.user.role === "admin";

    const isOwner =
      document.user.toString() ===
      req.user.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message:
          "You are not allowed to download this document",
      });
    }

    if (!fs.existsSync(document.path)) {
      return res.status(404).json({
        message:
          "Document file not found on server",
      });
    }

    return res.download(
      document.path,
      document.originalName
    );
  } catch (error) {
    console.error(
      "Download document error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to download document",
    });
  }
};