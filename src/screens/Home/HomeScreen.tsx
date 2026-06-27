import { CheckCircle2, Circle, PlusCircle, SkipForward, Quote } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  RefreshControl,
} from 'react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { theme } from '../../config/constants/theme';
import { DayPlanGoal, useGoalStore } from '../../store/slices/goalStore';
import { useAuthStore } from '../../store/slices/authStore';
import { useRouter } from 'expo-router';
import MoodCheckInModal from '../../components/modals/MoodCheckInModal';
import CountInputModal from '../../components/modals/CountInputModal';
import { getDailyQuote } from '../../config/constants/quotes';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

// ─── Helpers ────────────────────────────────────────────────────────

function getGoalEmoji(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('gym') || lower.includes('workout') || lower.includes('exercise')) return '🏋️';
  if (lower.includes('water') || lower.includes('drink')) return '💧';
  if (lower.includes('read') || lower.includes('book')) return '📚';
  if (lower.includes('meditat') || lower.includes('mind')) return '🧘';
  if (lower.includes('code') || lower.includes('dev') || lower.includes('program')) return '💻';
  if (lower.includes('sleep') || lower.includes('bed')) return '🌙';
  if (lower.includes('walk') || lower.includes('step') || lower.includes('run')) return '🏃';
  if (lower.includes('study') || lower.includes('learn')) return '📖';
  return '🎯';
}

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

