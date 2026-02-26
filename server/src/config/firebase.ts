import admin from 'firebase-admin';
import path from 'path';

// Load service account
const serviceAccount = require(
  path.join(__dirname, 'firebase-service-account.json')
);

// Khởi tạo Firebase Admin (chỉ 1 lần)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;