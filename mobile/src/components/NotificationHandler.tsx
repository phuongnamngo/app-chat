import React, { useEffect, useRef } from 'react';
import {
  getInitialNotification,
  onNotificationOpenedApp,
} from '@/services/firebaseMessaging';
import { navigateToChat } from '@/navigation/rootRef';
import { storage } from '@/App';

/**
 * Sets up FCM notification open handlers (app opened from notification).
 * Navigates to Chat when user taps notification; reads user from storage.
 */
export function NotificationHandler(): React.ReactElement | null {
  const handledInitial = useRef(false);

  useEffect(() => {
    const unsubscribe = onNotificationOpenedApp((data) => {
      const userStr = storage.getString('user');
      if (!userStr) return;
      try {
        const user = JSON.parse(userStr) as { id: string; name: string };
        navigateToChat({
          roomId: data.roomId,
          userId: user.id,
          userName: user.name,
          otherUserName: data.senderName || undefined,
        });
      } catch {
        // ignore
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (handledInitial.current) return;
    handledInitial.current = true;

    const t = setTimeout(async () => {
      const data = await getInitialNotification();
      if (!data) return;
      const userStr = storage.getString('user');
      if (!userStr) return;
      try {
        const user = JSON.parse(userStr) as { id: string; name: string };
        navigateToChat({
          roomId: data.roomId,
          userId: user.id,
          userName: user.name,
          otherUserName: data.senderName || undefined,
        });
      } catch {
        // ignore
      }
    }, 800);

    return () => clearTimeout(t);
  }, []);

  return null;
}
