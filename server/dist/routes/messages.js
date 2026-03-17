"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Message_1 = __importDefault(require("../models/Message"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
// Lấy tin nhắn theo room (có phân trang)
router.get('/:roomId', auth_1.default, async (req, res) => {
    try {
        const { roomId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const messages = await Message_1.default.find({ roomId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        // Trả về theo thứ tự cũ → mới
        res.json({
            success: true,
            data: messages.reverse(),
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ success: false, error: message });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map