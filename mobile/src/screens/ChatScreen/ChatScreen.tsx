import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { getSocket } from '@/services/socket';
import { messageAPI } from '@/services/api';
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
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socket = getSocket();

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
      } finally {
        setIsLoadingHistory(false);
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
  const sendMessage = useCallback((): void => {
    if (!inputText.trim() || !socket) return;

    socket.emit('send_message', {
      roomId,
      senderId: userId,
      senderName: userName,
      message: inputText.trim(),
    });

    socket.emit('stop_typing', { roomId, userId });
    setInputText('');
    setIsTyping(false);
  }, [inputText, roomId, userId, userName, socket]);

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

  // Render tin nhắn
  const renderMessage: ListRenderItem<Message> = useCallback(
    ({ item }) => {
      const isMyMessage = item.senderId === userId;

      return (
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.message}
          </Text>
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
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
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
        <TextInput
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
          onPress={sendMessage}
          disabled={!inputText.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
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
});

export default ChatScreen;