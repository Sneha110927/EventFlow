import mongoose, { Document, Schema } from "mongoose";

export interface IEventParticipant extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: "registered" | "accepted" | "pending";
  registrationCompleted: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventParticipantSchema =
  new Schema<IEventParticipant>(
    {
      // Event the participant belongs to
      event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },

      // User/participant account
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      // Participant's current event status
      status: {
        type: String,
        enum: [
          "registered",
          "accepted",
          "pending",
        ],
        default: "accepted",
      },

      // Whether the participant has completed
      // the event registration
      registrationCompleted: {
        type: Boolean,
        default: false,
      },

      // When the participant joined the event
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

// A user should not be added to the same event twice
eventParticipantSchema.index(
  { event: 1, user: 1 },
  { unique: true }
);

const EventParticipant =
  mongoose.model<IEventParticipant>(
    "EventParticipant",
    eventParticipantSchema
  );

export default EventParticipant;