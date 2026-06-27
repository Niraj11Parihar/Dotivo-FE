import { Tabs } from 'expo-router';
import React from 'react';
import { Target, CalendarDays, CheckCircle2, Image as ImageIcon } from 'lucide-react-native';
import { theme } from '../config/constants/theme';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';

export function TabNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primaryLight,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(10, 10, 10, 0.3)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}>
            <BlurView intensity={80} tint="dark" style={{ flex: 1 }} />
          </View>
        ),
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: 'rgba(25, 217, 148, 0.15)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            } : { paddingHorizontal: 16, paddingVertical: 8 }}>
              <CheckCircle2
                size={22}
                color={focused ? theme.colors.primaryLight : color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: 'rgba(25, 217, 148, 0.15)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            } : { paddingHorizontal: 16, paddingVertical: 8 }}>
              <CalendarDays
                size={22}
                color={focused ? theme.colors.primaryLight : color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallpaper"
        options={{
          title: 'Wallpaper',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? {
              backgroundColor: 'rgba(25, 217, 148, 0.15)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            } : { paddingHorizontal: 16, paddingVertical: 8 }}>
              <ImageIcon
                size={22}
                color={focused ? theme.colors.primaryLight : color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
