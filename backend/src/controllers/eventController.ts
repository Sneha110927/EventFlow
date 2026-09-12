import { Response } from "express";
import Event from "../models/Event";
import { AuthRequest } from "../middleware/authMiddleware";

// Create Event
export const createEvent = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("=================================");
    console.log("CREATE EVENT REQUEST");
    console.log("USER:", req.user);
    console.log("BODY:", req.body);
    console.log("=================================");

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can create events",
      });
    }

    const {
      name,
      type,
      description,
      startDate,
      endDate,
      location,
      modules,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        message:
          "Event name and type are required",
      });
    }

    const event = await Event.create({
      name: name.trim(),
      type,
      description:
        description?.trim() || "",
      startDate,
      endDate,
      location:
        location?.trim() || "",
      modules: modules || [],
      createdBy: req.user.userId,
    });

    console.log("=================================");
    console.log("EVENT SAVED TO MONGODB:");
    console.log(event);
    console.log("EVENT ID:", event._id);
    console.log("=================================");

    return res.status(201).json({
      message:
        "Event created successfully",
      event,
    });
  } catch (error) {
    console.error(
      "CREATE EVENT ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Get all events
export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      events,
    });
  } catch (error) {
    console.error("Get events error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Get one event
export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.json({
      event,
    });
  } catch (error) {
    console.error("Get event error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Update Event
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can update events",
      });
    }

    const { id } = req.params;

    const event = await Event.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Delete Event
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can delete events",
      });
    }

    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};