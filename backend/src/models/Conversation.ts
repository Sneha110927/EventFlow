import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IConversation extends Document {
  admin: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema =
  new Schema<IConversation>(
    {
      admin: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      participant: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },

      lastMessageAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

conversationSchema.index(
  {
    admin: 1,
    participant: 1,
  },
  {
    unique: true,
  }
);

const Conversation =
  mongoose.model<IConversation>(
    "Conversation",
    conversationSchema
  );

export default Conversation;