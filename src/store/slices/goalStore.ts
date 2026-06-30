import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { goalService, planService } from '../../config/restClient';
import { syncWallpaperData } from '../../utils/wallpaper';
import { GOAL_CATEGORIES } from '../../config/constants/goalTemplates';
import { ALL_QUOTES } from '../../config/constants/quotes';
import { quoteService } from '../../config/restClient';

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
  goals?: any[];
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

export type OfflineOperation =
  | { id: string; type: 'CREATE_GOAL'; localId: string; payload: any; createdAt: string; retryCount: number; }
  | { id: string; type: 'UPDATE_GOAL'; goalId: string; payload: any; createdAt: string; retryCount: number; }
  | { id: string; type: 'DELETE_GOAL'; goalId: string; createdAt: string; retryCount: number; }
  | { id: string; type: 'UPSERT_COMPLETION'; goalId: string; date: string; completedCount: number; source: string; createdAt: string; retryCount: number; };

export interface CustomTheme {
  id: string;
  name: string;
  emoji: string;
  colors: {
    primary: string;
    empty: string;
    background: string;
  };
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
  offlineQueue: OfflineOperation[];
  isSyncing: boolean;
  hasHydrated: boolean;
  customThemes: CustomTheme[];

  quotes: string[];

  // Actions
  fetchQuotes: () => Promise<void>;
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
  syncWithBackend: () => Promise<void>;
  _setHasHydrated: (state: boolean) => void;
  saveCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (id: string) => void;
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
  const offset = new Date().getTimezoneOffset() * 60000;
  const todayStr = new Date(new Date().getTime() - offset).toISOString().split('T')[0];

