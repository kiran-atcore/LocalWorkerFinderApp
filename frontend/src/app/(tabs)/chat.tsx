import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, Image } from 'react-native';
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
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => (router.push as any)('/BlockedList/blocked')} style={styles.headerButton}>
          <Ionicons name="ban-outline" size={24} color="#C62828" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats or users..."
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchConversations} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007AFF20', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
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
    color: '#333',
  },
  chatTime: {
    fontSize: 12,
    color: '#888',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    paddingRight: 10,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
