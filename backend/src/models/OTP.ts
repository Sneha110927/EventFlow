import mongoose, { Document, Schema } from "mongoose";

export interface IOTP extends Document {
  mobile: string;
  otpHash: string;
  invitationToken: string;
  name: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    invitationToken: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
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

// Automatically delete OTP after it expires
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const OTP = mongoose.model<IOTP>("OTP", otpSchema);

export default OTP;