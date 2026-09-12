import { Response } from "express";
import fs from "fs";
import mongoose from "mongoose";

import DocumentModel from "../models/Document";
import DocumentRequest from "../models/DocumentRequest";
import Event from "../models/Event";
import EventParticipant from "../models/EventParticipant";

import { AuthRequest } from "../middleware/authMiddleware";

// ============================================================
// HELPER - GET STRING PARAMETER
// ============================================================

const getStringParam = (
  value: string | string[] | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

// ============================================================
// GET EVENTS FOR DOCUMENT REQUEST
// ADMIN
// ============================================================

export const getDocumentEvents = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("🔥 GET /api/documents/events HIT");
  try {
    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // --------------------------------------------------------
    // Admin only
    // --------------------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only admins can view document events",
      });
    }

    // --------------------------------------------------------
    // Get events
    // --------------------------------------------------------

    const events = await Event.find()
      .select("_id name type")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      events,
    });
  } catch (error) {
    console.error(
      "Get document events error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch events",
    });
  }
};

// ============================================================
// GET PARTICIPANTS FOR DOCUMENT REQUEST
// ADMIN
// ============================================================

export const getDocumentParticipants =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      // --------------------------------------------------------
      // Admin only
      // --------------------------------------------------------

      if (req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Only admins can view participants",
        });
      }

      // --------------------------------------------------------
      // Event ID
      // --------------------------------------------------------

      const eventId =
        typeof req.query.eventId === "string"
          ? req.query.eventId
          : undefined;

      if (!eventId) {
        return res.status(400).json({
          message: "Event ID is required",
        });
      }

      // --------------------------------------------------------
      // Validate event ID
      // --------------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          eventId
        )
      ) {
        return res.status(400).json({
          message: "Invalid event ID",
        });
      }

      // --------------------------------------------------------
      // Check event
      // --------------------------------------------------------

      const event =
        await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          message: "Event not found",
        });
      }

      // --------------------------------------------------------
      // Get participants
      // --------------------------------------------------------

      const participants =
        await EventParticipant.find({
          event: eventId,
        })
          .populate(
            "user",
            "name email mobile role"
          )
          .lean();

      // --------------------------------------------------------
      // Convert to clean response
      // --------------------------------------------------------

      const formattedParticipants =
        participants
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
            ): participant is NonNullable<
              typeof participant
            > => participant !== null
          );

      return res.status(200).json({
        participants:
          formattedParticipants,
      });
    } catch (error) {
      console.error(
        "Get document participants error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch participants",
      });
    }
  };

// ============================================================
// CREATE DOCUMENT REQUEST
// ADMIN
// ============================================================

