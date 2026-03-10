import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from '@/navigation/rootRef';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Screens } from '@/navigation/constants';
import { useTheme } from '@/theme';

import { useAuth } from '@/context/AuthContext';
import LoginScreen from '@/screens/LoginScreen/LoginScreen';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '@/types';
import RegisterScreen from '@/screens/Register/RegisterScreen';
import MainTabs from '@/navigation/MainTabs';

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
          // ===== Đã đăng nhập: Main = Bottom Tabs (Chat | Menu) =====
          <Stack.Screen
            name={Screens.Main}
            component={MainTabs}
            options={{ title: 'Main' }}
          />
        ) : (
          // ===== Chưa đăng nhập =====
          <>
            <Stack.Screen
              name={Screens.Login}
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name={Screens.Register}
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
