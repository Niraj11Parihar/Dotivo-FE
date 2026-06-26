import { CheckCircle2, Circle, PlusCircle, SkipForward } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { theme } from '../../config/constants/theme';
import { DayPlanGoal, useGoalStore } from '../../store/slices/goalStore';
import { useAuthStore } from '../../store/slices/authStore';
import { useRouter } from 'expo-router';
import MoodCheckInModal from '../../components/modals/MoodCheckInModal';
import CountInputModal from '../../components/modals/CountInputModal';
import { getDailyQuote } from '../../config/constants/quotes';

// ─── Goal Item ──────────────────────────────────────────────────────

function GoalItem({
  goal,
  onToggle,
  onLongPress,
  onSkip,
}: {
  goal: DayPlanGoal;
  onToggle: (g: DayPlanGoal) => void;
  onLongPress: (g: DayPlanGoal) => void;
  onSkip: (g: DayPlanGoal) => void;
}) {
  const isCompleted = goal.status === 'green';
  const isPartial = goal.status === 'partial';
  const isSkipped = goal.status === 'skipped';
  const progress = isSkipped ? 0 : Math.min(goal.completedCount / goal.targetCount, 1);
  const progressAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [progress]);

  const barColor = isCompleted
    ? goal.color
    : isPartial
    ? theme.colors.warning
    : theme.colors.border;

  return (
    <TouchableOpacity
      style={[
        styles.goalItem,
        isCompleted && { borderColor: goal.color + '40', backgroundColor: goal.color + '08' },
        isPartial && styles.goalItemPartial,
        isSkipped && styles.goalItemSkipped,
      ]}
      onPress={() => !isSkipped && onToggle(goal)}
      onLongPress={() => !isSkipped && onLongPress(goal)}
      activeOpacity={0.75}
      delayLongPress={450}
    >
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: isSkipped ? theme.colors.skipped : goal.color }]} />

      <View style={styles.goalBody}>
        <View style={styles.goalHeader}>
          <Text
            style={[
              styles.goalTitle,
              isCompleted && styles.goalTitleCompleted,
              isSkipped && styles.goalTitleSkipped,
            ]}
            numberOfLines={1}
          >
            {goal.title}
          </Text>
          {goal.isDailyMinimum && !isSkipped && (
            <View style={styles.minBadge}>
              <Text style={styles.minBadgeText}>MIN</Text>
            </View>
          )}
          {isSkipped && (
            <View style={styles.skippedBadge}>
              <Text style={styles.skippedBadgeText}>SKIPPED</Text>
            </View>
          )}
        </View>

        {!isSkipped && (
          <>
            <Text style={styles.goalMeta}>
              {goal.completedCount} / {goal.targetCount} units
            </Text>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>
          </>
        )}
        {isSkipped && (
          <Text style={styles.skippedMeta}>Rest day — momentum preserved</Text>
        )}
      </View>

      {/* Right side: check / skip */}
      <View style={styles.goalRight}>
        {!isSkipped && (
          <TouchableOpacity
            style={styles.goalCheck}
            onPress={() => onToggle(goal)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCompleted ? (
              <CheckCircle2 color={goal.color} size={26} />
            ) : (
              <Circle color={isPartial ? theme.colors.warning : theme.colors.border} size={26} />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => onSkip(goal)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SkipForward
            color={isSkipped ? theme.colors.primary : theme.colors.textFaint}
            size={16}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────

export default function TodayScreen() {
  const {
    currentPlan, history, fetchDailyPlan, fetchHistory, fetchTemplates,
    logProgress, skipGoal, logMood, currentStreak,
  } = useGoalStore();
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const dailyQuote = getDailyQuote(new Date().getDate());

  const [moodVisible, setMoodVisible] = useState(false);
  const [countModal, setCountModal] = useState<DayPlanGoal | null>(null);
  const prevGreenRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTemplates();
    fetchDailyPlan(today);
    fetchHistory();
  }, [today, isAuthenticated]);

  const goals = currentPlan?.goals ?? [];
  const activeGoals = goals.filter(g => g.status !== 'skipped');
  const minimumGoals = goals.filter(g => g.isDailyMinimum);
  const optionalGoals = goals.filter(g => !g.isDailyMinimum);
  const completedMinimums = minimumGoals.filter(g => g.status === 'green');

  // Trigger mood check-in when all minimums turn green
  useEffect(() => {
    if (minimumGoals.length > 0 && completedMinimums.length === minimumGoals.length) {
      if (prevGreenRef.current < minimumGoals.length) {
        setTimeout(() => setMoodVisible(true), 600);
      }
    }
    prevGreenRef.current = completedMinimums.length;
  }, [completedMinimums.length, minimumGoals.length]);

  const handleToggle = useCallback(
    (goal: DayPlanGoal) => {
      const newCount = goal.completedCount >= goal.targetCount ? 0 : goal.completedCount + 1;
      logProgress(goal.goalTemplateId, today, newCount);
    },
    [today, logProgress]
  );

  const handleLongPress = useCallback((goal: DayPlanGoal) => {
    setCountModal(goal);
  }, []);

  const handleSkip = useCallback((goal: DayPlanGoal) => {
    skipGoal(goal.goalTemplateId, today);
  }, [today, skipGoal]);

  const handleCountConfirm = useCallback((count: number) => {
    if (countModal) {
      logProgress(countModal.goalTemplateId, today, count);
      setCountModal(null);
    }
  }, [countModal, today, logProgress]);

  const handleMoodSelect = useCallback((mood: number) => {
    logMood(today, mood);
    setMoodVisible(false);
  }, [today, logMood]);

  const dayStatus = currentPlan?.summaryStatus ?? 'grey';
  const statusColor =
    dayStatus === 'green' ? theme.colors.primary
    : dayStatus === 'partial' ? theme.colors.warning
    : theme.colors.border;

  const momentumDots = Array.from({ length: 30 }).map((_, i) => history[i]);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completedToday = activeGoals.filter(g => g.status === 'green').length;
  const totalActive = activeGoals.length;
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {firstName ? `Hey, ${firstName} 👋` : "Today's Grid"}
            </Text>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.quote} numberOfLines={2}>{dailyQuote}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {dayStatus === 'green' ? 'Win' : dayStatus === 'partial' ? 'Going' : 'Start'}
              </Text>
            </View>
            {currentStreak > 1 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {currentStreak}d</Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push('/profile' as any)}
            >
              <Text style={styles.profileInitial}>
                {(user?.name?.[0] ?? '?').toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Progress Summary ── */}
        {totalActive > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>TODAY'S PROGRESS</Text>
              <Text style={styles.summaryFraction}>
                <Text style={styles.summaryCompleted}>{completedToday}</Text>
                <Text style={styles.summaryTotal}>/{totalActive}</Text>
              </Text>
            </View>
            <View style={styles.summaryTrack}>
              <View
                style={[
                  styles.summaryFill,
                  {
                    width: `${(completedToday / Math.max(totalActive, 1)) * 100}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* ── Momentum Grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Momentum</Text>
          <View style={styles.gridCard}>
            <View style={styles.gridContainer}>
              {momentumDots.map((item, i) => {
                const score = item?.completionScore ?? 0;
                const isToday = item?.date === today;
                const opacity = score > 0 ? 0.15 + score * 0.85 : 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      score > 0 && {
                        backgroundColor: theme.colors.primary,
                        opacity,
                      },
                      isToday && styles.dotToday,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Daily Minimums ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Minimums</Text>
            <View style={[
              styles.sectionBadge,
              completedMinimums.length === minimumGoals.length && minimumGoals.length > 0
                && styles.sectionBadgeComplete,
            ]}>
              <Text style={[
                styles.sectionBadgeText,
                completedMinimums.length === minimumGoals.length && minimumGoals.length > 0
                  && { color: theme.colors.primary },
              ]}>
                {completedMinimums.length}/{minimumGoals.length}
              </Text>
            </View>
          </View>
          {minimumGoals.length === 0 ? (
            <Pressable
              style={styles.emptyCard}
              onPress={() => router.push('/modal' as any)}
            >
              <PlusCircle color={theme.colors.textMuted} size={24} />
              <Text style={styles.emptyText}>
                Add Daily Minimums from the Goals tab
              </Text>
            </Pressable>
          ) : (
            minimumGoals.map((goal) => (
              <GoalItem
                key={goal.goalTemplateId}
                goal={goal}
                onToggle={handleToggle}
                onLongPress={handleLongPress}
                onSkip={handleSkip}
              />
            ))
          )}
        </View>

        {/* ── Bonus Goals ── */}
        {optionalGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bonus Goals</Text>
              <Text style={styles.sectionHint}>Long-press to set count</Text>
            </View>
            {optionalGoals.map((goal) => (
              <GoalItem
                key={goal.goalTemplateId}
                goal={goal}
                onToggle={handleToggle}
                onLongPress={handleLongPress}
                onSkip={handleSkip}
              />
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {goals.length === 0 && (
          <View style={styles.fullEmptyState}>
            <Text style={styles.fullEmptyEmoji}>🎯</Text>
            <Text style={styles.fullEmptyTitle}>No goals yet</Text>
            <Text style={styles.fullEmptySubtitle}>
              Head to the Goals tab and add your first daily habit or minimum.
            </Text>
            <Pressable
              style={styles.fullEmptyBtn}
              onPress={() => router.push('/modal' as any)}
            >
              <PlusCircle color="#fff" size={18} />
              <Text style={styles.fullEmptyBtnText}>Add a Goal</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Mood Check-In */}
      <MoodCheckInModal
        visible={moodVisible}
        onSelect={handleMoodSelect}
        onDismiss={() => setMoodVisible(false)}
      />

      {/* Count Input */}
      {countModal && (
        <CountInputModal
          visible={!!countModal}
          goalTitle={countModal.title}
          targetCount={countModal.targetCount}
          currentCount={countModal.completedCount}
          goalColor={countModal.color}
          onConfirm={handleCountConfirm}
          onDismiss={() => setCountModal(null)}
        />
      )}
    </ScreenWrapper>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 20,
    gap: 12,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  date: { fontSize: 13, color: theme.colors.textMuted, marginTop: 3 },
  quote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 17,
    opacity: 0.8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  streakBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: theme.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  streakText: { color: theme.colors.warning, fontSize: 13, fontWeight: '700' },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profileInitial: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryFraction: {},
  summaryCompleted: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  summaryTotal: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryTrack: {
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  summaryFill: { height: '100%', borderRadius: 3 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  sectionHint: { fontSize: 11, color: theme.colors.textMuted },
  sectionBadge: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionBadgeComplete: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: theme.colors.primaryBorder,
  },
  sectionBadgeText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  gridCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
  },
  dotToday: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  goalItemPartial: {
    borderColor: theme.colors.warning + '50',
    backgroundColor: theme.colors.warningMuted,
  },
  goalItemSkipped: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    opacity: 0.55,
  },
  accentBar: { width: 4, alignSelf: 'stretch' },
  goalBody: { flex: 1, padding: 12 },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  goalTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  goalTitleCompleted: {
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  goalTitleSkipped: {
    color: theme.colors.textFaint,
    textDecorationLine: 'line-through',
  },
  minBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  minBadgeText: {
    color: theme.colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skippedBadge: {
    backgroundColor: 'rgba(61,78,106,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  skippedBadgeText: {
    color: theme.colors.skipped,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  goalMeta: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 7,
  },
  skippedMeta: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontStyle: 'italic',
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    width: '85%',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  goalRight: {
    alignItems: 'center',
    paddingRight: 6,
    gap: 2,
  },
  goalCheck: { padding: 8 },
  skipBtn: { padding: 6 },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fullEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  fullEmptyEmoji: { fontSize: 52 },
  fullEmptyTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  fullEmptySubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  fullEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.radii.full,
    marginTop: 8,
  },
  fullEmptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