export const createDocumentRequest =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      // --------------------------------------------------------
      // Admin only
      // --------------------------------------------------------

      if (req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Only admins can create document requests",
        });
      }

      // --------------------------------------------------------
      // Request body
      // --------------------------------------------------------

      const {
        eventId,
        participantId,
        documentName,
        description,
        required,
        deadline,
      } = req.body;

      // --------------------------------------------------------
      // Required fields
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // Validate event ID
      // --------------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          eventId
        )
      ) {
        return res.status(400).json({
          message: "Invalid event ID",
        });
      }

      // --------------------------------------------------------
      // Check event
      // --------------------------------------------------------

      const event =
        await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          message: "Event not found",
        });
      }

      // --------------------------------------------------------
      // Validate document name
      // --------------------------------------------------------

      if (
        typeof documentName !== "string" ||
        documentName.trim().length === 0
      ) {
        return res.status(400).json({
          message:
            "Document name is required",
        });
      }

      // --------------------------------------------------------
      // Validate deadline
      // --------------------------------------------------------

      const parsedDeadline =
        new Date(deadline);

      if (
        Number.isNaN(
          parsedDeadline.getTime()
        )
      ) {
        return res.status(400).json({
          message: "Invalid deadline",
        });
      }

      if (
        parsedDeadline.getTime() <
        Date.now()
      ) {
        return res.status(400).json({
          message:
            "Deadline cannot be in the past",
        });
      }

      // ========================================================
      // SEND TO ALL PARTICIPANTS
      // ========================================================

      if (participantId === "all") {
        const eventParticipants =
          await EventParticipant.find({
            event: eventId,
          })
            .select("user")
            .lean();

        if (
          eventParticipants.length === 0
        ) {
          return res.status(400).json({
            message:
              "There are no participants registered for this event",
          });
        }

        const requestData =
          eventParticipants
            .map((participant: any) => {
              if (!participant.user) {
                return null;
              }

              return {
                event:
                  new mongoose.Types.ObjectId(
                    eventId
                  ),

                participant:
                  participant.user,

                documentName:
                  documentName.trim(),

                description:
                  typeof description ===
                  "string"
                    ? description.trim()
                    : "",

                required:
                  required !== false,

                deadline:
                  parsedDeadline,

                status:
                  "pending" as const,

                createdBy:
                  new mongoose.Types.ObjectId(
                    req.user!.userId
                  ),
              };
            })
            .filter(
              (
                request
              ): request is NonNullable<
                typeof request
              > =>
                request !== null
            );

        if (requestData.length === 0) {
          return res.status(400).json({
            message:
              "No valid participants found",
          });
        }

        const createdRequests =
          await DocumentRequest.insertMany(
            requestData
          );

        const requestIds =
          createdRequests.map(
            (request: any) =>
              request._id
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
          message:
            `Document request sent to ${createdRequests.length} participants`,

          requests:
            populatedRequests,
        });
      }

      // ========================================================
      // SEND TO ONE PARTICIPANT
      // ========================================================

      if (
        typeof participantId !== "string" ||
        !mongoose.Types.ObjectId.isValid(
          participantId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid participant ID",
        });
      }

      // --------------------------------------------------------
      // Check participant belongs to event
      // --------------------------------------------------------

      const eventParticipant =
        await EventParticipant.findOne({
          event: eventId,
          user: participantId,
        }).lean();

      if (!eventParticipant) {
        return res.status(404).json({
          message:
            "Participant is not registered for this event",
        });
      }

      // --------------------------------------------------------
      // Create request
      // --------------------------------------------------------

      const request =
        await DocumentRequest.create({
          event:
            new mongoose.Types.ObjectId(
              eventId
            ),

          participant:
            new mongoose.Types.ObjectId(
              participantId
            ),

          documentName:
            documentName.trim(),

          description:
            typeof description ===
            "string"
              ? description.trim()
              : "",

          required:
            required !== false,

          deadline:
            parsedDeadline,

          status:
            "pending",

          createdBy:
            new mongoose.Types.ObjectId(
              req.user.userId
            ),
        });

      // --------------------------------------------------------
      // Populate
      // --------------------------------------------------------

      const populatedRequest =
        await DocumentRequest.findById(
          request._id
        )
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
        message:
          "Document request created successfully",

        request:
          populatedRequest,
      });
    } catch (error) {
      console.error(
        "Create document request error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create document request",
      });
    }
  };

// ============================================================
// GET DOCUMENT REQUESTS
// ADMIN
// ============================================================

export const getDocumentRequests =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      // --------------------------------------------------------
      // Admin only
      // --------------------------------------------------------

      if (req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Only admins can view document requests",
        });
      }

      // --------------------------------------------------------
      // Optional event filter
      // --------------------------------------------------------

      const eventId =
        typeof req.query.eventId ===
        "string"
          ? req.query.eventId
          : undefined;

      const filter: Record<
        string,
        unknown
      > = {};

      if (eventId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            eventId
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid event ID",
          });
        }

        filter.event =
          new mongoose.Types.ObjectId(
            eventId
          );
      }

      // --------------------------------------------------------
      // Get requests
      // --------------------------------------------------------

      const requests =
        await DocumentRequest.find(
          filter
        )
          .populate(
            "participant",
            "name email mobile role"
          )
          .populate(
            "event",
            "name type"
          )
          .populate(
            "document"
          )
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
      console.error(
        "Get document requests error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch document requests",
      });
    }
  };

// ============================================================
// GET MY DOCUMENT REQUESTS
// PARTICIPANT
// ============================================================

