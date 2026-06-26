export const QUOTES_BY_CATEGORY = {
  discipline: [
    '"Discipline equals freedom." — Jocko Willink',
    '"We are what we repeatedly do." — Aristotle',
    '"Don\'t count the days. Make the days count." — Muhammad Ali',
    '"The secret of getting ahead is getting started." — Mark Twain',
    '"Small daily improvements over time lead to stunning results."',
    '"You don\'t rise to the level of your goals. You fall to the level of your systems." — James Clear',
    '"Every action you take is a vote for the person you wish to become." — James Clear',
    '"Motivation gets you going, but discipline keeps you growing."',
  ],
  consistency: [
    '"Consistency beats intensity every time."',
    '"One rep, one page, one task at a time."',
    '"Show up even when you don\'t feel like it."',
    '"It\'s not about perfect. It\'s about effort." — Jillian Michaels',
    '"Progress is built by boring repetition."',
    '"Big things come from small daily actions."',
    '"Fall down seven times. Stand up eight." — Japanese Proverb',
    '"Success is the sum of small efforts repeated day in and day out." — Robert Collier',
  ],
  mindset: [
    '"You are not your last bad day."',
    '"Missed one day? Great. Show up tomorrow."',
    '"The only bad workout is the one that didn\'t happen."',
    '"Your future self is watching. What are you doing for them today?"',
    '"The pain of discipline is far less than the pain of regret." — Jim Rohn',
    '"Don\'t wish it were easier. Wish you were better." — Jim Rohn',
    '"Be the person your future self needs you to be."',
    '"Your potential is endless."',
  ],
  student: [
    '"Study now. Flex later."',
    '"Your exam results are the compound interest of your daily effort."',
    '"The library is open. The bed is comfortable. Choose wisely."',
    '"Hard work beats talent when talent doesn\'t work hard." — Tim Notke',
    '"Every hour of study is an investment in your future."',
    '"Learn more. Earn more."',
    '"Books before Netflix."',
    '"Struggle is part of the process. Keep going."',
  ],
  fitness: [
    '"Your body keeps every promise you make to it."',
    '"Results happen when you show up when you don\'t want to."',
    '"Strong people are harder to kill." — Mark Rippetoe',
    '"Train insane or remain the same."',
    '"Sweat is just fat crying."',
    '"Your only competition is who you were yesterday."',
    '"Fitness is not about being better than someone else. It\'s about being better than you used to be."',
    '"The gym is the most productive therapy session."',
  ],
  developer: [
    '"Build in silence. Show results."',
    '"Code every day. Ship something small. Repeat."',
    '"One commit a day keeps the excuses away."',
    '"A year from now you\'ll wish you started today." — Karen Lamb',
    '"Good code is its own best documentation."',
    '"Debugging is twice as hard as writing the code in the first place." — Brian W. Kernighan',
    '"Write code that makes you proud."',
    '"The best time to plant a tree was 20 years ago. The second best time is now." — Chinese Proverb',
  ],
  gratitude: [
    '"Be thankful for what you have while working for what you want."',
    '"Gratitude turns what we have into enough."',
    '"Start each day with a grateful heart."',
    '"Happiness is not having what you want. It\'s appreciating what you have."',
    '"Small wins deserve big celebrations."',
  ],
};

// Flat list for random/daily selection
export const ALL_QUOTES: string[] = Object.values(QUOTES_BY_CATEGORY).flat();

/**
 * Returns a stable quote for the given day (0-indexed day of month or epoch day)
 */
export function getDailyQuote(dayIndex?: number): string {
  const idx = dayIndex ?? new Date().getDate();
  return ALL_QUOTES[idx % ALL_QUOTES.length];
}