function CircularProgress({ progress, color }: { progress: number; color: string }) {
  const size = 120;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: progress,
      tension: 40,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.heroRingContainer}>
      <Svg width={size} height={size}>
        <SvgCircle
          stroke={theme.colors.border}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          stroke={color}
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          originX={center}
          originY={center}
        />
      </Svg>
    </View>
  );
}

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
        isCompleted && { borderColor: goal.color + '50', backgroundColor: goal.color + '10' },
        isPartial && styles.goalItemPartial,
        isSkipped && styles.goalItemSkipped,
      ]}
      onPress={() => !isSkipped && onToggle(goal)}
      onLongPress={() => !isSkipped && onLongPress(goal)}
      activeOpacity={0.75}
      delayLongPress={400}
    >
      <View style={styles.goalBody}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalEmoji}>{getGoalEmoji(goal.title)}</Text>
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
        </View>

        {!isSkipped && (
          <View style={styles.goalFooter}>
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
            <Text style={styles.goalMeta}>
              {goal.completedCount} / {goal.targetCount}
            </Text>
          </View>
        )}
        {isSkipped && (
          <Text style={styles.skippedMeta}>Rest day</Text>
        )}
      </View>

      <View style={styles.goalRight}>
        {!isSkipped && (
          <TouchableOpacity
            style={[styles.goalCheck, isCompleted && { backgroundColor: goal.color, borderColor: goal.color }]}
            onPress={() => onToggle(goal)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {isCompleted ? (
              <CheckCircle2 color="#000" size={24} strokeWidth={3} />
            ) : (
              <Circle color={isPartial ? theme.colors.warning : theme.colors.borderLight} size={28} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────

export default function TodayScreen() {
  const {
    currentPlan, history, fetchDailyPlan, fetchHistory, fetchTemplates, fetchQuotes, quotes,
    logProgress, skipGoal, logMood, currentStreak,
  } = useGoalStore();
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [date] = useState(new Date());
  const today = date.toISOString().split('T')[0];
  const dailyQuote = quotes.length > 0 ? quotes[date.getDate() % quotes.length] : "";

  const [moodVisible, setMoodVisible] = useState(false);
  const [countModal, setCountModal] = useState<DayPlanGoal | null>(null);
  const prevGreenRef = useRef(0);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    await useGoalStore.getState().syncWithBackend();
    await fetchTemplates();
    await fetchQuotes();
    await fetchDailyPlan(today);
    await fetchHistory(30);
    setRefreshing(false);
  }, [isAuthenticated, today, fetchTemplates, fetchQuotes, fetchDailyPlan, fetchHistory]);

  // Pulse animation for today's dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTemplates();
    fetchQuotes();
    fetchDailyPlan(today);
    fetchHistory();
  }, [today, isAuthenticated]);

  const goals = currentPlan?.goals ?? [];
  const activeGoals = goals.filter(g => g.status !== 'skipped');
  const minimumGoals = goals.filter(g => g.isDailyMinimum);
  const optionalGoals = goals.filter(g => !g.isDailyMinimum);
  const completedMinimums = minimumGoals.filter(g => g.status === 'green');

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
  const completedToday = activeGoals.filter(g => g.status === 'green').length;
  const totalActive = activeGoals.length;
  const completionRatio = totalActive > 0 ? completedToday / totalActive : 0;

  const remaining = totalActive - completedToday;
  const heroSubtext = remaining === 0
    ? "Day completed. Momentum secured."
    : remaining === 1
      ? "1 small win completes your day."
      : `${remaining} small wins can complete your day.`;

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          ) : undefined
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Today</Text>
          <View style={styles.headerRight}>
            {currentStreak > 0 && (
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

        {/* ── Hero Momentum Card ── */}
        <View style={styles.heroCard}>
          <CircularProgress progress={completionRatio} color={theme.colors.primaryLight} />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Today's Momentum</Text>
            <Text style={styles.heroProgressText}>{completedToday}/{totalActive}</Text>
            <Text style={styles.heroSubtitle}>{heroSubtext}</Text>
          </View>
        </View>

        {/* ── Daily Quote ── */}
        <View style={styles.quoteCard}>
          <Quote color={theme.colors.primaryLight} size={20} style={{ opacity: 0.6 }} />
          <Text style={styles.quoteText}>{dailyQuote}</Text>
        </View>

        {/* ── Discipline Map (Mini Grid) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Discipline Map</Text>
          <View style={styles.gridCard}>
            <View style={styles.gridContainer}>
              {momentumDots.map((item, i) => {
                const score = item?.completionScore ?? 0;
                const isToday = item?.date === today;
                const opacity = score > 0 ? 0.2 + score * 0.8 : 0;
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      score > 0 && {
                        backgroundColor: theme.colors.primaryLight,
                        opacity,
                      },
                      isToday && [styles.dotToday, { opacity: pulseAnim }],
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Daily Goals ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          {goals.length === 0 ? (
            <Pressable
              style={styles.emptyCard}
              onPress={() => router.push('/modal' as any)}
            >
              <PlusCircle color={theme.colors.textMuted} size={28} />
              <Text style={styles.emptyText}>
                No goals yet. Add a small win to start your momentum.
              </Text>
            </Pressable>
          ) : (
            goals.map((goal) => (
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
    paddingHorizontal: 20,
    paddingBottom: 110,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  streakBadge: {
    backgroundColor: 'rgba(250,204,21,0.15)',
    borderRadius: theme.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.3)',
  },
  streakText: { color: theme.colors.warning, fontSize: 13, fontWeight: '800' },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  profileInitial: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  // Hero Card
  heroCard: {
    backgroundColor: theme.colors.cardElevated,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primaryLight,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  heroRingContainer: {
    marginRight: 20,
  },
  heroTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroProgressText: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Quote Card
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.colors.text,
    lineHeight: 18,
    opacity: 0.9,
  },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 16,
  },

  // Grid
  gridCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: theme.colors.borderLight,
  },
  dotToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    backgroundColor: 'rgba(53,242,178,0.2)',
  },

  // Goal Item
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  goalItemPartial: {
    borderColor: theme.colors.warning + '50',
    backgroundColor: theme.colors.warningMuted,
  },
  goalItemSkipped: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundAlt,
    opacity: 0.6,
  },
  goalBody: { flex: 1 },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
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
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    width: 40,
  },
  skippedMeta: {
    color: theme.colors.textFaint,
    fontSize: 12,
    fontStyle: 'italic',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  goalRight: {
    paddingLeft: 16,
    justifyContent: 'center',
  },
  goalCheck: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  }
});
