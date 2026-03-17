"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const router = (0, express_1.Router)();
// ======= LƯU FCM TOKEN =======
router.post('/token', auth_1.default, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.userId;
        if (!fcmToken) {
            res.status(400).json({
                success: false,
                error: 'FCM token is required',
            });
            return;
        }
        await notificationService_1.default.saveToken(userId, fcmToken);
        res.json({
            success: true,
            message: 'FCM token saved successfully',
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ success: false, error: message });
    }
});
// ======= XÓA FCM TOKEN (khi logout) =======
router.delete('/token', auth_1.default, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.userId;
        if (!fcmToken) {
            res.status(400).json({
                success: false,
                error: 'FCM token is required',
            });
            return;
        }
        await notificationService_1.default.removeToken(userId, fcmToken);
        res.json({
            success: true,
            message: 'FCM token removed successfully',
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ success: false, error: message });
    }
});
exports.default = router;
//# sourceMappingURL=notification.js.map