export const getMyDocumentRequests =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      // --------------------------------------------------------
      // Participant only
      // --------------------------------------------------------

      if (
        req.user.role !==
        "participant"
      ) {
        return res.status(403).json({
          message:
            "Only participants can view document requests",
        });
      }

      // --------------------------------------------------------
      // Get requests
      // --------------------------------------------------------

      const requests =
        await DocumentRequest.find({
          participant:
            new mongoose.Types.ObjectId(
              req.user.userId
            ),
        })
          .populate(
            "event",
            "name type"
          )
          .populate(
            "document"
          )
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
        message:
          "Failed to fetch document requests",
      });
    }
  };

// ============================================================
// UPLOAD DOCUMENT
// PARTICIPANT
// ============================================================

export const uploadDocument = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    // --------------------------------------------------------
    // Participant only
    // --------------------------------------------------------

    if (
      req.user.role !==
      "participant"
    ) {
      return res.status(403).json({
        message:
          "Only participants can upload documents",
      });
    }

    // --------------------------------------------------------
    // File
    // --------------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        message:
          "Please select a file",
      });
    }

    const {
      eventId,
      requestId,
    } = req.body;

    // --------------------------------------------------------
    // Event ID
    // --------------------------------------------------------

    if (!eventId) {
      return res.status(400).json({
        message:
          "Event ID is required",
      });
    }

    if (
      typeof eventId !== "string" ||
      !mongoose.Types.ObjectId.isValid(
        eventId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid event ID",
      });
    }

    // --------------------------------------------------------
    // Event
    // --------------------------------------------------------

    const event =
      await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message:
          "Event not found",
      });
    }

    // --------------------------------------------------------
    // Participant belongs to event
    // --------------------------------------------------------

    const participant =
      await EventParticipant.findOne({
        event: eventId,

        user:
          new mongoose.Types.ObjectId(
            req.user.userId
          ),
      });

    if (!participant) {
      return res.status(403).json({
        message:
          "You are not registered for this event",
      });
    }

    // ========================================================
    // DOCUMENT REQUEST
    // ========================================================

    let documentRequest:
      | any
      | null = null;

    if (requestId) {
      // ------------------------------------------------------
      // Validate request ID
      // ------------------------------------------------------

      if (
        typeof requestId !==
          "string" ||
        !mongoose.Types.ObjectId.isValid(
          requestId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid document request ID",
        });
      }

      // ------------------------------------------------------
      // Find request
      // ------------------------------------------------------

      documentRequest =
        await DocumentRequest.findOne({
          _id: requestId,

          participant:
            new mongoose.Types.ObjectId(
              req.user.userId
            ),
        });

      if (!documentRequest) {
        return res.status(404).json({
          message:
            "Document request not found",
        });
      }

      // ------------------------------------------------------
      // Same event
      // ------------------------------------------------------

      if (
        documentRequest.event.toString() !==
        eventId
      ) {
        return res.status(400).json({
          message:
            "Document request does not belong to this event",
        });
      }

      // ------------------------------------------------------
      // Already approved
      // ------------------------------------------------------

      if (
        documentRequest.status ===
        "approved"
      ) {
        return res.status(400).json({
          message:
            "This document has already been approved",
        });
      }

      // ------------------------------------------------------
      // Already submitted
      // ------------------------------------------------------

      if (
        documentRequest.status ===
        "submitted"
      ) {
        return res.status(400).json({
          message:
            "A document has already been submitted for this request",
        });
      }
    }

    // ========================================================
    // CREATE DOCUMENT
    // ========================================================

    const document =
      await DocumentModel.create({
        event:
          new mongoose.Types.ObjectId(
            eventId
          ),

        user:
          new mongoose.Types.ObjectId(
            req.user.userId
          ),

        name:
          req.file.originalname,

        originalName:
          req.file.originalname,

        filename:
          req.file.filename,

        path:
          req.file.path,

        mimetype:
          req.file.mimetype,

        size:
          req.file.size,

        status:
          "pending",
      });

    // ========================================================
    // LINK DOCUMENT TO REQUEST
    // ========================================================

    if (documentRequest) {
      documentRequest.document =
        document._id;

      documentRequest.status =
        "submitted";

      await documentRequest.save();
    }

    return res.status(201).json({
      message:
        "Document uploaded successfully",

      document,

      request:
        documentRequest,
    });
  } catch (error) {
    console.error(
      "Upload document error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to upload document",
    });
  }
};

