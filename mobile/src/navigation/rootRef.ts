import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToChat(params: {
  roomId: string;
  userId: string;
  userName: string;
  otherUserName?: string;
}): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Chat', params);
  }
}
