import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types";

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name must be at most 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  avatar: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password trước khi lưu
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password
userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
