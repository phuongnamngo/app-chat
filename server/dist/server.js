"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const messages_1 = __importDefault(require("./routes/messages"));
const conversations_1 = __importDefault(require("./routes/conversations"));
const notification_1 = __importDefault(require("./routes/notification"));
const chatHandler_1 = __importDefault(require("./socket/chatHandler"));
// Load env
dotenv_1.default.config();
// Khởi tạo app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Socket.IO với TypeScript
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});
// ======= MIDDLEWARE =======
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Static: phục vụ file avatar
const uploadsDir = path_1.default.join(__dirname, '..', 'uploads');
app.use('/uploads', express_1.default.static(uploadsDir));
// ======= DATABASE =======
(0, db_1.default)();
// ======= ROUTES =======
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/conversations', conversations_1.default);
app.use('/api/notifications', notification_1.default);
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// ======= SOCKET HANDLER =======
(0, chatHandler_1.default)(io);
// ======= START SERVER =======
const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket ready`);
    console.log(`🔗 http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map