import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import { useAuthStore } from '../../store/useAuthStore';

export default function TabsLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { activeRole, user } = useAuthStore();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/core/conversations/unread_count/?role=${activeRole}`);
        setUnreadCount(res.data.unread_count);
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [activeRole, user]);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#1E1E1E',
      },
      tabBarActiveTintColor: '#FFC107',
      tabBarInactiveTintColor: '#A0A0A0',
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="home-outline" size={focused ? size : size - 6} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="list-outline" size={focused ? size : size - 6} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="chatbubbles-outline" size={focused ? size : size - 6} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="person-outline" size={focused ? size : size - 6} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}