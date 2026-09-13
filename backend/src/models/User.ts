import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  mobile?: string;
  role: "admin" | "participant";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["admin", "participant"],
      default: "participant",
    },

    
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;