import dns from "dns";
import dotenv from "dotenv";
import app from "./app";
import connectDatabase from "./config/database";

// Load environment variables
dotenv.config();

// Use public DNS servers so MongoDB Atlas SRV records can resolve
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB before starting the HTTP server
    await connectDatabase();

    // Start Express server only after MongoDB connection succeeds
    app.listen(PORT, () => {
      console.log(
        `EventFlow backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

startServer();