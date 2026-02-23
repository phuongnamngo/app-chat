import mongoose, { Schema, Model } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: [5000, 'Message too long'],
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

// Index để query nhanh hơn
messageSchema.index({ roomId: 1, timestamp: -1 });

const Message: Model<IMessage> = mongoose.model<IMessage>(
  'Message',
  messageSchema
);

export default Message;