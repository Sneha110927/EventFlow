import mongoose, {
  Document as MongoDocument,
  Schema,
} from "mongoose";

export interface IDocument extends MongoDocument {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;

  name: string;
  originalName: string;
  filename: string;
  path: string;

  mimetype: string;
  size: number;

  status: "pending" | "approved" | "rejected";

  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    filename: {
      type: String,
      required: true,
    },

    path: {
      type: String,
      required: true,
    },

    mimetype: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const EventDocument =
  mongoose.model<IDocument>(
    "Document",
    documentSchema
  );

export default EventDocument;