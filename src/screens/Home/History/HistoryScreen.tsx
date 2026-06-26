import React, { useEffect, useRef, useCallback } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, Platform, Share,
} from 'react-native';
import { Card } from '../../../components/common/Card';
import { ScreenWrapper } from '../../../components/common/ScreenWrapper';
import { theme } from '../../../config/constants/theme';
import { useGoalStore } from '../../../store/slices/goalStore';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function interpolateColor(score: number): string {
  const t = Math.max(0, Math.min(1, score));
  const from = { r: 0x1E, g: 0x2D, b: 0x45 };
  const to = { r: 0x10, g: 0xB9, b: 0x81 };
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {sub ? <Text style={statStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.cardElevated,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  icon: { fontSize: 24, marginBottom: 8 },
  label: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 4, textAlign: 'center' },
  value: { color: theme.colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: theme.colors.textFaint, fontSize: 10, marginTop: 4 },
});

export default function HistoryScreen() {
  const {
    history, fetchHistory, isLoading,
    currentStreak, bestStreak, greenDaysThisMonth,
    weeklyStats, badges, historyRange, setHistoryRange,
  } = useGoalStore();

  const shareRef = useRef<View>(null);

  useEffect(() => {
    fetchHistory(historyRange);
  }, []);

  const greenDays = history.filter((d) => d.status === 'green').length;

  const handleShareCard = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not supported', 'Sharing is not supported on web.');
        return;
      }
      const uri = await captureRef(shareRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Dotivo progress',
        });
      } else {
        await Share.share({ url: uri });
      }
    } catch (e) {
      Alert.alert('Share failed', 'Please run a development build to enable sharing.');
    }
  }, []);

  const RANGE_OPTIONS: Array<7 | 30 | 90> = [7, 30, 90];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Your momentum over time.</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareCard}>
            <Text style={styles.shareBtnText}>Share 📤</Text>
          </TouchableOpacity>
        </View>

        {/* Range Toggle */}
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, historyRange === r && styles.rangeBtnActive]}
              onPress={() => setHistoryRange(r)}
            >
              <Text style={[styles.rangeBtnText, historyRange === r && styles.rangeBtnTextActive]}>
                {r}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State Message */}
        {greenDays === 0 && (
          <View style={styles.emptyJourneyCard}>
            <Text style={styles.emptyJourneyTitle}>Your journey starts today.</Text>
            <Text style={styles.emptyJourneySub}>Complete 1 goal to light up your first dot in the constellation below.</Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="🟢"
            label="GREEN DAYS"
            value={String(greenDays)}
            sub={`of ${historyRange} days`}
          />
          <StatCard
            icon="🔥"
            label="STREAK"
            value={currentStreak > 0 ? `${currentStreak}d` : '0d'}
            sub="current"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="🏆"
            label="BEST STREAK"
            value={bestStreak > 0 ? `${bestStreak}d` : '0d'}
          />
          <StatCard
            icon="📅"
            label="THIS MONTH"
            value={String(greenDaysThisMonth)}
            sub="green days"
          />
        </View>

        {/* Shareable 30-Day Grid Card */}
        <View ref={shareRef} collapsable={false} style={styles.shareCard}>
          <View style={styles.shareCardHeader}>
            <Text style={styles.shareCardTitle}>DOTIVO</Text>
            <Text style={styles.shareCardSub}>My {historyRange}-Day Momentum</Text>
          </View>
          <View style={styles.grid}>
            {Array.from({ length: historyRange }).map((_, i) => {
              const day = history[i];
              const score = day?.completionScore ?? 0;
              const dotColor = day
                ? interpolateColor(score)
                : theme.colors.separator;
              const isToday = i === 0;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: dotColor },
                    score > 0 && { shadowColor: dotColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4 },
                    isToday && styles.dotToday,
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.shareLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.legendText}>Win</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: interpolateColor(0.5) }]} />
              <Text style={styles.legendText}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.border }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
            <Text style={styles.shareWatermark}>Dotivo App</Text>
          </View>
        </View>

        {/* Weekly Review */}
        {weeklyStats && weeklyStats.last7DayScores.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Review</Text>
            <View style={styles.reviewCard}>
              {/* 7-day bar chart */}
              <Text style={styles.reviewSubtitle}>Last 7 days</Text>
              <View style={styles.barChart}>
                {(weeklyStats.last7DayScores.length === 7
                  ? weeklyStats.last7DayScores
                  : Array.from({ length: 7 }, (_, i) => weeklyStats.last7DayScores[i] ?? 0)
                ).map((score, i) => {
                  const dayIdx = (new Date().getDay() - 6 + i + 7) % 7;
                  return (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(score * 100, score > 0 ? 5 : 0)}%`,
                              backgroundColor: score >= 1
                                ? theme.colors.primary
                                : score > 0
                                ? theme.colors.warning
                                : theme.colors.border,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{DAY_NAMES_SHORT[dayIdx][0]}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Best / Worst day */}
              <View style={styles.reviewStats}>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatEmoji}>💪</Text>
                  <View>
                    <Text style={styles.reviewStatLabel}>Best day</Text>
                    <Text style={styles.reviewStatValue}>
                      {DAY_NAMES_SHORT[weeklyStats.bestDayOfWeek]}
                    </Text>
                  </View>
                </View>
                <View style={[styles.reviewStat, styles.reviewStatRight]}>
                  <Text style={styles.reviewStatEmoji}>📉</Text>
                  <View>
                    <Text style={styles.reviewStatLabel}>Needs work</Text>
                    <Text style={styles.reviewStatValue}>
                      {DAY_NAMES_SHORT[weeklyStats.worstDayOfWeek]}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reviewInsight}>
                <Text style={styles.reviewInsightText}>
                  💡 You complete more goals on {DAY_NAMES_SHORT[weeklyStats.bestDayOfWeek]}s.
                  Try reducing your Sunday targets if {DAY_NAMES_SHORT[weeklyStats.worstDayOfWeek]} is your weakest.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Milestones</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDate}>
                    {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legendSection}>
          {[
            { color: theme.colors.primary, label: 'All goals done — Win day 🟩' },
            { color: interpolateColor(0.5), label: 'Partial progress' },
            { color: theme.colors.border, label: 'Incomplete day' },
          ].map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 3 },
  shareBtn: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shareBtnText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radii.m,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  rangeBtnActive: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: theme.colors.primary,
  },
  rangeBtnText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 14 },
  rangeBtnTextActive: { color: theme.colors.primary },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  shareCard: {
    backgroundColor: '#03050B',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  shareCardHeader: { alignItems: 'center', marginBottom: 20 },
  shareCardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
  },
  shareCardSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4, letterSpacing: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.borderLight,
  },
  dotToday: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  shareLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  legendSection: { marginTop: 16, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { color: theme.colors.textMuted, fontSize: 13 },
  shareWatermark: {
    marginLeft: 'auto',
    color: theme.colors.textFaint,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reviewSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  barChart: {
    flexDirection: 'row',
    height: 80,
    gap: 6,
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 4 },
  reviewStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 14,
    marginBottom: 12,
  },
  reviewStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewStatRight: {
    justifyContent: 'flex-end',
  },
  reviewStatEmoji: { fontSize: 22 },
  reviewStatLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' },
  reviewStatValue: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  reviewInsight: {
    backgroundColor: 'rgba(99,102,241,0.07)',
    borderRadius: theme.radii.m,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  reviewInsightText: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    minWidth: '22%',
    gap: 4,
  },
  badgeEmoji: { fontSize: 28 },
  badgeName: { color: theme.colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  badgeDate: { color: theme.colors.textMuted, fontSize: 10 },
  loader: { alignItems: 'center', padding: 20 },
  emptyJourneyCard: {
    backgroundColor: 'rgba(25, 217, 148, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(25, 217, 148, 0.2)',
    alignItems: 'center',
  },
  emptyJourneyTitle: {
    color: theme.colors.primaryLight,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyJourneySub: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  }
});
