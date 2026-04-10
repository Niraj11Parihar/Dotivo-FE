import { Tabs } from 'expo-router';
import React from 'react';
import { Target, Calendar, CheckSquare, Image as ImageIcon } from 'lucide-react-native';
import { theme } from '../config/constants/theme';

export function TabNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallpaper"
        options={{
          title: 'Wallpaper',
          tabBarIcon: ({ color }) => <ImageIcon size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
