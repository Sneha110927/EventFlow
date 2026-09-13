import mongoose, { Document, Schema } from "mongoose";

export interface IOTP extends Document {
  email: string;

  otpHash: string;

  purpose:
    | "admin-login"
    | "participant-login";

  invitationToken?: string;

  expiresAt: Date;

  attempts: number;

  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: [
        "admin-login",
        "participant-login",
      ],
      required: true,
    },

    invitationToken: {
      type: String,
      required: false,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

// Automatically delete expired OTP records
otpSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

const OTP = mongoose.model<IOTP>(
  "OTP",
  otpSchema
);

export default OTP;