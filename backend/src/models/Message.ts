import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema =
  new Schema<IMessage>(
    {
      conversation: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
      },

      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },

      readAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

const Message =
  mongoose.model<IMessage>(
    "Message",
    messageSchema
  );

export default Message;