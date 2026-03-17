"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`❌ MongoDB error: ${error.message}`);
        }
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map