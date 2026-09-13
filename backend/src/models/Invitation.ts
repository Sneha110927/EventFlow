import mongoose, { Document, Schema } from "mongoose";

export interface IInvitation extends Document {
  event: mongoose.Types.ObjectId;
  email: string;
  name: string;
  invitedBy: mongoose.Types.ObjectId;

  status: "pending" | "accepted" | "expired";

  token: string;
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invitation = mongoose.model<IInvitation>(
  "Invitation",
  invitationSchema
);

export default Invitation;