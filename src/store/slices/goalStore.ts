import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { goalService, planService } from '../../config/restClient';
import { syncWallpaperData } from '../../utils/wallpaper';
import { GOAL_CATEGORIES } from '../../config/constants/goalTemplates';

export type GoalCategory = typeof GOAL_CATEGORIES[number];

export interface GoalTemplate {
  _id: string;
  title: string;
  category: GoalCategory | string;
  isDailyMinimum: boolean;
  isTop3Default: boolean;
  targetCount: number;
  icon: string;
  color: string;
  frequencyType?: 'daily' | 'weekly' | 'specific_days';
  selectedDays?: number[];
  reminderTime?: string;
}

export interface DayPlanGoal {
  goalTemplateId: string;
  title: string;
  targetCount: number;
  completedCount: number;
  isDailyMinimum: boolean;
  color: string;
  status: 'grey' | 'partial' | 'green' | 'skipped';
}

export interface DayPlan {
  _id: string;
  date: string;
  summaryStatus: 'grey' | 'partial' | 'green';
  goals: DayPlanGoal[];
  mood?: number; // 1-5 energy rating
}

export interface HistoryItem {
  date: string;
  status: 'grey' | 'partial' | 'green';
  completionScore: number;
  mood?: number;
}

export interface WeeklyStats {
  bestDayOfWeek: number;   // 0=Sun, 1=Mon ...
  worstDayOfWeek: number;
  goalCompletionRates: Record<string, number>; // goalTemplateId -> 0..1
  last7DayScores: number[];
  totalGreenDays: number;
  totalCompletedThisMonth: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  earnedAt: string;
}

export interface GoalState {
  templates: GoalTemplate[];
  currentPlan: DayPlan | null;
  history: HistoryItem[];
  historyRange: 30 | 7 | 90;
  isLoading: boolean;
  error: string | null;
  currentStreak: number;
  bestStreak: number;
  greenDaysThisMonth: number;
  weeklyStats: WeeklyStats | null;
  badges: Badge[];
  hasOnboarded: boolean;

  // Actions
  fetchTemplates: () => Promise<void>;
  fetchDailyPlan: (date: string) => Promise<void>;
  fetchHistory: (range?: 7 | 30 | 90) => Promise<void>;
  setHistoryRange: (range: 7 | 30 | 90) => void;
  addTemplate: (template: any) => Promise<void>;
  updateTemplate: (id: string, data: any) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  logProgress: (goalId: string, date: string, count: number) => Promise<void>;
  skipGoal: (goalId: string, date: string) => void;
  logMood: (date: string, mood: number) => void;
  computeStats: () => void;
  computeWeeklyStats: () => void;
  checkAndAwardBadges: () => Badge[];
  setHasOnboarded: (val: boolean) => void;
}

// ─── Pure helpers ──────────────────────────────────────────────────

function computeGoalStatus(
  completedCount: number,
  targetCount: number
): 'grey' | 'partial' | 'green' {
  if (completedCount <= 0) return 'grey';
  if (completedCount >= targetCount) return 'green';
  return 'partial';
}

function computeDaySummaryStatus(goals: DayPlanGoal[]): 'grey' | 'partial' | 'green' {
  const activeGoals = goals.filter(g => g.status !== 'skipped');
  const minGoals = activeGoals.filter((g) => g.isDailyMinimum);
  const hasAnyProgress = activeGoals.some((g) => g.completedCount > 0);

  if (minGoals.length > 0) {
    const allMinComplete = minGoals.every((g) => g.status === 'green');
    if (allMinComplete) return 'green';
    return hasAnyProgress ? 'partial' : 'grey';
  }

  const anyComplete = activeGoals.some((g) => g.status === 'green');
  if (anyComplete) return 'green';
  return hasAnyProgress ? 'partial' : 'grey';
}

function buildFallbackPlan(date: string, templates: GoalTemplate[]): DayPlan {
  return {
    _id: 'local-' + date,
    date,
    summaryStatus: 'grey',
    goals: templates.map((t) => ({
      goalTemplateId: t._id,
      title: t.title,
      targetCount: t.targetCount,
      completedCount: 0,
      isDailyMinimum: t.isDailyMinimum,
      color: t.color,
      status: 'grey',
    })),
  };
}

