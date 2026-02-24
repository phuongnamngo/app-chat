import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '@/services/api';
import { RootStackParamList, User } from '@/types';
import { getSocket } from '@/services/socket';
import { useAuth } from '@/context/AuthContext';

type ChatListNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChatList'
>;

interface Props {
  navigation: ChatListNavigationProp;
}

interface ChatItem {
  user: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { user, logout } = useAuth();
  const socket = getSocket();

  // ======= LOAD DANH SÁCH USERS =======
  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: User[] }>(
        '/users'
      );
      if (response.data.success && response.data.data) {
        // Loại bỏ chính mình khỏi danh sách
        const otherUsers = response.data.data.filter(
          (u: User) => u.id !== user?.id
        );
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // ======= LOAD KHI MỞ MÀN HÌNH =======
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ======= SOCKET: LẮNG NGHE ONLINE STATUS =======
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (userIds: string[]): void => {
      setOnlineUserIds(userIds);
    };

    socket.on('online_users', handleOnlineUsers);

    return () => {
      socket.off('online_users', handleOnlineUsers);
    };
  }, [socket]);

  // ======= TÌM KIẾM =======
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // ======= TẠO ROOM ID (sắp xếp 2 userId để luôn tạo cùng 1 room) =======
  const createRoomId = (userId1: string, userId2: string): string => {
    const sorted = [userId1, userId2].sort();
    return `room_${sorted[0]}_${sorted[1]}`;
  };

  // ======= NAVIGATE ĐẾN CHAT =======
  const handleOpenChat = (otherUser: User): void => {
    if (!user) return;

    const roomId = createRoomId(user.id, otherUser.id);

    navigation.navigate('Chat', {
      roomId,
      userId: user.id,
      userName: user.name,
      otherUserName: otherUser.name,
    });
  };

  // ======= PULL TO REFRESH =======
  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  // ======= HANDLE LOGOUT =======
  const handleLogout = (): void => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  // ======= LẤY CHỮ CÁI ĐẦU LÀM AVATAR =======
  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ======= MÀU NGẪU NHIÊN THEO TÊN =======
  const getAvatarColor = (name: string): string => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F0B27A',
      '#82E0AA',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // ======= FORMAT THỜI GIAN =======
  const formatTime = (dateString: string): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;

    return date.toLocaleDateString('vi-VN');
  };

  // ======= RENDER MỖI USER ITEM =======
  const renderUserItem: ListRenderItem<User> = useCallback(
    ({ item }) => {
      const isOnline = onlineUserIds.includes(item.id);
      const initials = getInitials(item.name);
      const avatarColor = getAvatarColor(item.name);

      return (
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => handleOpenChat(item)}
          activeOpacity={0.6}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {/* Online indicator */}
            <View
              style={[
                styles.onlineIndicator,
                {
                  backgroundColor: isOnline ? '#34C759' : '#C7C7CC',
                },
              ]}
            />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            <View style={styles.userSubInfo}>
              <Text style={styles.userStatus} numberOfLines={1}>
                {isOnline ? '🟢 Đang hoạt động' : '⚫ Ngoại tuyến'}
              </Text>
            </View>
          </View>

          {/* Arrow */}
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>
      );
    },
    [onlineUserIds, user]
  );

  // ======= RENDER EMPTY LIST =======
  const renderEmptyList = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim() ? (
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Không tìm thấy</Text>
          <Text style={styles.emptySubtitle}>
            Không có người dùng nào khớp với "{searchQuery}"
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Chưa có ai</Text>
          <Text style={styles.emptySubtitle}>
            Hãy mời bạn bè đăng ký để bắt đầu trò chuyện
          </Text>
        </>
      )}
    </View>
  );

  // ======= SEPARATOR =======
  const renderSeparator = (): React.ReactElement => (
    <View style={styles.separator} />
  );

  // ======= HEADER =======
  const renderHeader = (): React.ReactElement => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsText}>
        {onlineUserIds.length > 0
          ? `🟢 ${onlineUserIds.length - 1} người đang online`
          : '⚫ Không có ai online'}
      </Text>
    </View>
  );

  // ======= LOADING =======
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  // ======= MAIN RENDER =======
  return (
    <View style={styles.container}>
      {/* Profile Bar */}
      <View style={styles.profileBar}>
        <View style={styles.profileInfo}>
          <View
            style={[
              styles.profileAvatar,
              { backgroundColor: getAvatarColor(user?.name || '') },
            ]}
          >
            <Text style={styles.profileAvatarText}>
              {getInitials(user?.name || 'U')}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm người dùng..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={
          filteredUsers.length === 0 ? styles.emptyFlatList : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // ===== Profile Bar =====
  profileBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  profileEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },
  logoutText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },

  // ===== Search =====
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
  },

  // ===== Stats =====
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 13,
    color: '#666',
  },

  // ===== User Item =====
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  userSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatus: {
    fontSize: 13,
    color: '#999',
    flex: 1,
  },
  arrowIcon: {
    fontSize: 24,
    color: '#C7C7CC',
    marginLeft: 8,
  },

  // ===== Separator =====
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 82,
  },

  // ===== Empty State =====
  emptyFlatList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ChatListScreen;