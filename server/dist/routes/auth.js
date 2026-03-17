"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || '3a6b5d2b9f8f536613f3d451d7f771c0ffdb620851e2b23db25c22a0a16445ad';
// ============ ĐĂNG KÝ ============
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validate
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                error: 'Vui lòng điền đầy đủ thông tin',
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                error: 'Mật khẩu phải có ít nhất 6 ký tự',
            });
            return;
        }
        // Kiểm tra email tồn tại
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: 'Email đã tồn tại',
            });
            return;
        }
        // Tạo user mới
        const user = new User_1.default({ name, email, password });
        await user.save();
        // Tạo token
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString() }, JWT_SECRET, {
            expiresIn: '7d',
        });
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                },
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ success: false, error: message });
    }
});
// ============ ĐĂNG NHẬP ============
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Vui lòng điền email và mật khẩu',
            });
            return;
        }
        // Tìm user
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({
                success: false,
                error: 'Email không tồn tại',
            });
            return;
        }
        // So sánh password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                error: 'Mật khẩu không đúng',
            });
            return;
        }
        // Tạo token
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString() }, JWT_SECRET, {
            expiresIn: '7d',
        });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                },
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ success: false, error: message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map