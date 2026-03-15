import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { MenuStackParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/services/api';

type NavProp = StackNavigationProp<MenuStackParamList, 'ChangePassword'>;

interface Props {
  navigation: NavProp;
}

export default function ChangePasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!currentPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    setSubmitting(true);
    try {
      const res = await userAPI.changePassword(currentPassword.trim(), newPassword);
      if (res.success) {
        Alert.alert('Thành công', 'Đã đổi mật khẩu', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setErrorMessage(res.error || 'Đổi mật khẩu thất bại');
      }
    } catch (error: unknown) {
      const responseData = (error as { response?: { data?: { error?: string } } })
        ?.response?.data;
      const message =
        typeof responseData?.error === 'string'
          ? responseData.error
          : error instanceof Error
            ? error.message
            : 'Đổi mật khẩu thất bại';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Mật khẩu hiện tại</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Nhập mật khẩu hiện tại"
          placeholderTextColor="#999"
          secureTextEntry
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Mật khẩu mới</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Ít nhất 6 ký tự"
          placeholderTextColor="#999"
          secureTextEntry
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
          placeholderTextColor="#999"
          secureTextEntry
        />
      </View>
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Xác nhận</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16, paddingTop: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  errorText: { color: '#FF3B30', fontSize: 14, marginBottom: 12 },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#B0B0B0' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
