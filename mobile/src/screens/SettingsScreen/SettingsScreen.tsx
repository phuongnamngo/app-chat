import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/services/api';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccountPress = () => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }
    setDeleting(true);
    try {
      const res = await userAPI.deleteMe(deletePassword.trim());
      if (res.success) {
        setDeleteModalVisible(false);
        await logout();
      } else {
        Alert.alert('Lỗi', res.error || 'Xóa tài khoản thất bại');
      }
    } catch (error: unknown) {
      const responseData = (error as { response?: { data?: { error?: string } } })
        ?.response?.data;
      const message =
        typeof responseData?.error === 'string'
          ? responseData.error
          : error instanceof Error
            ? error.message
            : 'Xóa tài khoản thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setDeleting(false);
    }
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
        <TouchableOpacity
          style={[styles.row, styles.deleteRow]}
          onPress={handleDeleteAccountPress}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteText}>Xóa tài khoản</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xóa tài khoản</Text>
            <Text style={styles.modalMessage}>
              Hành động này không thể hoàn tác. Nhập mật khẩu để xác nhận.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              secureTextEntry
              editable={!deleting}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => !deleting && setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, deleting && styles.modalButtonDisabled]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Xóa tài khoản</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deleteRow: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  modalCancelText: { color: '#333', fontWeight: '600' },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FF3B30',
  },
  modalButtonDisabled: { backgroundColor: '#B0B0B0' },
  modalConfirmText: { color: '#FFF', fontWeight: '600' },
});
