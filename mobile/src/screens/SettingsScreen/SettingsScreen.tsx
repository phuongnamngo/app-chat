import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.list}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleLogout}
          activeOpacity={0.6}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  list: {
    backgroundColor: '#FFF',
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
