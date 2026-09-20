import { Response } from "express";
import fs from "fs";
import mongoose from "mongoose";

import DocumentModel from "../models/Document";
import DocumentRequest from "../models/DocumentRequest";
import Event from "../models/Event";
import EventParticipant from "../models/EventParticipant";

import { AuthRequest } from "../middleware/authMiddleware";

const getStringParam = (
  value: string | string[] | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const getDocumentEvents = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("GET /api/documents/events HIT");

  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can view document events",
      });
    }

    const events = await Event.find()
      .select("_id name type")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      events,
    });
  } catch (error) {
    console.error("Get document events error:", error);

    return res.status(500).json({
      message: "Failed to fetch events",
    });
  }
};

export const getDocumentParticipants = async (
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
        message: "Only admins can view participants",
      });
    }

    const eventId =
      typeof req.query.eventId === "string"
        ? req.query.eventId
        : undefined;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const participants = await EventParticipant.find({
      event: eventId,
    })
      .populate("user", "name email mobile role")
      .lean();

    const formattedParticipants = participants
      .map((participant: any) => {
        const user = participant.user;

        if (!user) {
          return null;
        }

        return {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        };
      })
      .filter(
        (
          participant
        ): participant is NonNullable<typeof participant> =>
          participant !== null
      );

    return res.status(200).json({
      participants: formattedParticipants,
    });
  } catch (error) {
    console.error("Get document participants error:", error);

    return res.status(500).json({
      message: "Failed to fetch participants",
    });
  }
};

export const createDocumentRequest = async (
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
        message: "Only admins can create document requests",
      });
    }

    const {
      eventId,
      participantId,
      documentName,
      description,
      required,
      deadline,
    } = req.body;

    if (
      !eventId ||
      !participantId ||
      !documentName ||
      !deadline
    ) {
      return res.status(400).json({
        message:
          "Event, participant, document name and deadline are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    if (
      typeof documentName !== "string" ||
      documentName.trim().length === 0
    ) {
      return res.status(400).json({
        message: "Document name is required",
      });
    }

    const parsedDeadline = new Date(deadline);

    if (Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({
        message: "Invalid deadline",
      });
    }

    if (parsedDeadline.getTime() < Date.now()) {
      return res.status(400).json({
        message: "Deadline cannot be in the past",
      });
    }

    if (participantId === "all") {
      const eventParticipants = await EventParticipant.find({
        event: eventId,
      })
        .select("user")
        .lean();

      if (eventParticipants.length === 0) {
        return res.status(400).json({
          message: "There are no participants registered for this event",
        });
      }

      const requestData = eventParticipants
        .map((participant: any) => {
          if (!participant.user) {
            return null;
          }

          return {
            event: new mongoose.Types.ObjectId(eventId),
            participant: participant.user,
            documentName: documentName.trim(),
            description:
              typeof description === "string"
                ? description.trim()
                : "",
            required: required !== false,
            deadline: parsedDeadline,
            status: "pending" as const,
            createdBy: new mongoose.Types.ObjectId(
              req.user!.userId
            ),
          };
        })
        .filter(
          (
            request
          ): request is NonNullable<typeof request> =>
            request !== null
        );

      if (requestData.length === 0) {
        return res.status(400).json({
          message: "No valid participants found",
        });
      }

      const createdRequests =
        await DocumentRequest.insertMany(requestData);

      const requestIds = createdRequests.map(
        (request: any) => request._id
      );

      const populatedRequests =
        await DocumentRequest.find({
          _id: {
            $in: requestIds,
          },
        })
          .populate(
            "participant",
            "name email mobile role"
          )
          .populate(
            "event",
            "name type"
          )
          .populate(
            "createdBy",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(201).json({
        message: `Document request sent to ${createdRequests.length} participants`,
        requests: populatedRequests,
      });
    }

    if (
      typeof participantId !== "string" ||
      !mongoose.Types.ObjectId.isValid(participantId)
    ) {
      return res.status(400).json({
        message: "Invalid participant ID",
      });
    }

    const eventParticipant =
      await EventParticipant.findOne({
        event: eventId,
        user: participantId,
      }).lean();

    if (!eventParticipant) {
      return res.status(404).json({
        message: "Participant is not registered for this event",
      });
    }

    const request = await DocumentRequest.create({
      event: new mongoose.Types.ObjectId(eventId),
      participant: new mongoose.Types.ObjectId(participantId),
      documentName: documentName.trim(),
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      required: required !== false,
      deadline: parsedDeadline,
      status: "pending",
      createdBy: new mongoose.Types.ObjectId(
        req.user.userId
      ),
    });

    const populatedRequest =
      await DocumentRequest.findById(request._id)
        .populate(
          "participant",
          "name email mobile role"
        )
        .populate(
          "event",
          "name type"
        )
        .populate(
          "createdBy",
          "name email"
        );

    return res.status(201).json({
      message: "Document request created successfully",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Create document request error:", error);

    return res.status(500).json({
      message: "Failed to create document request",
    });
  }
};

export const getDocumentRequests = async (
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
        message: "Only admins can view document requests",
      });
    }

    const eventId =
      typeof req.query.eventId === "string"
        ? req.query.eventId
        : undefined;

    const filter: Record<string, unknown> = {};

    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          message: "Invalid event ID",
        });
      }

      filter.event = new mongoose.Types.ObjectId(eventId);
    }

    const requests = await DocumentRequest.find(filter)
      .populate(
        "participant",
        "name email mobile role"
      )
      .populate(
        "event",
        "name type"
      )
      .populate("document")
      .populate(
        "createdBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error("Get document requests error:", error);

    return res.status(500).json({
      message: "Failed to fetch document requests",
    });
  }
};

