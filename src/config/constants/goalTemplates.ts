export interface GoalPreset {
  title: string;
  category: string;
  targetCount: number;
  isDailyMinimum: boolean;
  color: string;
  frequencyType: 'daily' | 'weekly' | 'specific_days';
  selectedDays?: number[];
  icon: string;
}

export const GOAL_TEMPLATES: Record<string, GoalPreset[]> = {
  'Student': [
    { title: 'Study 2 hours', category: 'Study', targetCount: 2, isDailyMinimum: true, color: '#6366F1', frequencyType: 'daily', icon: 'book-open' },
    { title: 'Complete 1 chapter', category: 'Study', targetCount: 1, isDailyMinimum: true, color: '#8B5CF6', frequencyType: 'daily', icon: 'book' },
    { title: 'Solve 5 practice problems', category: 'Study', targetCount: 5, isDailyMinimum: false, color: '#7C3AED', frequencyType: 'daily', icon: 'pen-tool' },
    { title: 'Read notes', category: 'Study', targetCount: 1, isDailyMinimum: true, color: '#6366F1', frequencyType: 'daily', icon: 'file-text' },
    { title: 'No phone in study session', category: 'Study', targetCount: 1, isDailyMinimum: false, color: '#4F46E5', frequencyType: 'daily', icon: 'phone-off' },
  ],
  'Fitness': [
    { title: 'Workout', category: 'Fitness', targetCount: 1, isDailyMinimum: true, color: '#EF4444', frequencyType: 'specific_days', selectedDays: [1, 3, 5], icon: 'dumbbell' },
    { title: 'Walk 10,000 steps', category: 'Fitness', targetCount: 10000, isDailyMinimum: false, color: '#F97316', frequencyType: 'daily', icon: 'footprints' },
    { title: 'Drink 8 glasses of water', category: 'Fitness', targetCount: 8, isDailyMinimum: true, color: '#38BDF8', frequencyType: 'daily', icon: 'droplets' },
    { title: 'Stretch 10 minutes', category: 'Fitness', targetCount: 1, isDailyMinimum: false, color: '#F59E0B', frequencyType: 'daily', icon: 'activity' },
    { title: 'Protein goal met', category: 'Fitness', targetCount: 1, isDailyMinimum: false, color: '#10B981', frequencyType: 'daily', icon: 'zap' },
  ],
  'Coding / Dev': [
    { title: 'Code 1 hour', category: 'Coding / Dev', targetCount: 1, isDailyMinimum: true, color: '#10B981', frequencyType: 'daily', icon: 'code' },
    { title: 'Solve 1 LeetCode problem', category: 'Coding / Dev', targetCount: 1, isDailyMinimum: false, color: '#34D399', frequencyType: 'daily', icon: 'terminal' },
    { title: 'Work on side project', category: 'Coding / Dev', targetCount: 1, isDailyMinimum: true, color: '#6366F1', frequencyType: 'daily', icon: 'git-branch' },
    { title: 'Learn something new', category: 'Coding / Dev', targetCount: 1, isDailyMinimum: false, color: '#8B5CF6', frequencyType: 'daily', icon: 'cpu' },
    { title: 'Write a commit', category: 'Coding / Dev', targetCount: 1, isDailyMinimum: false, color: '#3B82F6', frequencyType: 'daily', icon: 'git-commit' },
  ],
  'Sleep': [
    { title: 'Sleep by 11pm', category: 'Sleep', targetCount: 1, isDailyMinimum: true, color: '#1D4ED8', frequencyType: 'daily', icon: 'moon' },
    { title: 'Wake up by 6am', category: 'Sleep', targetCount: 1, isDailyMinimum: true, color: '#F59E0B', frequencyType: 'daily', icon: 'sunrise' },
    { title: 'No phone 1hr before sleep', category: 'Sleep', targetCount: 1, isDailyMinimum: false, color: '#7C3AED', frequencyType: 'daily', icon: 'phone-off' },
    { title: '8 hours of sleep', category: 'Sleep', targetCount: 1, isDailyMinimum: false, color: '#3B82F6', frequencyType: 'daily', icon: 'bed' },
  ],
  'Mindfulness': [
    { title: 'Meditate 10 minutes', category: 'Mindfulness', targetCount: 1, isDailyMinimum: true, color: '#8B5CF6', frequencyType: 'daily', icon: 'heart' },
    { title: 'Journal 1 page', category: 'Mindfulness', targetCount: 1, isDailyMinimum: false, color: '#EC4899', frequencyType: 'daily', icon: 'edit-3' },
    { title: 'Gratitude list', category: 'Mindfulness', targetCount: 3, isDailyMinimum: false, color: '#F59E0B', frequencyType: 'daily', icon: 'star' },
    { title: 'Deep breathing', category: 'Mindfulness', targetCount: 1, isDailyMinimum: false, color: '#34D399', frequencyType: 'daily', icon: 'wind' },
  ],
  'Reading': [
    { title: 'Read 20 pages', category: 'Reading', targetCount: 20, isDailyMinimum: true, color: '#F59E0B', frequencyType: 'daily', icon: 'book-open' },
    { title: 'Read 10 minutes', category: 'Reading', targetCount: 1, isDailyMinimum: false, color: '#F97316', frequencyType: 'daily', icon: 'book' },
    { title: 'Finish 1 article', category: 'Reading', targetCount: 1, isDailyMinimum: false, color: '#EF4444', frequencyType: 'daily', icon: 'file-text' },
  ],
  'Nutrition': [
    { title: 'Eat 3 healthy meals', category: 'Nutrition', targetCount: 3, isDailyMinimum: true, color: '#10B981', frequencyType: 'daily', icon: 'apple' },
    { title: 'No junk food', category: 'Nutrition', targetCount: 1, isDailyMinimum: false, color: '#EF4444', frequencyType: 'daily', icon: 'x-circle' },
    { title: 'Take vitamins', category: 'Nutrition', targetCount: 1, isDailyMinimum: false, color: '#F59E0B', frequencyType: 'daily', icon: 'pill' },
    { title: 'Drink water before meals', category: 'Nutrition', targetCount: 3, isDailyMinimum: false, color: '#38BDF8', frequencyType: 'daily', icon: 'droplets' },
  ],
  'Digital Detox': [
    { title: 'No social media', category: 'Digital Detox', targetCount: 1, isDailyMinimum: false, color: '#EF4444', frequencyType: 'daily', icon: 'wifi-off' },
    { title: 'Screen time under 2hrs', category: 'Digital Detox', targetCount: 1, isDailyMinimum: false, color: '#F97316', frequencyType: 'daily', icon: 'smartphone' },
    { title: 'Phone-free morning 1hr', category: 'Digital Detox', targetCount: 1, isDailyMinimum: false, color: '#8B5CF6', frequencyType: 'daily', icon: 'sunrise' },
  ],
  'Finance': [
    { title: 'Log expenses', category: 'Finance', targetCount: 1, isDailyMinimum: true, color: '#10B981', frequencyType: 'daily', icon: 'dollar-sign' },
    { title: 'No unnecessary spend', category: 'Finance', targetCount: 1, isDailyMinimum: false, color: '#EF4444', frequencyType: 'daily', icon: 'shopping-cart' },
    { title: 'Review budget', category: 'Finance', targetCount: 1, isDailyMinimum: false, color: '#F59E0B', frequencyType: 'weekly', icon: 'bar-chart' },
  ],
  'Prayer / Spirituality': [
    { title: 'Morning prayer', category: 'Prayer / Spirituality', targetCount: 1, isDailyMinimum: true, color: '#F59E0B', frequencyType: 'daily', icon: 'sun' },
    { title: 'Evening prayer', category: 'Prayer / Spirituality', targetCount: 1, isDailyMinimum: true, color: '#8B5CF6', frequencyType: 'daily', icon: 'moon' },
    { title: 'Read religious text', category: 'Prayer / Spirituality', targetCount: 1, isDailyMinimum: false, color: '#F97316', frequencyType: 'daily', icon: 'book-open' },
  ],
};

export const GOAL_CATEGORIES = [
  'Health',
  'Fitness',
  'Study',
  'Productivity',
  'Coding / Dev',
  'Finance',
  'Sleep',
  'Mindfulness',
  'Reading',
  'Prayer / Spirituality',
  'Nutrition',
  'Digital Detox',
  'Personal Growth',
] as const;

export type GoalCategory = typeof GOAL_CATEGORIES[number];
