import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import announcementRoutes from "./routes/announcementRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
import invitationRoutes from "./routes/invitationRoutes";
import eventParticipantRoutes from "./routes/eventParticipantRoutes";
import documentRoutes from "./routes/documentRoutes";
import chatRoutes from "./routes/chatRoutes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

//
// API ROUTES
//

app.use("/api/announcements", announcementRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/event-participants", eventParticipantRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

//
// PRODUCTION ROUTES
// These avoid Vercel's /api routing.
//

app.use("/announcements", announcementRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes);
app.use("/invitations", invitationRoutes);
app.use("/event-participants", eventParticipantRoutes);
app.use("/documents", documentRoutes);
app.use("/chat", chatRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "EventFlow API is running 🚀",
  });
});

export default app;