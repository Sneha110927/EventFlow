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
      event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "registered",
          "accepted",
          "pending",
        ],
        default: "accepted",
      },

  
      registrationCompleted: {
        type: Boolean,
        default: false,
      },

      
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );


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