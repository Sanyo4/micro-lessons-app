import * as Speech from 'expo-speech';
import type { BudgetState } from '../utils/budgetState';
import { playBudgetHaptic } from './haptics';
import { playBudgetTone } from './tonalAudio';

const SPEECH_PARAMS: Record<BudgetState, { rate: number; pitch: number }> = {
  excellent: { rate: 0.85, pitch: 1.1 },
  good: { rate: 0.9, pitch: 1.0 },
  warning: { rate: 1.0, pitch: 0.9 },
  critical: { rate: 1.1, pitch: 0.8 },
  overBudget: { rate: 1.15, pitch: 0.7 },
};

export async function speakBudgetState(
  state: BudgetState,
  spent: number,
  limit: number,
): Promise<void> {
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) return;

  const percentage = Math.round((spent / limit) * 100);
  const params = SPEECH_PARAMS[state];

  let message: string;
  switch (state) {
    case 'excellent':
      message = `You're doing great. ${percentage}% of your budget used.`;
      break;
    case 'good':
      message = `On track. ${percentage}% of your budget used.`;
      break;
    case 'warning':
      message = `Heads up. ${percentage}% of your budget is gone.`;
      break;
    case 'critical':
      message = `Careful. You've used ${percentage}% of your budget.`;
      break;
    case 'overBudget': {
      const overAmount = (spent - limit).toFixed(0);
      message = `You've gone over budget by £${overAmount}.`;
      break;
    }
  }

  Speech.speak(message, {
    language: 'en-US',
    rate: params.rate,
    pitch: params.pitch,
  });
}

export function announceTransaction(amount: number, category: string): void {
  Speech.speak(`Logged £${amount.toFixed(0)} on ${category}.`, {
    language: 'en-US',
    rate: 0.95,
  });
}

export function announceScreen(screenName: string, summary: string): void {
  Speech.speak(`${screenName}. ${summary}`, {
    language: 'en-US',
    rate: 0.9,
  });
}

/**
 * Coordinated multi-sensory budget feedback:
 * 1. Haptic fires first (near-zero latency)
 * 2. Tonal cue plays (~1 second)
 * 3. TTS announces after tone finishes
 */
export async function playFullBudgetFeedback(
  state: BudgetState,
  spent: number,
  limit: number,
): Promise<void> {
  // 1. Haptic — fire and forget (near-instant)
  playBudgetHaptic(state);

  // 2. Tonal cue — wait for it to play (~1s)
  await playBudgetTone(state);

  // Small gap between tone and speech
  await new Promise((r) => setTimeout(r, 300));

  // 3. TTS announcement
  await speakBudgetState(state, spent, limit);
}
