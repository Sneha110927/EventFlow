import mongoose, { Document, Schema } from "mongoose";

export interface IAnnouncement extends Document {
  event: mongoose.Types.ObjectId;
  title: string;
  content: string;

  target: "all" | "confirmed" | "pending";

  sentBy: mongoose.Types.ObjectId;

  readBy: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    target: {
      type: String,
      enum: ["all", "confirmed", "pending"],
      default: "all",
      required: true,
    },

    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Announcement = mongoose.model<IAnnouncement>(
  "Announcement",
  announcementSchema
);

export default Announcement;
