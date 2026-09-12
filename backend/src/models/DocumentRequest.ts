import mongoose, {
  Document as MongoDocument,
  Schema,
} from "mongoose";

export type DocumentRequestStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected";

export interface IDocumentRequest
  extends MongoDocument {
  event: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId;

  documentName: string;
  description?: string;

  required: boolean;
  deadline: Date;

  status: DocumentRequestStatus;

  document?: mongoose.Types.ObjectId;

  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const documentRequestSchema =
  new Schema<IDocumentRequest>(
    {
      event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
        index: true,
      },

      participant: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      documentName: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        trim: true,
      },

      required: {
        type: Boolean,
        default: true,
      },

      deadline: {
        type: Date,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "submitted",
          "approved",
          "rejected",
        ],
        default: "pending",
        required: true,
      },

      document: {
        type: Schema.Types.ObjectId,
        ref: "Document",
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

documentRequestSchema.index({
  event: 1,
  participant: 1,
  createdAt: -1,
});

const DocumentRequest =
  mongoose.model<IDocumentRequest>(
    "DocumentRequest",
    documentRequestSchema
  );

export default DocumentRequest;