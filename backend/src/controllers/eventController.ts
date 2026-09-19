import { Response } from "express";
import Event from "../models/Event";
import { AuthRequest } from "../middleware/authMiddleware";

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
      meetingLink,
      modules,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        message: "Event name and type are required",
      });
    }

    const virtualMeeting =
      modules?.virtualMeeting === true;

    const cleanMeetingLink = virtualMeeting
      ? typeof meetingLink === "string"
        ? meetingLink.trim()
        : ""
      : "";

    if (virtualMeeting && !cleanMeetingLink) {
      return res.status(400).json({
        message:
          "Meeting link is required when virtual meeting is enabled",
      });
    }

    const event = await Event.create({
      name: name.trim(),
      type: type.trim(),
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      startDate,
      endDate,
      location:
        typeof location === "string"
          ? location.trim()
          : "",
      meetingLink: cleanMeetingLink,

      modules: {
        participants:
          modules?.participants ?? true,

        registration:
          modules?.registration ?? true,

        schedule:
          modules?.schedule ?? true,

        documents:
          modules?.documents ?? true,

        announcements:
          modules?.announcements ?? true,

        chat:
          modules?.chat ?? true,

        accommodation:
          modules?.accommodation ?? false,

        travel:
          modules?.travel ?? false,

        virtualMeeting,
      },

      createdBy: req.user.userId,
    });

    console.log("=================================");
    console.log("EVENT SAVED TO MONGODB");
    console.log("EVENT ID:", event._id);
    console.log("EVENT NAME:", event.name);
    console.log("MEETING LINK:", event.meetingLink);
    console.log(
      "VIRTUAL MEETING:",
      event.modules.virtualMeeting
    );
    console.log("=================================");

    return res.status(201).json({
      message: "Event created successfully",
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

export const getEvents = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      events,
    });
  } catch (error) {
    console.error(
      "Get events error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getEventById = async (
  req: AuthRequest,
  res: Response
) => {
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
    console.error(
      "Get event error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateEvent = async (
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
        message: "Only admins can update events",
      });
    }

    const { id } = req.params;

    const {
      name,
      type,
      description,
      startDate,
      endDate,
      location,
      meetingLink,
      modules,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name =
        typeof name === "string"
          ? name.trim()
          : name;
    }

    if (type !== undefined) {
      updateData.type =
        typeof type === "string"
          ? type.trim()
          : type;
    }

    if (description !== undefined) {
      updateData.description =
        typeof description === "string"
          ? description.trim()
          : description;
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate;
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate;
    }

    if (location !== undefined) {
      updateData.location =
        typeof location === "string"
          ? location.trim()
          : location;
    }

    if (modules !== undefined) {
      const virtualMeeting =
        modules?.virtualMeeting === true;

      const cleanMeetingLink =
        virtualMeeting
          ? typeof meetingLink === "string"
            ? meetingLink.trim()
            : ""
          : "";

      if (
        virtualMeeting &&
        !cleanMeetingLink
      ) {
        return res.status(400).json({
          message:
            "Meeting link is required when virtual meeting is enabled",
        });
      }

      updateData.modules = {
        participants:
          modules?.participants ?? true,

        registration:
          modules?.registration ?? true,

        schedule:
          modules?.schedule ?? true,

        documents:
          modules?.documents ?? true,

        announcements:
          modules?.announcements ?? true,

        chat:
          modules?.chat ?? true,

        accommodation:
          modules?.accommodation ?? false,

        travel:
          modules?.travel ?? false,

        virtualMeeting,
      };

      updateData.meetingLink =
        cleanMeetingLink;
    } else if (
      meetingLink !== undefined
    ) {
      updateData.meetingLink =
        typeof meetingLink === "string"
          ? meetingLink.trim()
          : "";
    }

    const event =
      await Event.findByIdAndUpdate(
        id,
        updateData,
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

    console.log("=================================");
    console.log("EVENT UPDATED");
    console.log("EVENT ID:", event._id);
    console.log("MEETING LINK:", event.meetingLink);
    console.log(
      "VIRTUAL MEETING:",
      event.modules.virtualMeeting
    );
    console.log("=================================");

    return res.json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error(
      "Update event error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const deleteEvent = async (
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
        message: "Only admins can delete events",
      });
    }

    const { id } = req.params;

    const event =
      await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete event error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};