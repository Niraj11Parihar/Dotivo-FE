import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { goalService, planService } from '../../config/restClient';
import { syncWallpaperData } from '../../utils/wallpaper';

export type GoalCategory = 'Health' | 'Fitness' | 'Productivity' | 'Personal Growth' | 'Study';

export interface GoalTemplate {
  _id: string;
  title: string;
  category: GoalCategory | string;
  isDailyMinimum: boolean;
  isTop3Default: boolean;
  targetCount: number;
  icon: string;
  color: string;
}

export interface DayPlanGoal {
  goalTemplateId: string;
  title: string;
  targetCount: number;
  completedCount: number;
  isDailyMinimum: boolean;
  color: string;
  status: 'grey' | 'partial' | 'green';
}

export interface DayPlan {
  _id: string;
  date: string;
  summaryStatus: 'grey' | 'partial' | 'green';
  goals: DayPlanGoal[];
}

export interface HistoryItem {
  date: string;
  status: 'grey' | 'partial' | 'green';
  completionScore: number;
}

export interface GoalState {
  templates: GoalTemplate[];
  currentPlan: DayPlan | null;
  history: HistoryItem[];
  isLoading: boolean;
  error: string | null;

  // Derived stats
  currentStreak: number;
  bestStreak: number;
  greenDaysThisMonth: number;

  // Actions
  fetchTemplates: () => Promise<void>;
  fetchDailyPlan: (date: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  addTemplate: (template: any) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  logProgress: (goalId: string, date: string, count: number) => Promise<void>;
  computeStats: () => void;
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
  const minGoals = goals.filter((g) => g.isDailyMinimum);
  const hasAnyProgress = goals.some((g) => g.completedCount > 0);

  if (minGoals.length > 0) {
    const allMinComplete = minGoals.every((g) => g.status === 'green');
    if (allMinComplete) return 'green';
    return hasAnyProgress ? 'partial' : 'grey';
  }

  // No daily minimums defined — any complete goal = green
  const anyComplete = goals.some((g) => g.status === 'green');
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
  // Ensure color is always present from template (backend might not return it)
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
  // Sort history newest first (assumption: history is returned newest-first from API)
  const sorted = [...history].sort((a, b) => (a.date > b.date ? -1 : 1));

  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

  const thisMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  let greenDaysThisMonth = 0;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    if (item.date.startsWith(thisMonth) && item.status === 'green') {
      greenDaysThisMonth++;
    }

    if (item.status === 'green') {
      runningStreak++;
      if (i === 0 || currentStreak === runningStreak - 1) {
        currentStreak = runningStreak;
      }
      if (runningStreak > bestStreak) bestStreak = runningStreak;
    } else {
      // Break the forward streak only if we are still within the current streak window
      if (i < currentStreak || currentStreak === 0) {
        runningStreak = 0;
      }
    }
  }

  return { currentStreak, bestStreak, greenDaysThisMonth };
}

// ─── Store ──────────────────────────────────────────────────────────

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      templates: [],
      currentPlan: null,
      history: [],
      isLoading: false,
      error: null,
      currentStreak: 0,
      bestStreak: 0,
      greenDaysThisMonth: 0,

      computeStats: () => {
        const { currentStreak, bestStreak, greenDaysThisMonth } = calculateStreaks(get().history);
        set({ currentStreak, bestStreak, greenDaysThisMonth });
      },

      fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
          const templates = await goalService.getTemplates();
          set({ templates, isLoading: false });
        } catch (error: any) {
          // Keep existing templates on failure (offline support)
          set({ error: error.message, isLoading: false });
        }
      },

      fetchDailyPlan: async (date: string) => {
        set({ isLoading: true, error: null });
        const templates = get().templates;

        // Preserve existing progress for today if plan already loaded
        const existingPlan = get().currentPlan;
        const existingProgress: Record<string, number> = {};
        if (existingPlan?.date === date) {
          existingPlan.goals.forEach((g) => {
            existingProgress[g.goalTemplateId] = g.completedCount;
          });
        }

        try {
          const rawPlan = await planService.getDailyPlan(date);
          const merged = mergePlanWithTemplates(rawPlan, templates);

          // Restore local progress in case backend is out of sync
          const goalsWithProgress = merged.goals.map((g) => {
            const localCount = existingProgress[g.goalTemplateId];
            if (localCount !== undefined && localCount > g.completedCount) {
              const status = computeGoalStatus(localCount, g.targetCount);
              return { ...g, completedCount: localCount, status };
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
          // Backend unavailable — use a local fallback plan and restore any progress
          const fallback = buildFallbackPlan(date, templates);
          const fallbackWithProgress = fallback.goals.map((g) => {
            const localCount = existingProgress[g.goalTemplateId] ?? 0;
            if (localCount > 0) {
              const status = computeGoalStatus(localCount, g.targetCount);
              return { ...g, completedCount: localCount, status };
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

      fetchHistory: async () => {
        try {
          const history = await planService.getHistory(30);
          set({ history });
          get().computeStats();
        } catch (error: any) {
          // Keep existing history silently
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

      /**
       * logProgress: OFFLINE-FIRST approach.
       * 1. Immediately update local state (optimistic update) — UI responds instantly.
       * 2. Silently sync to backend in the background.
       * 3. Never throw away local state based on backend response shape.
       */
      logProgress: async (goalId: string, date: string, count: number) => {
        const currentPlan = get().currentPlan;
        if (!currentPlan) return;

        // ── STEP 1: Optimistic local update (instant UI response) ──
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
          Math.max(updatedGoals.length, 1);

        // Update current plan
        set({
          currentPlan: {
            ...currentPlan,
            goals: updatedGoals,
            summaryStatus,
          },
        });

        // Update history immediately (Optimistic Momentum Grid)
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

        // Sync data for wallpaper/widgets
        syncWallpaperData(completionScore, newHistory);

        // ── STEP 2: Background sync to backend (fire and forget) ──
        try {
          await planService.logProgress({
            goalTemplateId: goalId,
            date,
            completedCount: count,
            source: 'app',
          });

          // Refresh statistics from server silently in background
          const freshHistory: HistoryItem[] = await planService.getHistory(30);

          // Merge logic: Always preserve our local optimistic state for "today"
          // as it is the most immediate source of truth for the user's action.
          const mergedHistory = freshHistory.map((h: HistoryItem) => {
            if (h.date === date) {
              return todayHistoryItem; // Use our local optimistic version for today
            }
            return h;
          });

          // If today isn't in freshHistory (e.g. brand new day), ensure it's added
          if (!mergedHistory.find((h: HistoryItem) => h.date === date)) {
            mergedHistory.unshift(todayHistoryItem);
          }

          set({ history: mergedHistory });
          get().computeStats();
        } catch (error: any) {
          console.log('Background sync failed, keeping optimistic state');
        }
      },
    }),
    {
      name: 'dotivo-goals-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist templates AND currentPlan AND history for offline-first experience
      partialize: (state) => ({
        templates: state.templates,
        currentPlan: state.currentPlan,
        history: state.history,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        greenDaysThisMonth: state.greenDaysThisMonth,
      }),
    }
  )
);
