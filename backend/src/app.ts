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

const allowedOrigins = [
  "http://localhost:5173",
  "https://event-flow-ep7i.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header
      // (Postman, curl, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    credentials: true,
  })
);

/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(express.json());

/* =========================================================
   API ROUTES
   ========================================================= */

// Local / traditional API routes
app.use("/api/announcements", announcementRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/event-participants", eventParticipantRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

app.use("/announcements", announcementRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes);
app.use("/invitations", invitationRoutes);
app.use("/event-participants", eventParticipantRoutes);
app.use("/documents", documentRoutes);
app.use("/chat", chatRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "EventFlow API is running 🚀",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "EventFlow backend is healthy 🚀",
  });
});

export default app;