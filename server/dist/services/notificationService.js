"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = __importDefault(require("../config/firebase"));
const User_1 = __importDefault(require("../models/User"));
class NotificationService {
    // ======= GỬI NOTIFICATION CHO 1 USER =======
    async sendToUser({ recipientId, title, body, data, }) {
        const result = {
            successCount: 0,
            failureCount: 0,
            invalidTokens: [],
        };
        try {
            // Lấy FCM tokens của user
            const user = await User_1.default.findById(recipientId).select('fcmTokens');
            if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
                console.log(`📭 No FCM tokens for user ${recipientId}`);
                return result;
            }
            // Tạo message cho từng token
            const messages = user.fcmTokens.map((token) => ({
                token,
                notification: {
                    title,
                    body,
                },
                data: {
                    roomId: data.roomId,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    message: data.message,
                    messageType: data.messageType,
                    timestamp: data.timestamp,
                    type: 'chat_message',
                },
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'chat_messages',
                        priority: 'high',
                        defaultSound: true,
                        defaultVibrateTimings: true,
                        icon: 'ic_notification',
                        color: '#007AFF',
                    },
                },
                apns: {
                    headers: {
                        'apns-priority': '10',
                        'apns-push-type': 'alert',
                    },
                    payload: {
                        aps: {
                            alert: {
                                title,
                                body,
                            },
                            sound: 'default',
                            badge: 1,
                            'content-available': 1,
                            'mutable-content': 1,
                        },
                    },
                },
            }));
            // Gửi batch
            const response = await firebase_1.default.messaging().sendEach(messages);
            // Xử lý kết quả
            const invalidTokens = [];
            response.responses.forEach((resp, index) => {
                if (resp.success) {
                    result.successCount++;
                }
                else {
                    result.failureCount++;
                    const errorCode = resp.error?.code;
                    // Token hết hạn hoặc không hợp lệ → xóa
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered' ||
                        errorCode === 'messaging/invalid-argument') {
                        invalidTokens.push(user.fcmTokens[index]);
                    }
                    console.error(`❌ FCM error for token ${index}:`, resp.error?.message);
                }
            });
            // Xóa tokens không hợp lệ khỏi DB
            if (invalidTokens.length > 0) {
                await this.removeInvalidTokens(recipientId, invalidTokens);
                result.invalidTokens = invalidTokens;
            }
            console.log(`📤 Notification sent to user ${recipientId}: ` +
                `${result.successCount} success, ${result.failureCount} failed`);
            return result;
        }
        catch (error) {
            console.error('❌ NotificationService error:', error);
            return result;
        }
    }
    // ======= GỬI CHO NHIỀU USERS =======
    async sendToUsers(recipientIds, title, body, data) {
        const promises = recipientIds.map((id) => this.sendToUser({ recipientId: id, title, body, data }));
        await Promise.allSettled(promises);
    }
    // ======= LƯU FCM TOKEN =======
    async saveToken(userId, fcmToken) {
        try {
            await User_1.default.findByIdAndUpdate(userId, {
                // Thêm token nếu chưa có
                $addToSet: { fcmTokens: fcmToken },
            }, { new: true });
            console.log(`🔑 FCM token saved for user ${userId}`);
        }
        catch (error) {
            console.error('❌ Error saving FCM token:', error);
        }
    }
    // ======= XÓA FCM TOKEN (khi logout) =======
    async removeToken(userId, fcmToken) {
        try {
            await User_1.default.findByIdAndUpdate(userId, {
                $pull: { fcmTokens: fcmToken },
            });
            console.log(`🗑️ FCM token removed for user ${userId}`);
        }
        catch (error) {
            console.error('❌ Error removing FCM token:', error);
        }
    }
    // ======= XÓA TOKENS KHÔNG HỢP LỆ =======
    async removeInvalidTokens(userId, tokens) {
        try {
            await User_1.default.findByIdAndUpdate(userId, {
                $pull: { fcmTokens: { $in: tokens } },
            });
            console.log(`🧹 Removed ${tokens.length} invalid tokens for user ${userId}`);
        }
        catch (error) {
            console.error('❌ Error removing invalid tokens:', error);
        }
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=notificationService.js.map