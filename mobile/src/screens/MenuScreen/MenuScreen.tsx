import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Screens } from '@/navigation/constants';
import type { MenuStackParamList } from '@/types';
import { UserProfileSheet } from '@/components/UserProfileSheet/UserProfileSheet';

type MenuScreenNavigationProp = StackNavigationProp<
  MenuStackParamList,
  'Menu'
>;

interface Props {
  navigation: MenuScreenNavigationProp;
}

export default function MenuScreen({ navigation }: Props) {
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);

  const handleOpenSettings = () => {
    navigation.navigate(Screens.Settings);
  };

  const handleOpenUserProfile = () => {
    setProfileSheetVisible(true);
  };

  const handleOpenEditProfile = () => {
    navigation.navigate(Screens.EditProfile);
  };

  const handleOpenChangePassword = () => {
    navigation.navigate(Screens.ChangePassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.list}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleOpenSettings}
          activeOpacity={0.6}
        >
          <Text style={styles.rowText}>Cài đặt</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={handleOpenUserProfile}
          activeOpacity={0.6}
        >
          <Text style={styles.rowText}>Xem thông tin người dùng</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={handleOpenEditProfile}
          activeOpacity={0.6}
        >
          <Text style={styles.rowText}>Chỉnh sửa hồ sơ</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={handleOpenChangePassword}
          activeOpacity={0.6}
        >
          <Text style={styles.rowText}>Đổi mật khẩu</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
      <UserProfileSheet
        visible={profileSheetVisible}
        onClose={() => setProfileSheetVisible(false)}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowText: {
    fontSize: 16,
    color: '#333',
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
  },
});
