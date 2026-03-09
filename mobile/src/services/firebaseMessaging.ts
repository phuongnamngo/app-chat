/**
 * Firebase Cloud Messaging (FCM) for push notifications.
 * Requires: google-services.json (Android), GoogleService-Info.plist (iOS).
 * @see https://rnfirebase.io/messaging/usage
 */

import messaging from '@react-native-firebase/messaging';

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    return await messaging().getToken();
  } catch {
    return null;
  }
};

export const onFCMTokenRefresh = (callback: (token: string) => void): (() => void) => {
  const unsubscribe = messaging().onTokenRefresh(callback);
  return unsubscribe;
};

export const getInitialNotification = async (): Promise<{
  roomId: string;
  senderId: string;
  senderName: string;
} | null> => {
  try {
    const remoteMessage = await messaging().getInitialNotification();
    if (!remoteMessage?.data?.roomId) return null;
    return {
      roomId: String(remoteMessage.data.roomId),
      senderId: String(remoteMessage.data.senderId ?? ''),
      senderName: String(remoteMessage.data.senderName ?? ''),
    };
  } catch {
    return null;
  }
};

export const onNotificationOpenedApp = (
  callback: (data: { roomId: string; senderId: string; senderName: string }) => void
): (() => void) => {
  const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
    const roomId = remoteMessage?.data?.roomId;
    if (!roomId) return;
    callback({
      roomId: String(roomId),
      senderId: String(remoteMessage.data?.senderId ?? ''),
      senderName: String(remoteMessage.data?.senderName ?? ''),
    });
  });
  return unsubscribe;
};