  for (const item of sorted) {
    if (item.date.startsWith(thisMonth) && item.status === 'green') {
      greenDaysThisMonth++;
    }
    if (!currentStreakBroken) {
      if (item.status === 'green') {
        currentStreak++;
      } else if (item.date === todayStr) {
        // Today is allowed to be incomplete without breaking the streak
        continue;
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
      offlineQueue: [],
      isSyncing: false,
      hasHydrated: false,
      customThemes: [],
      quotes: ALL_QUOTES,

      setHasOnboarded: (val) => set({ hasOnboarded: val }),
      _setHasHydrated: (state) => set({ hasHydrated: state }),

      fetchQuotes: async () => {
        try {
          const quotesData = await quoteService.getActiveQuotes();
          const dynamicQuotes = Object.values(quotesData).flat() as string[];
          if (dynamicQuotes.length > 0) {
            set({ quotes: dynamicQuotes });
          }
        } catch (e) {
          console.warn('Could not update quotes from API');
        }
      },

      saveCustomTheme: (theme) => {
        set({ customThemes: [...get().customThemes, theme] });
      },

      deleteCustomTheme: (id) => {
        set({ customThemes: get().customThemes.filter(t => t.id !== id) });
      },

      syncWithBackend: async () => {
        const state = get();
        if (state.isSyncing) return;
        if (!state.hasHydrated) return;

        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;

        if (state.offlineQueue.length === 0) return;

        set({ isSyncing: true });

        let localToServerIdMap: Record<string, string> = {};
        let syncFailed = false;

        const updatedQueue = [...state.offlineQueue];

        while (updatedQueue.length > 0) {
          const op = updatedQueue[0];
          try {
            if (op.type === 'CREATE_GOAL') {
              const res = await goalService.createTemplate(op.payload);
              localToServerIdMap[op.localId] = res._id;
            }
            else if (op.type === 'UPDATE_GOAL') {
              const actualId = localToServerIdMap[op.goalId] || op.goalId;
              // If it's a local ID and not in map, it must have been deleted or never created on backend. Safe to ignore or retry later.
              if (!actualId.startsWith('local-')) {
                await goalService.updateTemplate(actualId, op.payload);
              }
            }
            else if (op.type === 'DELETE_GOAL') {
              const actualId = localToServerIdMap[op.goalId] || op.goalId;
              if (!actualId.startsWith('local-')) {
                await goalService.deleteTemplate(actualId);
              }
            }
            else if (op.type === 'UPSERT_COMPLETION') {
              const actualId = localToServerIdMap[op.goalId] || op.goalId;
              if (!actualId.startsWith('local-')) {
                await planService.logProgress({
                  goalTemplateId: actualId,
                  date: op.date,
                  completedCount: op.completedCount,
                  source: op.source,
                });
              }
            }
            // Operation succeeded, remove it from queue
            updatedQueue.shift();
            // Update queue in state immediately in case of crash
            set({ offlineQueue: [...updatedQueue] });
          } catch (e: any) {
            console.log('[Sync] Operation failed:', e.message);
            // Increment retry count, stop syncing
            op.retryCount += 1;
            set({ offlineQueue: [...updatedQueue] });
            syncFailed = true;
            break;
          }
        }

        // Apply ID mappings to local state if we created any goals
        if (Object.keys(localToServerIdMap).length > 0) {
          const mapId = (id: string) => localToServerIdMap[id] || id;

          set((s) => ({
            templates: s.templates.map(t => ({ ...t, _id: mapId(t._id) })),
            currentPlan: s.currentPlan ? {
              ...s.currentPlan,
              goals: s.currentPlan.goals.map(g => ({ ...g, goalTemplateId: mapId(g.goalTemplateId) }))
            } : null,
            offlineQueue: s.offlineQueue.map(op => {
              if (op.type === 'UPDATE_GOAL' || op.type === 'DELETE_GOAL' || op.type === 'UPSERT_COMPLETION') {
                return { ...op, goalId: mapId(op.goalId) };
              }
              return op;
            })
          }));
        }

        set({ isSyncing: false });

        // Always fetch public quotes regardless of personal sync success
        await get().fetchQuotes();

        // Only fetch fresh personal data if queue is entirely empty so we don't overwrite pending data
        if (!syncFailed && updatedQueue.length === 0) {
          await get().fetchTemplates();
          const today = new Date().toISOString().split('T')[0];
          await get().fetchDailyPlan(today);
        }
      },

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

          const existingHistory = get().history;
          if (existingHistory.length > 0 && existingHistory[0].date === date) {
            const completedCount = goalsWithProgress.filter(g => g.status === 'green').length;
            const totalActive = goalsWithProgress.filter(g => g.status !== 'skipped').length;
            const completionScore = totalActive > 0 ? completedCount / totalActive : 0;

            const updatedHistory = existingHistory.map((h, i) => i === 0 ? {
              ...h,
              status: finalPlan.summaryStatus,
              completionScore,
              goals: goalsWithProgress
            } : h);

            set({ history: updatedHistory });
            syncWallpaperData(completionScore, updatedHistory);
          }
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

          const existingHistory = get().history;
          if (existingHistory.length > 0 && existingHistory[0].date === date) {
            const completedCount = fallbackWithProgress.filter(g => g.status === 'green').length;
            const totalActive = fallbackWithProgress.filter(g => g.status !== 'skipped').length;
            const completionScore = totalActive > 0 ? completedCount / totalActive : 0;

            const updatedHistory = existingHistory.map((h, i) => i === 0 ? {
              ...h,
              status: fallbackPlan.summaryStatus,
              completionScore,
              goals: fallbackWithProgress
            } : h);

            set({ history: updatedHistory });
            syncWallpaperData(completionScore, updatedHistory);
          }
        }
      },

      fetchHistory: async (range) => {
        const effectiveRange = range ?? get().historyRange;
        try {
          const rawHistory = await planService.getHistory(effectiveRange);
          console.log("RAW HISTORY FETCHED FROM BE:", JSON.stringify(rawHistory, null, 2));

          const today = new Date();
          const continuousHistory: HistoryItem[] = [];
          for (let i = 0; i < effectiveRange; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const offset = d.getTimezoneOffset() * 60000;
            const dateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];

            const existing = rawHistory.find((h: any) => h.date === dateStr);
            const currentPlan = get().currentPlan;
            if (currentPlan && currentPlan.date === dateStr) {
              const completedCount = currentPlan.goals.filter(g => g.status === 'green').length;
              const totalActive = currentPlan.goals.filter(g => g.status !== 'skipped').length;
              const completionScore = totalActive > 0 ? completedCount / totalActive : 0;
              continuousHistory.push({
                date: dateStr,
                status: currentPlan.summaryStatus,
                completionScore,
                goals: currentPlan.goals,
              });
            } else if (existing) {
              continuousHistory.push(existing);
            } else {
              continuousHistory.push({
                date: dateStr,
                status: 'grey',
                completionScore: 0,
                goals: [],
              });
            }
          }

          console.log("PROCESSED HISTORY SET IN STORE:", JSON.stringify(continuousHistory, null, 2));

          set({ history: continuousHistory, historyRange: effectiveRange });
          get().computeStats();
          get().computeWeeklyStats();
          get().checkAndAwardBadges();

          // Keep wallpaper synced with fetched history
          const todayScore = continuousHistory[0]?.completionScore ?? 0;
          syncWallpaperData(todayScore, continuousHistory);
        } catch (error: any) {
          console.log('History sync skipped (offline):', error.message);
        }
      },

