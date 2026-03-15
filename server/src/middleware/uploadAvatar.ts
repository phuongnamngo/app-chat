import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import fs from 'fs';

const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png'];
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận ảnh JPEG hoặc PNG'));
  }
};

const uploadAvatar = multer({
  storage,
  limits: { fileSize: AVATAR_MAX_SIZE },
  fileFilter,
});

export default uploadAvatar;
