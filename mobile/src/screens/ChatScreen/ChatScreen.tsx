import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ListRenderItem,
  Keyboard,
  Image,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { getSocket } from '@/services/socket';
import { messageAPI, conversationAPI } from '@/services/api';
import { Message, RootStackParamList } from '@/types';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { roomId, userId, userName } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isStickerTrayOpen, setIsStickerTrayOpen] = useState<boolean>(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);
  const socket = getSocket();

  const STICKERS: string[] = useMemo(
    () => [
      // Tạm hardcode URL (CDN) – có thể thay bằng endpoint/packs sau
      'https://media.tenor.com/2roX3uxz_68AAAAC/cat-cute.gif',
      'https://media.tenor.com/6gHLhmwO87sAAAAC/cat.gif',
      'https://media.tenor.com/1DqvS2mGmE8AAAAC/duck.gif',
      'https://media.tenor.com/2b6zY2Jc7SMAAAAC/hi-hello.gif',
      'https://media.tenor.com/5b4C6y8m3wUAAAAC/love.gif',
      'https://media.tenor.com/5fLQ6pP7mQYAAAAC/ok.gif',
    ],
    []
  );

  const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    const words = trimmed.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase();
  };

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

  // Mark room as read when entering chat
  useEffect(() => {
    conversationAPI.markAsRead(roomId).catch(() => {});
  }, [roomId]);

  // Load lịch sử tin nhắn
  useEffect(() => {
    const loadMessages = async (): Promise<void> => {
      try {
        const response = await messageAPI.getMessages(roomId);
        if (response.success && response.data) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [roomId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join_room', roomId);

    // Nhận tin nhắn
    const handleReceiveMessage = (data: Message): void => {
      setMessages((prev) => [...prev, data]);
    };

    // Typing indicators
    const handleUserTyping = (data: {
      userId: string;
      userName: string;
    }): void => {
      if (data.userId !== userId) {
        setTypingUser(data.userName);
      }
    };

    const handleStopTyping = (): void => {
      setTypingUser(null);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [roomId, socket, userId]);

  // Gửi tin nhắn
  const sendTextMessage = useCallback((): void => {
    if (!inputText.trim() || !socket) return;

    socket.emit('send_message', {
      roomId,
      senderId: userId,
      senderName: userName,
      message: inputText.trim(),
      messageType: 'text',
    });

    socket.emit('stop_typing', { roomId, userId });
    setInputText('');
    setIsTyping(false);
  }, [inputText, roomId, userId, userName, socket]);

  const sendSticker = useCallback(
    (stickerUrl: string): void => {
      if (!socket) return;
      socket.emit('send_message', {
        roomId,
        senderId: userId,
        senderName: userName,
        message: stickerUrl,
        messageType: 'sticker',
      });
      socket.emit('stop_typing', { roomId, userId });
      setIsTyping(false);
      setIsStickerTrayOpen(false);
    },
    [roomId, socket, userId, userName]
  );

  // Typing handler
  const handleTyping = useCallback(
    (text: string): void => {
      setInputText(text);

      if (!socket) return;

      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { roomId, userId, userName });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop_typing', { roomId, userId });
      }, 2000);
    },
    [isTyping, roomId, userId, userName, socket]
  );

  // Format time
  const formatTime = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderedMessages = useMemo(
    () => [...messages].reverse(),
    [messages]
  );

  // Render tin nhắn
  const renderMessage: ListRenderItem<Message> = useCallback(
    ({ item }) => {
      const isMyMessage = item.senderId === userId;
      const initials = getInitials(item.senderName);
      const avatarColor = getAvatarColor(item.senderName);
      const isSticker = item.messageType === 'sticker';

      return (
        <View
          style={[
            styles.messageRow,
            isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
          ]}
        >
          {!isMyMessage && (
            <View
              style={[
                styles.messageAvatar,
                { backgroundColor: avatarColor },
              ]}
            >
              <Text style={styles.messageAvatarText}>{initials}</Text>
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessage : styles.otherMessage,
              isSticker && styles.stickerBubble,
            ]}
          >
            {!isMyMessage && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            {isSticker ? (
              <Image
                source={{ uri: item.message }}
                style={styles.stickerImage}
              />
            ) : (
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {item.message}
              </Text>
            )}
            <Text
              style={[
                styles.timestamp,
                isMyMessage
                  ? styles.myTimestamp
                  : styles.otherTimestamp,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      );
    },
    [userId]
  );

  const keyExtractor = useCallback(
    (_item: Message, index: number): string => index.toString(),
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={renderedMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageList}
        inverted
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios' ? 'interactive' : 'on-drag'
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {typingUser && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>{typingUser} đang gõ...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => {
            // Emoji keyboard: chỉ focus input, user tự chuyển sang emoji keyboard của OS
            setIsStickerTrayOpen(false);
            inputRef.current?.focus();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.toolButtonText}>🙂</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => {
            // Sticker tray: mở panel trong app, và ẩn keyboard để giống Messenger
            Keyboard.dismiss();
            setIsStickerTrayOpen((v) => !v);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.toolButtonText}>🧩</Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendTextMessage}
          disabled={!inputText.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {isStickerTrayOpen && (
        <View style={styles.stickerTray}>
          <View style={styles.stickerTrayHeader}>
            <Text style={styles.stickerTrayTitle}>Sticker</Text>
            <TouchableOpacity
              onPress={() => setIsStickerTrayOpen(false)}
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
            >
              <Text style={styles.stickerTrayClose}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.stickerGrid}>
            {STICKERS.map((url) => (
              <TouchableOpacity
                key={url}
                style={styles.stickerItem}
                onPress={() => sendSticker(url)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: url }} style={styles.stickerThumb} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
    marginLeft: 40,
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
    marginRight: 40,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333333',
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTimestamp: {
    color: 'rgba(0,0,0,0.4)',
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: '#F2F2F7',
  },
  toolButtonText: {
    fontSize: 18,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    color: '#333',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 20,
  },

  stickerBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  stickerImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#EDEDED',
  },
  stickerTray: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
  },
  stickerTrayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  stickerTrayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  stickerTrayClose: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stickerItem: {
    width: '25%',
    padding: 6,
  },
  stickerThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#EDEDED',
  },
});

export default ChatScreen;