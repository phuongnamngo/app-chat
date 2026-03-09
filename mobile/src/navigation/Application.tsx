import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from '@/navigation/rootRef';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Paths } from '@/navigation/paths';
import { useTheme } from '@/theme';

import { Example, Startup } from '@/screens';
import { useAuth } from '@/context/AuthContext';
import ChatScreen from '@/screens/ChatScreen/ChatScreen';
import LoginScreen from '@/screens/LoginScreen/LoginScreen';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '@/types';
import RegisterScreen from '@/screens/Register/RegisterScreen';
import ChatListScreen from '@/screens/ChatList/ChatListScreen';

const Stack = createStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  const { navigationTheme, variant } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator key={variant} screenOptions={{ headerShown: false }}>
          {/* <Stack.Screen component={Startup} name={Paths.Startup} />
          <Stack.Screen component={Example} name={Paths.Example} /> */}
          {isAuthenticated ? (
          // ===== Đã đăng nhập =====
          <>
            <Stack.Screen
              name="ChatList"
              component={ChatListScreen}
              options={{ title: 'Tin nhắn' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({
                title: route.params.otherUserName || 'Chat',
              })}
            />
          </>
        ) : (
          // ===== Chưa đăng nhập =====
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});
export default ApplicationNavigator;
