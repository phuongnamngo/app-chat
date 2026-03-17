"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const messageSchema = new mongoose_1.Schema({
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
const Message = mongoose_1.default.model('Message', messageSchema);
exports.default = Message;
//# sourceMappingURL=Message.js.map