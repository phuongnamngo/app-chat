"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png'];
const UPLOAD_DIR = path_1.default.join(__dirname, '..', '..', 'uploads', 'avatars');
// Đảm bảo thư mục tồn tại
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Chỉ chấp nhận ảnh JPEG hoặc PNG'));
    }
};
const uploadAvatar = (0, multer_1.default)({
    storage,
    limits: { fileSize: AVATAR_MAX_SIZE },
    fileFilter,
});
exports.default = uploadAvatar;
//# sourceMappingURL=uploadAvatar.js.map