import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { Screens } from '@/navigation/constants';
import type { MenuStackParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { userAPI, API_BASE } from '@/services/api';

type NavProp = StackNavigationProp<MenuStackParamList, 'EditProfile'>;

interface Props {
  navigation: NavProp;
}

export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleChooseImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setAvatarUri(asset.uri);
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      } as unknown as Blob);
      const res = await userAPI.uploadAvatar(formData);
      if (res.success && res.data) {
        await updateUser(res.data);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert('Lỗi', 'Tên phải từ 2 ký tự trở lên');
      return;
    }
    if (!trimmedEmail) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    setSaving(true);
    try {
      const res = await userAPI.patchMe({ name: trimmedName, email: trimmedEmail });
      if (res.success && res.data) {
        await updateUser(res.data);
        Alert.alert('Thành công', 'Đã cập nhật thông tin', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', res.error || 'Cập nhật thất bại');
      }
    } catch (error: unknown) {
      const responseData = (error as { response?: { data?: { error?: string } } })
        ?.response?.data;
      const message =
        typeof responseData?.error === 'string'
          ? responseData.error
          : error instanceof Error
            ? error.message
            : 'Cập nhật thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const displayAvatar = avatarUri || (user.avatar ? `${API_BASE}${user.avatar}` : null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={handleChooseImage}
          disabled={uploadingAvatar}
        >
          {uploadingAvatar ? (
            <ActivityIndicator color="#007AFF" />
          ) : displayAvatar ? (
            <Image
              source={{ uri: displayAvatar }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarHint}>Chọn ảnh đại diện</Text>
          )}
        </TouchableOpacity>
        {displayAvatar && !uploadingAvatar && (
          <Text style={styles.avatarChangeLabel}>Chạm để đổi ảnh</Text>
        )}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Tên</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nhập tên"
          placeholderTextColor="#999"
          autoCapitalize="words"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Lưu</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate(Screens.ChangePassword)}
      >
        <Text style={styles.secondaryButtonText}>Đổi mật khẩu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingTop: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 100, height: 100 },
  avatarChangeLabel: { fontSize: 12, color: '#666', marginTop: 6 },
  avatarHint: { fontSize: 14, color: '#666' },
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
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { backgroundColor: '#B0B0B0' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
});