function mergePlanWithTemplates(plan: DayPlan, templates: GoalTemplate[]): DayPlan {
  const mergedGoals: DayPlanGoal[] = [...plan.goals];
  templates.forEach((t) => {
    if (!mergedGoals.find((g) => g.goalTemplateId === t._id)) {
      mergedGoals.push({
        goalTemplateId: t._id,
        title: t.title,
        targetCount: t.targetCount,
        completedCount: 0,
        isDailyMinimum: t.isDailyMinimum,
        color: t.color,
        status: 'grey',
      });
    }
  });
  const enriched = mergedGoals.map((g) => {
    const template = templates.find((t) => t._id === g.goalTemplateId);
    return { ...g, color: template?.color ?? g.color ?? '#10B981' };
  });
  return { ...plan, goals: enriched };
}

function calculateStreaks(history: HistoryItem[]): {
  currentStreak: number;
  bestStreak: number;
  greenDaysThisMonth: number;
} {
  const sorted = [...history].sort((a, b) => (a.date > b.date ? -1 : 1));
  const thisMonth = new Date().toISOString().slice(0, 7);
  let greenDaysThisMonth = 0;
  let currentStreak = 0;
  let currentStreakBroken = false;

  for (const item of sorted) {
    if (item.date.startsWith(thisMonth) && item.status === 'green') {
      greenDaysThisMonth++;
    }
    if (!currentStreakBroken) {
      if (item.status === 'green') {
        currentStreak++;
      } else {
        currentStreakBroken = true;
      }
    }
  }

  let bestStreak = 0;
  let runningStreak = 0;
  for (const item of sorted) {
    if (item.status === 'green') {
      runningStreak++;
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    } else {
      runningStreak = 0;
    }
  }

  if (!currentStreakBroken) {
    greenDaysThisMonth = sorted.filter(
      (item) => item.date.startsWith(thisMonth) && item.status === 'green'
    ).length;
  }

  return { currentStreak, bestStreak, greenDaysThisMonth };
}

