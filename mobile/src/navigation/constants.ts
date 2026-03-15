/**
 * Single source of truth for screen names.
 * Use these constants for Stack.Screen name and navigation.navigate().
 */
export const Screens = {
  // Auth
  Login: 'Login',
  Register: 'Register',
  // Main (after login)
  Main: 'Main',
  // Chat tab stack
  ChatList: 'ChatList',
  Chat: 'Chat',
  // Menu tab stack
  Menu: 'Menu',
  Settings: 'Settings',
  EditProfile: 'EditProfile',
  ChangePassword: 'ChangePassword',
} as const;

export type ScreenName = keyof typeof Screens;
