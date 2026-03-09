import mongoose, { Schema, Model } from 'mongoose';
import { IConversationRead } from '../types';

const conversationReadSchema = new Schema<IConversationRead>(
  {
    userId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    lastReadAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

conversationReadSchema.index({ userId: 1, roomId: 1 }, { unique: true });

const ConversationRead: Model<IConversationRead> =
  mongoose.model<IConversationRead>('ConversationRead', conversationReadSchema);

export default ConversationRead;
