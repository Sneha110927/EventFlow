import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "admin" | "participant";
  };
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("🔥 AUTH MIDDLEWARE HIT:", req.method, req.originalUrl);

  try {
    const authHeader = req.headers.authorization;

    console.log("Authorization header:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token");

      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      role: "admin" | "participant";
    };

    console.log("✅ Token verified:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("❌ Auth error:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;