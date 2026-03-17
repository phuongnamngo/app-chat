import { PushNotificationData } from '../types';
interface SendNotificationParams {
    recipientId: string;
    title: string;
    body: string;
    data: PushNotificationData;
}
interface BatchResult {
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
}
declare class NotificationService {
    sendToUser({ recipientId, title, body, data, }: SendNotificationParams): Promise<BatchResult>;
    sendToUsers(recipientIds: string[], title: string, body: string, data: PushNotificationData): Promise<void>;
    saveToken(userId: string, fcmToken: string): Promise<void>;
    removeToken(userId: string, fcmToken: string): Promise<void>;
    private removeInvalidTokens;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notificationService.d.ts.map