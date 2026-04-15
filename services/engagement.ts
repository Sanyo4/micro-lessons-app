// Brief 03 — Engagement event tracking and bonus score calculation
import {
  addEngagementEvent,
  getEngagementEventsSince,
  getRecentTransactions,
  getCompletedLessons,
  getCompletedChallenges,
  getUserProfile,
} from './database';

export type EngagementEventType =
  | 'transaction_log'
  | 'lesson_complete'
  | 'challenge_complete'
  | 'dialogue_interact'
  | 'voice_input';

export async function recordEngagement(type: EngagementEventType): Promise<void> {
  await addEngagementEvent(type);
}

/**
 * Calculate engagement bonus (0–30 points).
 * +5 for each of up to 6 conditions, capped at 30.
 */
export async function calculateEngagementBonus(): Promise<number> {
  let bonus = 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // +5: Active logging streak (3+ days)
  const profile = await getUserProfile();
  if (profile && profile.streak_days >= 3) {
    bonus += 5;
  }

  // +5: Completed a lesson this week
  const completedLessons = await getCompletedLessons();
  const lessonsThisWeek = completedLessons.filter(l => l.completed_at >= weekAgo);
  if (lessonsThisWeek.length > 0) {
    bonus += 5;
  }

  // +5: Completed a challenge this week
  const completedChallenges = await getCompletedChallenges();
  const challengesThisWeek = completedChallenges.filter(c => c.created_at >= weekAgo);
  if (challengesThisWeek.length > 0) {
    bonus += 5;
  }

  // +5: Logged at least one transaction today
  const recentTransactions = await getRecentTransactions(50);
  const transactionsToday = recentTransactions.filter(t => t.timestamp >= todayStart);
  if (transactionsToday.length > 0) {
    bonus += 5;
  }

  // +5: Interacted with pet dialogue today
  const todayEvents = await getEngagementEventsSince(todayStart);
  const dialogueEvents = todayEvents.filter(e => e.event_type === 'dialogue_interact');
  if (dialogueEvents.length > 0) {
    bonus += 5;
  }

  // +5: Used voice input this session (check today's events)
  const voiceEvents = todayEvents.filter(e => e.event_type === 'voice_input');
  if (voiceEvents.length > 0) {
    bonus += 5;
  }

  return Math.min(30, bonus);
}
