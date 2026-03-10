import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/services/api';
import type { User } from '@/types';

interface UserProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatCreatedAt(createdAt?: string): string {
  if (!createdAt) return '';
  try {
    const date = new Date(createdAt);
    return `Tham gia từ ${date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  } catch {
    return '';
  }
}

export function UserProfileSheet({ visible, onClose }: UserProfileSheetProps) {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    userAPI
      .getMe()
      .then((res) => {
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setProfile(authUser);
        }
      })
      .catch(() => {
        setProfile(authUser ?? null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [visible, authUser]);

  const displayUser = profile ?? authUser;
  const name = displayUser?.name ?? 'User';
  const email = displayUser?.email ?? '';
  const createdAt = displayUser?.createdAt;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheetContainer} pointerEvents="box-none">
        <TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : (
              <>
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(name) }]}>
                  <Text style={styles.avatarText}>{getInitials(name)}</Text>
                </View>
                <Text style={styles.name}>{name}</Text>
                {email ? <Text style={styles.email}>{email}</Text> : null}
                {createdAt ? (
                  <Text style={styles.createdAt}>{formatCreatedAt(createdAt)}</Text>
                ) : null}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Đóng</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
    marginBottom: 20,
  },
  loading: {
    paddingVertical: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  createdAt: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
