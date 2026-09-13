import app from "../src/app";
import connectDatabase from "../src/config/database";

export default async function handler(
  req: any,
  res: any
) {
  try {
    await connectDatabase();

    return app(req, res);
  } catch (error) {
    console.error(
      "Vercel backend error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}