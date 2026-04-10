import { CheckCircle2, Circle, PlusCircle, Target, User } from "lucide-react-native";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenWrapper } from "../../components/common/ScreenWrapper";
import { theme } from "../../config/constants/theme";
import { DayPlanGoal, useGoalStore } from "../../store/slices/goalStore";
import { useAuthStore } from "../../store/slices/authStore";
import { useRouter } from "expo-router";

// ─── Goal Item ──────────────────────────────────────────────────────

function GoalItem({ goal, onToggle }: { goal: DayPlanGoal; onToggle: (g: DayPlanGoal) => void }) {
  const isCompleted = goal.status === "green";
  const isPartial = goal.status === "partial";
  const progress = Math.min(goal.completedCount / goal.targetCount, 1);
  const progressAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [progress]);

  const barColor = isCompleted ? theme.colors.primary : isPartial ? "#F59E0B" : theme.colors.border;

  const handlePress = useCallback(() => {
    onToggle(goal);
  }, [goal, onToggle]);

  return (
    <TouchableOpacity
      style={[
        styles.goalItem,
        isCompleted && { borderColor: goal.color, backgroundColor: `${goal.color}10` },
        isPartial && styles.goalItemPartial,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: goal.color }]} />

      <View style={styles.goalBody}>
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, isCompleted && styles.goalTitleCompleted]} numberOfLines={1}>
            {goal.title}
          </Text>
          {goal.isDailyMinimum && (
            <View style={styles.minBadge}>
              <Text style={styles.minBadgeText}>MIN</Text>
            </View>
          )}
        </View>

        <Text style={styles.goalMeta}>
          {goal.completedCount} / {goal.targetCount} units
        </Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Check icon */}
      <View style={styles.goalCheck}>
        {isCompleted ? (
          <CheckCircle2 color={goal.color} size={28} />
        ) : (
          <Circle color={isPartial ? "#F59E0B" : theme.colors.border} size={28} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────

const QUOTES = [
  '"Discipline equals freedom." — Jocko Willink',
  '"Small wins compound into giant results."',
  '"One rep, one page, one task at a time."',
  '"Consistency beats intensity every time."',
  '"Show up even when you don\'t feel like it."',
];

export default function TodayScreen() {
  const { currentPlan, history, fetchDailyPlan, fetchHistory, logProgress, currentStreak } = useGoalStore();

  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  // Pick a stable daily quote
  const quoteIndex = new Date().getDate() % QUOTES.length;
  const dailyQuote = QUOTES[quoteIndex];

  useEffect(() => {
    fetchDailyPlan(today);
    fetchHistory();
  }, [today]);

  const handleToggle = useCallback(
    (goal: DayPlanGoal) => {
      const newCount = goal.completedCount >= goal.targetCount ? 0 : goal.completedCount + 1;
      logProgress(goal.goalTemplateId, today, newCount);
    },
    [today, logProgress],
  );

  const goals = currentPlan?.goals ?? [];
  const top3Goals = goals.filter((g) => g.isDailyMinimum).slice(0, 3);
  const optionalGoals = goals.filter((g) => !g.isDailyMinimum);

  // Day status
  const dayStatus = currentPlan?.summaryStatus ?? "grey";
  const statusColor =
    dayStatus === "green" ? theme.colors.primary : dayStatus === "partial" ? "#F59E0B" : theme.colors.border;

  // Momentum dots (last 30 days)
  const momentumDots = Array.from({ length: 30 }).map((_, i) => history[i]);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const completedToday = goals.filter((g) => g.status === "green").length;
  const totalToday = goals.length;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Today's Grid</Text>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.quote} numberOfLines={2}>
              {dailyQuote}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusDot, { backgroundColor: statusColor, marginTop: 0 }]} />
            {currentStreak > 1 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {currentStreak}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/profile" as any)}>
              <User color={theme.colors.text} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Progress Summary ── */}
        {totalToday > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Today's Progress</Text>
            <Text style={styles.summaryValue}>
              {completedToday}
              <Text style={styles.summaryTotal}>/{totalToday} goals done</Text>
            </Text>
            <View style={styles.summaryTrack}>
              <View
                style={[
                  styles.summaryFill,
                  {
                    width: `${(completedToday / totalToday) * 100}%`,
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

                return (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      score > 0 && {
                        backgroundColor: theme.colors.primary,
                        opacity: 0.15 + score * 0.85,
                      },
                      isToday && {
                        borderWidth: 1,
                        borderColor: "#fff",
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Daily Minimums (Top 3) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Minimums</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {top3Goals.filter((g) => g.status === "green").length}/{top3Goals.length}
              </Text>
            </View>
          </View>
          {top3Goals.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => router.push("/modal" as any)}>
              <PlusCircle color={theme.colors.textMuted} size={24} />
              <Text style={styles.emptyText}>Tap + on Goals tab to add Daily Minimums</Text>
            </TouchableOpacity>
          ) : (
            top3Goals.map((goal) => <GoalItem key={goal.goalTemplateId} goal={goal} onToggle={handleToggle} />)
          )}
        </View>

        {/* ── Optional / Bonus Goals ── */}
        {optionalGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bonus Goals</Text>
              <Target color={theme.colors.textMuted} size={16} />
            </View>
            {optionalGoals.map((goal) => (
              <GoalItem key={goal.goalTemplateId} goal={goal} onToggle={handleToggle} />
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
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.m,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.l,
    gap: theme.spacing.m,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end", gap: 8 },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  date: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  quote: {
    fontSize: 13,
    fontStyle: "italic",
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 4,
  },
  streakBadge: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.s,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  streakText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryTotal: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "normal",
  },
  summaryTrack: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  summaryFill: {
    height: "100%",
    borderRadius: 3,
  },
  section: { marginBottom: theme.spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  sectionBadge: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.s,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionBadgeText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "bold",
  },
  gridCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  goalItemPartial: {
    borderColor: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.05)",
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
  },
  goalBody: {
    flex: 1,
    padding: theme.spacing.m,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  goalTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  goalTitleCompleted: {
    color: theme.colors.textMuted,
    textDecorationLine: "line-through",
  },
  minBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  minBadgeText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  goalMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: "hidden",
    width: "80%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  goalCheck: {
    paddingHorizontal: theme.spacing.m,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    padding: theme.spacing.l,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  fullEmptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
    gap: 12,
  },
  fullEmptyEmoji: { fontSize: 48 },
  fullEmptyTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },
  fullEmptySubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