export const getMyDocumentRequests = async (
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
        message:
          "Only participants can view document requests",
      });
    }

    const requests = await DocumentRequest.find({
      participant: new mongoose.Types.ObjectId(
        req.user.userId
      ),
    })
      .populate(
        "event",
        "name type"
      )
      .populate("document")
      .sort({
        deadline: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error(
      "Get my document requests error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch document requests",
    });
  }
};

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
        message:
          "Only participants can upload documents",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file",
      });
    }

    const {
      eventId,
      requestId,
    } = req.body;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    if (
      typeof eventId !== "string" ||
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
      return res.status(400).json({
        message: "Invalid event ID",
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
        user: new mongoose.Types.ObjectId(
          req.user.userId
        ),
      });

    if (!participant) {
      return res.status(403).json({
        message:
          "You are not registered for this event",
      });
    }

    let documentRequest: any | null = null;

    if (requestId) {
      if (
        typeof requestId !== "string" ||
        !mongoose.Types.ObjectId.isValid(requestId)
      ) {
        return res.status(400).json({
          message: "Invalid document request ID",
        });
      }

      documentRequest =
        await DocumentRequest.findOne({
          _id: requestId,
          participant: new mongoose.Types.ObjectId(
            req.user.userId
          ),
        });

      if (!documentRequest) {
        return res.status(404).json({
          message: "Document request not found",
        });
      }

      if (
        documentRequest.event.toString() !==
        eventId
      ) {
        return res.status(400).json({
          message:
            "Document request does not belong to this event",
        });
      }

      if (documentRequest.status === "approved") {
        return res.status(400).json({
          message:
            "This document has already been approved",
        });
      }

      if (documentRequest.status === "submitted") {
        return res.status(400).json({
          message:
            "A document has already been submitted for this request",
        });
      }
    }

    const document =
      await DocumentModel.create({
        event: new mongoose.Types.ObjectId(eventId),
        user: new mongoose.Types.ObjectId(
          req.user.userId
        ),
        name: req.file.originalname,
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        status: "pending",
      });

    if (documentRequest) {
      documentRequest.document = document._id;
      documentRequest.status = "submitted";
      await documentRequest.save();
    }

    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
      request: documentRequest,
    });
  } catch (error) {
    console.error("Upload document error:", error);

    return res.status(500).json({
      message: "Failed to upload document",
    });
  }
};

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

    if (req.user.role !== "participant") {
      return res.status(403).json({
        message:
          "Only participants can view their documents",
      });
    }

    const documents =
      await DocumentModel.find({
        user: new mongoose.Types.ObjectId(
          req.user.userId
        ),
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
          "name email mobile role"
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

export const deleteDocumentRequest = async (
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
        message: "Only admins can delete document requests",
      });
    }

    const requestId = getStringParam(req.params.requestId);

    if (!requestId) {
      return res.status(400).json({
        message: "Document request ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        message: "Invalid document request ID",
      });
    }

    const request = await DocumentRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Document request not found",
      });
    }

    if (request.document) {
      await DocumentModel.findByIdAndDelete(request.document);
    }

    await DocumentRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      message: "Document request deleted successfully",
    });
  } catch (error) {
    console.error("Delete document request error:", error);

    return res.status(500).json({
      message: "Failed to delete document request",
    });
  }
};

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

    const id = getStringParam(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Document ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const document =
      await DocumentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    document.status = "approved";

    await document.save();

    await DocumentRequest.updateOne(
      {
        document: document._id,
      },
      {
        $set: {
          status: "approved",
        },
      }
    );

    const updatedDocument =
      await DocumentModel.findById(id)
        .populate(
          "user",
          "name email mobile role"
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

    const id = getStringParam(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Document ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const document =
      await DocumentModel.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    document.status = "rejected";

    await document.save();

    await DocumentRequest.updateOne(
      {
        document: document._id,
      },
      {
        $set: {
          status: "rejected",
        },
      }
    );

    const updatedDocument =
      await DocumentModel.findById(id)
        .populate(
          "user",
          "name email mobile role"
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

    const id = getStringParam(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Document ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

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