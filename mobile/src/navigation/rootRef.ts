import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { Screens } from '@/navigation/constants';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToChat(params: {
  roomId: string;
  userId: string;
  userName: string;
  otherUserName?: string;
}): void {
  if (navigationRef.isReady()) {
    // Chat is nested: Main (tabs) > Chat (tab) > Chat (screen)
    navigationRef.navigate(Screens.Main, {
      screen: 'Chat',
      params: {
        screen: Screens.Chat,
        params,
      },
    });
  }
}
