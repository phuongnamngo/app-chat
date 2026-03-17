import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Screens } from '@/navigation/constants';
import type { MainTabParamList, ChatStackParamList, MenuStackParamList } from '@/types';
import ChatListScreen from '@/screens/ChatList/ChatListScreen';
import ChatScreen from '@/screens/ChatScreen/ChatScreen';
import MenuScreen from '@/screens/MenuScreen/MenuScreen';
import SettingsScreen from '@/screens/SettingsScreen/SettingsScreen';
import EditProfileScreen from '@/screens/EditProfileScreen/EditProfileScreen';
import ChangePasswordScreen from '@/screens/ChangePasswordScreen/ChangePasswordScreen';
import { CustomTabBar } from '@/navigation/CustomTabBar';
import type { NavigationState, PartialState } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();
const MenuStack = createStackNavigator<MenuStackParamList>();

function getDeepestActiveRouteName(
  state?: NavigationState | PartialState<NavigationState>
): string | undefined {
  if (!state || !('routes' in state)) return undefined;
  const index = typeof state.index === 'number' ? state.index : 0;
  const route = state.routes?.[index];
  // @react-navigation nested state is attached as `route.state`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childState = (route as any)?.state as
    | NavigationState
    | PartialState<NavigationState>
    | undefined;
  return childState ? getDeepestActiveRouteName(childState) : route?.name;
}

function ChatStackScreen() {
  return (
    <ChatStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <ChatStack.Screen
        name={Screens.ChatList}
        component={ChatListScreen}
        options={{ title: 'Tin nhắn' }}
      />
      <ChatStack.Screen
        name={Screens.Chat}
        component={ChatScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.otherUserName || 'Chat',
          headerBackTitle: 'Tin nhắn',
          headerShadowVisible: false,
        })}
      />
    </ChatStack.Navigator>
  );
}

function MenuStackScreen() {
  return (
    <MenuStack.Navigator screenOptions={{ headerShown: false }}>
      <MenuStack.Screen name={Screens.Menu} component={MenuScreen} />
      <MenuStack.Screen
        name={Screens.Settings}
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Cài đặt',
          headerBackTitle: 'Menu',
        }}
      />
      <MenuStack.Screen
        name={Screens.EditProfile}
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: 'Chỉnh sửa hồ sơ',
          headerBackTitle: 'Menu',
        }}
      />
      <MenuStack.Screen
        name={Screens.ChangePassword}
        component={ChangePasswordScreen}
        options={{
          headerShown: true,
          title: 'Đổi mật khẩu',
          headerBackTitle: 'Quay lại',
        }}
      />
    </MenuStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => {
        const activeTabRoute = props.state.routes[props.state.index];
        const activeNestedRouteName = getDeepestActiveRouteName(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (activeTabRoute as any)?.state
        );

        const shouldHideTabBar =
          activeTabRoute.name === 'Chat' &&
          activeNestedRouteName === Screens.Chat;

        if (shouldHideTabBar) return null;
        return <CustomTabBar {...props} />;
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatStackScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuStackScreen}
        options={{ tabBarLabel: 'Menu' }}
      />
    </Tab.Navigator>
  );
}
