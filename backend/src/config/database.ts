import mongoose from "mongoose";

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log("MongoDB connected successfully 🚀");

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected ⚠️");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected 🔄");
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDatabase;