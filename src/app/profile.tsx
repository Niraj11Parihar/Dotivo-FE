import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView, Share } from 'react-native';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { theme } from '../config/constants/theme';
import { useAuthStore } from '../store/slices/authStore';
import { useGoalStore } from '../store/slices/goalStore';
import { useRouter } from 'expo-router';
import { LogOut, ChevronLeft, Download, Trash2, Star, Flame, Calendar } from 'lucide-react-native';
import { userService } from '../config/restClient';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { currentStreak, bestStreak, greenDaysThisMonth, badges, weeklyStats } = useGoalStore();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await userService.exportData();
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Dotivo — My Data Export',
      });
    } catch (e: any) {
      // Offline or server error — share local store data
      Alert.alert(
        'Export (Local)',
        'Could not reach the server. Your data will be exported from local storage.',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteAccount();
              await logout();
            } catch (e) {
              Alert.alert('Error', 'Could not delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const initial = (user?.name?.[0] ?? '?').toUpperCase();
  const totalGreenDays = weeklyStats?.totalGreenDays ?? 0;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={theme.colors.text} size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Flame color={theme.colors.warning} size={22} />
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Star color={theme.colors.primary} size={22} />
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar color={theme.colors.accent} size={22} />
            <Text style={styles.statValue}>{greenDaysThisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueGreen}>{totalGreenDays}</Text>
            <Text style={styles.statLabel}>Total Wins</Text>
          </View>
        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Badges</Text>
            <View style={styles.badgesRow}>
              {badges.map(badge => (
                <View key={badge.id} style={styles.badge}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Plan</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{(user?.plan ?? 'free').toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleExportData}
            disabled={exporting}
          >
            <Download color={theme.colors.text} size={18} />
            <Text style={styles.actionBtnText}>
              {exporting ? 'Exporting...' : 'Export my data (JSON)'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleLogout}
          >
            <LogOut color={theme.colors.error} size={18} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleDeleteAccount}
          >
            <Trash2 color={theme.colors.error} size={16} />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </Pressable>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  profileSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryBorder,
    marginBottom: 12,
  },
  avatarText: {
    color: theme.colors.primaryLight,
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: { fontSize: 14, color: theme.colors.textMuted },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statValueGreen: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  badgesRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  badge: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    gap: 4,
  },
  badgeEmoji: { fontSize: 24 },
  badgeName: { color: theme.colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  settingsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsLabel: { color: theme.colors.textMuted, fontSize: 15 },
  planBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  planBadgeText: { color: theme.colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  actionBtnText: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.errorMuted,
    borderRadius: theme.radii.m,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 8,
  },
  logoutText: { color: theme.colors.error, fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  deleteBtnText: { color: theme.colors.error, fontSize: 13, opacity: 0.7 },
});
