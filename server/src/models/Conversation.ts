import mongoose, { Schema, Model } from 'mongoose';
import { IConversation } from '../types';

const conversationSchema = new Schema<IConversation>({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.index({ participants: 1 });

const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);

export default Conversation;