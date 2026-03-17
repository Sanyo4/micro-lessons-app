import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';
import type { BudgetState } from '../utils/budgetState';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Android vibration patterns: [wait, vibrate, wait, vibrate, ...]
const ANDROID_PATTERNS: Record<BudgetState, number[]> = {
  excellent: [0, 100, 500, 100, 500, 100],                         // 3 pulses, 500ms gaps
  good: [0, 100, 300, 100, 300, 100, 300, 100],                    // 4 pulses, 300ms gaps
  warning: [0, 80, 150, 80, 150, 80, 150, 80, 150, 80],            // 5 pulses, 150ms gaps
  critical: [0, 60, 50, 60, 50, 60, 50, 60, 50, 60, 50, 60, 50, 60], // 8 rapid pulses, 50ms gaps
  overBudget: [0, 300, 100, 100, 100, 100, 100, 300],              // Emergency SOS-like
};

// iOS: sequenced impactAsync calls with spec-matching intervals
const IOS_PATTERNS: Record<BudgetState, { count: number; interval: number; style: Haptics.ImpactFeedbackStyle }> = {
  excellent: { count: 3, interval: 500, style: Haptics.ImpactFeedbackStyle.Light },
  good: { count: 4, interval: 300, style: Haptics.ImpactFeedbackStyle.Light },
  warning: { count: 5, interval: 150, style: Haptics.ImpactFeedbackStyle.Medium },
  critical: { count: 8, interval: 50, style: Haptics.ImpactFeedbackStyle.Heavy },
  overBudget: { count: 5, interval: 100, style: Haptics.ImpactFeedbackStyle.Heavy },
};

export async function playBudgetHaptic(state: BudgetState): Promise<void> {
  if (Platform.OS === 'android') {
    Vibration.vibrate(ANDROID_PATTERNS[state]);
    return;
  }

  // iOS: sequenced Haptics.impactAsync
  const pattern = IOS_PATTERNS[state];
  for (let i = 0; i < pattern.count; i++) {
    await Haptics.impactAsync(pattern.style);
    if (i < pattern.count - 1) {
      await delay(pattern.interval);
    }
  }
}

export async function playTransactionHaptic(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function playSuccessHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
