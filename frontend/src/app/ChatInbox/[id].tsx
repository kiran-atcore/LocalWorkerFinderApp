import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/axios';

export default function ChatInboxId() {
  const { id, name, other_user_id, profile_photo } = useLocalSearchParams();
  const router = useRouter();
  const { user, activeRole } = useAuthStore();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);

  const fetchMessages = useCallback(async (overrideId?: string) => {
    if (other_user_id) {
      try {
        const blockRes = await api.get(`/core/blocks/check/?other_user_id=${other_user_id}&role=${activeRole}`);
        setIsBlockedByMe(blockRes.data.is_blocked_by_me);
        setIsBlockedByOther(blockRes.data.is_blocked_by_other);
      } catch (e) {
        console.error('Failed to fetch block status', e);
      }
    }

    let currentId = overrideId || id;
    if (currentId === 'new' && other_user_id) {
      try {
        const findRes = await api.get(`/core/conversations/find/?other_user_id=${other_user_id}&role=${activeRole}`);
        if (findRes.data.id) {
          currentId = findRes.data.id.toString();
          router.setParams({ id: currentId });
          // Do not return here, continue to fetch messages with the found ID!
        }
      } catch (e) {
        console.error('Failed to find conversation', e);
      }
    }

    if (!currentId || currentId === 'new') return;
    try {
      const res = await api.get(`/core/messages/?conversation_id=${currentId}&role=${activeRole}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }, [id, activeRole, other_user_id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      let conversationId = id;
      if (conversationId === 'new') {
        const convRes = await api.post('/core/conversations/', { user_id: other_user_id, role: activeRole });
        conversationId = convRes.data.id;
        router.setParams({ id: conversationId });
      }

      await api.post('/core/messages/', {
        conversation_id: conversationId,
        text: textToSend
      });
      fetchMessages(conversationId.toString());
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('Failed to send message', err);
      Alert.alert('Error', err.response?.data?.error || 'Could not send message.');
    }
  };

  const handleMessageOptions = (msg: any) => {
    const isMyMessage = msg.sender?.id === user?.id;

    const options = isMyMessage 
      ? [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Unsend", 
            style: "destructive",
            onPress: async () => {
              try {
                await api.delete(`/core/messages/${msg.id}/`);
                fetchMessages();
              } catch (err) {
                console.error('Failed to unsend message', err);
              }
            }
          },
          { 
            text: "Clear", 
            style: "default",
            onPress: async () => {
              try {
                await api.post(`/core/messages/${msg.id}/clear/?role=${activeRole}`);
                fetchMessages();
              } catch (err) {
                console.error('Failed to clear message', err);
              }
            }
          }
        ]
      : [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Clear", 
            style: "destructive",
            onPress: async () => {
              try {
                await api.post(`/core/messages/${msg.id}/clear/?role=${activeRole}`);
                fetchMessages();
              } catch (err) {
                console.error('Failed to clear message', err);
              }
            }
          }
        ];

    Alert.alert(
      "Message Options",
      "What would you like to do with this message?",
      options as any
    );
  };

  const handleClearChat = () => {
    if (id === 'new') return;
    Alert.alert(
      "Clear Chat",
      "Delete this entire conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.post(`/core/conversations/${id}/clear/?role=${activeRole}`);
              router.back();
            } catch (err) {
              console.error('Failed to clear chat', err);
            }
          }
        }
      ]
    );
  };

  const handleBlockUser = () => {
    if (!other_user_id) return;
    Alert.alert(
      "Block User",
      "Are you sure you want to block this user?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Block", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.post('/core/blocks/', { blocked_id: other_user_id, role: activeRole });
              Alert.alert("Success", "User blocked successfully.");
              router.back();
            } catch (err) {
              console.error('Failed to block user', err);
              Alert.alert("Error", "Could not block user.");
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender?.id === user?.id;
    const timeString = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        <TouchableOpacity 
          style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}
          onLongPress={isBlockedByOther ? undefined : () => handleMessageOptions(item)}
          delayLongPress={500}
          activeOpacity={isBlockedByOther ? 1 : 0.2}
        >
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>{item.text}</Text>
          <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>{timeString}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleUnblockUser = async () => {
    if (!other_user_id) return;
    try {
      await api.post('/core/blocks/unblock/', { blocked_id: other_user_id, role: activeRole });
      setIsBlockedByMe(false);
      Alert.alert("Success", "User unblocked successfully.");
    } catch (err) {
      console.error('Failed to unblock user', err);
      Alert.alert("Error", "Could not unblock user.");
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            {profile_photo ? (
              <Image source={{ uri: profile_photo as string }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{name ? (name as string).charAt(0) : 'U'}</Text>
              </View>
            )}
            <Text style={styles.headerTitle}>{name || 'User'}</Text>
          </View>
          {!isBlockedByOther && (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleClearChat} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={22} color="#C62828" />
              </TouchableOpacity>
              {!isBlockedByMe && (
                <TouchableOpacity onPress={handleBlockUser} style={styles.actionButton}>
                  <Ionicons name="ban-outline" size={22} color="#C62828" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isBlockedByOther ? (
          <View style={styles.blockedBadgeContainer}>
            <Text style={styles.blockedBadgeText}>You Have Been Blocked</Text>
          </View>
        ) : isBlockedByMe ? (
          <View style={styles.unblockContainer}>
            <TouchableOpacity style={styles.unblockButton} onPress={handleUnblockUser}>
              <Text style={styles.unblockButtonText}>Tap to Unblock</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarImage: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#1976D2' },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  messageList: {
    padding: 15,
  },
  messageWrapper: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  messageWrapperMe: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOther: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A5CFFF',
  },
  blockedBadgeContainer: {
    padding: 15,
    backgroundColor: '#f8d7da',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5c6cb',
  },
  blockedBadgeText: {
    color: '#721c24',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unblockContainer: {
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  unblockButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});