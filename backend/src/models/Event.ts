import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  name: string;
  type: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;

  modules: {
    participants: boolean;
    registration: boolean;
    schedule: boolean;
    documents: boolean;
    announcements: boolean;
    chat: boolean;
    accommodation: boolean;
    travel: boolean;
  };

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    location: {
      type: String,
      trim: true,
    },

    modules: {
      participants: {
        type: Boolean,
        default: true,
      },

      registration: {
        type: Boolean,
        default: true,
      },

      schedule: {
        type: Boolean,
        default: true,
      },

      documents: {
        type: Boolean,
        default: true,
      },

      announcements: {
        type: Boolean,
        default: true,
      },

      chat: {
        type: Boolean,
        default: true,
      },

      accommodation: {
        type: Boolean,
        default: false,
      },

      travel: {
        type: Boolean,
        default: false,
      },
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model<IEvent>("Event", eventSchema);

export default Event;