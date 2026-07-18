import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/axios';

export default function ChatScreen() {
  const { activeRole, user } = useAuthStore();
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get(`/core/conversations/?role=${activeRole}`);
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchConversations();
    // Simple polling
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const handleDeleteConversation = async (id: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/core/conversations/${id}/?role=${activeRole}`);
              fetchConversations();
            } catch (err) {
              Alert.alert("Error", "Failed to delete chat.");
            }
          }
        }
      ]
    );
  };

  const filteredConversations = conversations.filter((conv: any) => {
    const otherUser = conv.other_participant;
    const nameMatch = otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const msgMatch = conv.last_message?.text?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || msgMatch;
  });

  const renderChatItem = ({ item }: { item: any }) => {
    const otherUser = item.other_participant;
    if (!otherUser) return null;

    const name = otherUser.display_name || 'Unknown';
    const unread = item.unread_count > 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => (router.push as any)(`/ChatInbox/${item.id}?other_user_id=${otherUser.id}&name=${encodeURIComponent(name)}&profile_photo=${encodeURIComponent(otherUser.profile_photo || '')}`)}
        onLongPress={() => handleDeleteConversation(item.id)}
      >
        {otherUser.profile_photo ? (
          <Image source={{ uri: otherUser.profile_photo }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, unread && styles.boldText]}>{name}</Text>
            {item.last_message && (
              <Text style={[styles.chatTime, unread && styles.boldText]}>
                {new Date(item.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <View style={styles.chatFooter}>
            <Text style={[styles.lastMessage, unread && styles.boldText]} numberOfLines={1}>
              {item.last_message ? item.last_message.text : 'No messages yet'}
            </Text>
            {item.unread_count > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread_count}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => (router.push as any)('/BlockedList/blocked')} style={styles.headerButton}>
          <Ionicons name="ban-outline" size={24} color="#C62828" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats or users..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchConversations} />}
        />
      )}
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFC107' },
  chatDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatTime: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#A0A0A0',
    flex: 1,
    paddingRight: 10,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFC107',
  },
  unreadBadge: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#121212',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#A0A0A0',
  },
});