      addTemplate: async (data) => {
        const localId = `local-${Date.now()}`;
        const newTemplate = { ...data, _id: localId };

        set((state) => ({
          templates: [...state.templates, newTemplate],
          offlineQueue: [...state.offlineQueue, {
            id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'CREATE_GOAL',
            localId,
            payload: data,
            createdAt: new Date().toISOString(),
            retryCount: 0
          }]
        }));

        const today = new Date().toISOString().split('T')[0];
        await get().fetchDailyPlan(today);
        get().checkAndAwardBadges();
        get().syncWithBackend();
      },

      updateTemplate: async (id, data) => {
        set((state) => ({
          templates: state.templates.map(t => t._id === id ? { ...t, ...data } : t),
          offlineQueue: [...state.offlineQueue, {
            id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'UPDATE_GOAL',
            goalId: id,
            payload: data,
            createdAt: new Date().toISOString(),
            retryCount: 0
          }]
        }));

        const today = new Date().toISOString().split('T')[0];
        await get().fetchDailyPlan(today);
        get().syncWithBackend();
      },

      removeTemplate: async (id) => {
        set((state) => ({
          templates: state.templates.filter(t => t._id !== id),
          offlineQueue: [...state.offlineQueue, {
            id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'DELETE_GOAL',
            goalId: id,
            createdAt: new Date().toISOString(),
            retryCount: 0
          }]
        }));

        const today = new Date().toISOString().split('T')[0];
        await get().fetchDailyPlan(today);
        get().syncWithBackend();
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
          goals: updatedGoals,
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

        // Offline queue UPSERT logic for completions
        set((state) => {
          const newQueue = [...state.offlineQueue];
          const existingIdx = newQueue.findIndex(
            (op) => op.type === 'UPSERT_COMPLETION' && op.goalId === goalId && op.date === date
          );

          if (existingIdx >= 0) {
            // Update existing upsert
            newQueue[existingIdx] = {
              ...newQueue[existingIdx],
              completedCount: count, // use latest count
            } as Extract<OfflineOperation, { type: 'UPSERT_COMPLETION' }>;
          } else {
            newQueue.push({
              id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              type: 'UPSERT_COMPLETION',
              goalId,
              date,
              completedCount: count,
              source: 'app',
              createdAt: new Date().toISOString(),
              retryCount: 0,
            });
          }

          return { offlineQueue: newQueue };
        });

        get().syncWithBackend();
      },
    }),
    {
      name: 'dotivo-goals-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._setHasHydrated(true);
        }
      },
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
        offlineQueue: state.offlineQueue,
        customThemes: state.customThemes,
        quotes: state.quotes,
      }),
    }
  )
);
