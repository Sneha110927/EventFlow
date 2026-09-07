import dns from "dns";
import http from "http";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { Server as SocketIOServer } from "socket.io";
import announcementRoutes from "./routes/announcementRoutes";
import connectDatabase from "./config/database";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
import invitationRoutes from "./routes/invitationRoutes";
import eventParticipantRoutes from "./routes/eventParticipantRoutes";
import documentRoutes from "./routes/documentRoutes";
import chatRoutes from "./routes/chatRoutes";

import { setupChatSocket } from "./sockets/chatSocket";

// =========================================================
// ENVIRONMENT
// =========================================================

dotenv.config();

// =========================================================
// DNS
// =========================================================

// Fix MongoDB Atlas SRV DNS resolution issue
dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

// =========================================================
// EXPRESS
// =========================================================

const app = express();

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],
    credentials: true,
  })
);

app.use(express.json());

// =========================================================
// ROUTES
// =========================================================
app.use("/api/announcements", announcementRoutes);
app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/events",
  eventRoutes
);

app.use(
  "/api/invitations",
  invitationRoutes
);

app.use(
  "/api/event-participants",
  eventParticipantRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);

// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      message:
        "EventFlow API is running 🚀",
    });
  }
);

// =========================================================
// HTTP SERVER
// =========================================================

const PORT =
  process.env.PORT || 5000;

const httpServer =
  http.createServer(app);

// =========================================================
// SOCKET.IO
// =========================================================

const io =
  new SocketIOServer(
    httpServer,
    {
      cors: {
        origin:
          "http://localhost:5173",

        methods: [
          "GET",
          "POST",
        ],

        credentials: true,
      },
    }
  );

// Setup chat socket
setupChatSocket(io);

// =========================================================
// START SERVER
// =========================================================

const startServer = async () => {
  try {
    await connectDatabase();

    httpServer.listen(
      PORT,
      () => {
        console.log(
          `EventFlow backend running on http://localhost:${PORT}`
        );

        console.log(
          `Socket.IO chat server running 🚀`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();