// ============================================================
// GET MY DOCUMENTS
// PARTICIPANT
// ============================================================

export const getMyDocuments = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (
      req.user.role !==
      "participant"
    ) {
      return res.status(403).json({
        message:
          "Only participants can view their documents",
      });
    }

    // --------------------------------------------------------
    // Documents
    // --------------------------------------------------------

    const documents =
      await DocumentModel.find({
        user:
          new mongoose.Types.ObjectId(
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
      message:
        "Failed to fetch documents",
    });
  }
};

// ============================================================
// GET ALL UPLOADED DOCUMENTS
// ADMIN
// ============================================================

export const getAllDocuments =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Only admins can view all documents",
        });
      }

      // --------------------------------------------------------
      // Get documents
      // --------------------------------------------------------

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
        message:
          "Failed to fetch documents",
      });
    }
  };

// ============================================================
// APPROVE DOCUMENT
// ADMIN
// ============================================================

export const approveDocument =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Only admins can approve documents",
        });
      }

      // --------------------------------------------------------
      // ID
      // --------------------------------------------------------

      const id =
        getStringParam(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          message:
            "Document ID is required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      // --------------------------------------------------------
      // Document
      // --------------------------------------------------------

      const document =
        await DocumentModel.findById(
          id
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      // --------------------------------------------------------
      // Approve
      // --------------------------------------------------------

      document.status =
        "approved";

      await document.save();

      // --------------------------------------------------------
      // Update request
      // --------------------------------------------------------

      await DocumentRequest.updateOne(
        {
          document:
            document._id,
        },
        {
          $set: {
            status:
              "approved",
          },
        }
      );

      // --------------------------------------------------------
      // Updated document
      // --------------------------------------------------------

      const updatedDocument =
        await DocumentModel.findById(
          id
        )
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

        document:
          updatedDocument,
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

// ============================================================
// REJECT DOCUMENT
// ADMIN
// ============================================================

export const rejectDocument =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      if (req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Only admins can reject documents",
        });
      }

      // --------------------------------------------------------
      // ID
      // --------------------------------------------------------

      const id =
        getStringParam(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          message:
            "Document ID is required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      // --------------------------------------------------------
      // Document
      // --------------------------------------------------------

      const document =
        await DocumentModel.findById(
          id
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      // --------------------------------------------------------
      // Reject
      // --------------------------------------------------------

      document.status =
        "rejected";

      await document.save();

      // --------------------------------------------------------
      // Update request
      // --------------------------------------------------------

      await DocumentRequest.updateOne(
        {
          document:
            document._id,
        },
        {
          $set: {
            status:
              "rejected",
          },
        }
      );

      // --------------------------------------------------------
      // Updated document
      // --------------------------------------------------------

      const updatedDocument =
        await DocumentModel.findById(
          id
        )
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

        document:
          updatedDocument,
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

// ============================================================
// DOWNLOAD DOCUMENT
// ============================================================

export const downloadDocument =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // --------------------------------------------------------
      // Authentication
      // --------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      // --------------------------------------------------------
      // ID
      // --------------------------------------------------------

      const id =
        getStringParam(
          req.params.id
        );

      if (!id) {
        return res.status(400).json({
          message:
            "Document ID is required",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      // --------------------------------------------------------
      // Document
      // --------------------------------------------------------

      const document =
        await DocumentModel.findById(
          id
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      // --------------------------------------------------------
      // Permission
      // --------------------------------------------------------

      const isAdmin =
        req.user.role === "admin";

      const isOwner =
        document.user.toString() ===
        req.user.userId;

      if (
        !isAdmin &&
        !isOwner
      ) {
        return res.status(403).json({
          message:
            "You are not allowed to download this document",
        });
      }

      // --------------------------------------------------------
      // File exists
      // --------------------------------------------------------

      if (
        !fs.existsSync(
          document.path
        )
      ) {
        return res.status(404).json({
          message:
            "Document file not found on server",
        });
      }

      // --------------------------------------------------------
      // Download
      // --------------------------------------------------------

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