function calculateWeeklyStats(history: HistoryItem[]): WeeklyStats {
  const dayScores: number[][] = [[], [], [], [], [], [], []]; // 0=Sun ... 6=Sat
  const last7 = [...history].sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 7);

  history.forEach(item => {
    const day = new Date(item.date + 'T12:00:00').getDay();
    dayScores[day].push(item.completionScore);
  });

  const avgByDay = dayScores.map(scores =>
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  );

  let bestDayOfWeek = 0;
  let worstDayOfWeek = 0;
  avgByDay.forEach((avg, i) => {
    if (avg > avgByDay[bestDayOfWeek]) bestDayOfWeek = i;
    if (avg < avgByDay[worstDayOfWeek]) worstDayOfWeek = i;
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const totalGreenDays = history.filter(h => h.status === 'green').length;
  const totalCompletedThisMonth = history.filter(
    h => h.date.startsWith(thisMonth) && h.status === 'green'
  ).length;

  const last7DayScores = last7.reverse().map(h => h.completionScore);

  return {
    bestDayOfWeek,
    worstDayOfWeek,
    goalCompletionRates: {},
    last7DayScores,
    totalGreenDays,
    totalCompletedThisMonth,
  };
}

const MILESTONE_DEFS = [
  { id: 'first_goal', name: 'First Step', emoji: '🎯', check: (s: GoalState) => s.templates.length >= 1 },
  { id: 'streak_7', name: '7-Day Streak', emoji: '🔥', check: (s: GoalState) => s.currentStreak >= 7 },
  { id: 'streak_14', name: '14-Day Streak', emoji: '💎', check: (s: GoalState) => s.currentStreak >= 14 },
  { id: 'streak_30', name: '30-Day Legend', emoji: '👑', check: (s: GoalState) => s.currentStreak >= 30 },
  { id: 'green_10', name: '10 Green Days', emoji: '🌿', check: (s: GoalState) => (s.weeklyStats?.totalGreenDays ?? 0) >= 10 },
  { id: 'green_30', name: '30 Green Days', emoji: '✨', check: (s: GoalState) => (s.weeklyStats?.totalGreenDays ?? 0) >= 30 },
];


// ─── Store ──────────────────────────────────────────────────────────

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      templates: [],
      currentPlan: null,
      history: [],
      historyRange: 30,
      isLoading: false,
      error: null,
      currentStreak: 0,
      bestStreak: 0,
      greenDaysThisMonth: 0,
      weeklyStats: null,
      badges: [],
      hasOnboarded: false,

      setHasOnboarded: (val) => set({ hasOnboarded: val }),

      setHistoryRange: (range) => {
        set({ historyRange: range });
        get().fetchHistory(range);
      },

      computeStats: () => {
        const { currentStreak, bestStreak, greenDaysThisMonth } = calculateStreaks(get().history);
        set({ currentStreak, bestStreak, greenDaysThisMonth });
      },

      computeWeeklyStats: () => {
        const stats = calculateWeeklyStats(get().history);
        set({ weeklyStats: stats });
      },

      checkAndAwardBadges: () => {
        const state = get();
        const existingIds = new Set(state.badges.map(b => b.id));
        const newBadges: Badge[] = [];

        MILESTONE_DEFS.forEach(def => {
          if (!existingIds.has(def.id) && def.check(state)) {
            newBadges.push({
              id: def.id,
              name: def.name,
              emoji: def.emoji,
              earnedAt: new Date().toISOString(),
            });
          }
        });

        if (newBadges.length > 0) {
          set({ badges: [...state.badges, ...newBadges] });
        }
        return newBadges;
      },

      fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
          const templates = await goalService.getTemplates();
          set({ templates, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchDailyPlan: async (date: string) => {
        set({ isLoading: true, error: null });
        const templates = get().templates;

        const existingPlan = get().currentPlan;
        const existingProgress: Record<string, { count: number; status: DayPlanGoal['status'] }> = {};
        if (existingPlan?.date === date) {
          existingPlan.goals.forEach((g) => {
            existingProgress[g.goalTemplateId] = { count: g.completedCount, status: g.status };
          });
        }

        try {
          const rawPlan = await planService.getDailyPlan(date);
          const merged = mergePlanWithTemplates(rawPlan, templates);

          const goalsWithProgress: DayPlanGoal[] = merged.goals.map((g) => {
            const local = existingProgress[g.goalTemplateId];
            if (local && local.count > g.completedCount) {
              const status: DayPlanGoal['status'] = local.status === 'skipped' ? 'skipped' : computeGoalStatus(local.count, g.targetCount);
              return { ...g, completedCount: local.count, status };
            }
            return g;
          });

          const finalPlan: DayPlan = {
            ...merged,
            goals: goalsWithProgress,
            summaryStatus: computeDaySummaryStatus(goalsWithProgress),
          };

          set({ currentPlan: finalPlan, isLoading: false });
        } catch (error: any) {
          const fallback = buildFallbackPlan(date, templates);
          const fallbackWithProgress: DayPlanGoal[] = fallback.goals.map((g) => {
            const local = existingProgress[g.goalTemplateId];
            if (local && local.count > 0) {
              const status: DayPlanGoal['status'] = local.status === 'skipped' ? 'skipped' : computeGoalStatus(local.count, g.targetCount);
              return { ...g, completedCount: local.count, status };
            }
            return g;
          });
          const fallbackPlan: DayPlan = {
            ...fallback,
            goals: fallbackWithProgress,
            summaryStatus: computeDaySummaryStatus(fallbackWithProgress),
          };
          set({ currentPlan: fallbackPlan, error: null, isLoading: false });
        }
      },

      fetchHistory: async (range) => {
        const effectiveRange = range ?? get().historyRange;
        try {
          const history = await planService.getHistory(effectiveRange);
          set({ history, historyRange: effectiveRange });
          get().computeStats();
          get().computeWeeklyStats();
          get().checkAndAwardBadges();
        } catch (error: any) {
          console.log('History sync skipped (offline):', error.message);
        }
      },

      addTemplate: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await goalService.createTemplate(data);
          await get().fetchTemplates();
          const today = new Date().toISOString().split('T')[0];
          await get().fetchDailyPlan(today);
          set({ isLoading: false });
          get().checkAndAwardBadges();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateTemplate: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          await goalService.updateTemplate(id, data);
          await get().fetchTemplates();
          const today = new Date().toISOString().split('T')[0];
          await get().fetchDailyPlan(today);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      removeTemplate: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await goalService.deleteTemplate(id);
          await get().fetchTemplates();
          const today = new Date().toISOString().split('T')[0];
          await get().fetchDailyPlan(today);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      skipGoal: (goalId: string, date: string) => {
        const currentPlan = get().currentPlan;
        if (!currentPlan) return;

        const updatedGoals = currentPlan.goals.map((g) => {
          if (g.goalTemplateId === goalId) {
            const newStatus: DayPlanGoal['status'] = g.status === 'skipped' ? 'grey' : 'skipped';
            return { ...g, status: newStatus };
          }
          return g;
        });

        set({
          currentPlan: {
            ...currentPlan,
            goals: updatedGoals,
            summaryStatus: computeDaySummaryStatus(updatedGoals),
          },
        });
      },

      logMood: (date: string, mood: number) => {
        const currentPlan = get().currentPlan;
        if (currentPlan?.date === date) {
          set({ currentPlan: { ...currentPlan, mood } });
        }
        const newHistory = get().history.map(h =>
          h.date === date ? { ...h, mood } : h
        );
        set({ history: newHistory });
      },

      logProgress: async (goalId: string, date: string, count: number) => {
        const currentPlan = get().currentPlan;
        if (!currentPlan) return;

        const updatedGoals = currentPlan.goals.map((g) => {
          if (g.goalTemplateId === goalId) {
            const status = computeGoalStatus(count, g.targetCount);
            return { ...g, completedCount: count, status };
          }
          return g;
        });
        const summaryStatus = computeDaySummaryStatus(updatedGoals);
        const completionScore =
          updatedGoals.filter((g) => g.status === 'green').length /
          Math.max(updatedGoals.filter(g => g.status !== 'skipped').length, 1);

        set({
          currentPlan: {
            ...currentPlan,
            goals: updatedGoals,
            summaryStatus,
          },
        });

        const existingHistory = get().history;
        const todayIndex = existingHistory.findIndex((h) => h.date === date);
        const todayHistoryItem: HistoryItem = {
          date,
          status: summaryStatus,
          completionScore,
        };

        const newHistory =
          todayIndex >= 0
            ? existingHistory.map((h, i) => (i === todayIndex ? todayHistoryItem : h))
            : [todayHistoryItem, ...existingHistory];

        set({ history: newHistory });
        get().computeStats();
        get().computeWeeklyStats();
        get().checkAndAwardBadges();

        syncWallpaperData(completionScore, newHistory);

        try {
          await planService.logProgress({
            goalTemplateId: goalId,
            date,
            completedCount: count,
            source: 'app',
          });

          const freshHistory: HistoryItem[] = await planService.getHistory(get().historyRange);
          const mergedHistory = freshHistory.map((h: HistoryItem) => {
            if (h.date === date) {
              return todayHistoryItem;
            }
            return h;
          });

          if (!mergedHistory.find((h: HistoryItem) => h.date === date)) {
            mergedHistory.unshift(todayHistoryItem);
          }

          set({ history: mergedHistory });
          get().computeStats();
          get().computeWeeklyStats();
        } catch (error: any) {
          console.log('Background sync failed, keeping optimistic state');
        }
      },
    }),
    {
      name: 'dotivo-goals-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        templates: state.templates,
        currentPlan: state.currentPlan,
        history: state.history,
        historyRange: state.historyRange,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        greenDaysThisMonth: state.greenDaysThisMonth,
        weeklyStats: state.weeklyStats,
        badges: state.badges,
        hasOnboarded: state.hasOnboarded,
      }),
    }
  )
);
