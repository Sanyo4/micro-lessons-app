import { Audio } from 'expo-av';
import type { BudgetState } from '../utils/budgetState';

const SOUND_FILES: Record<BudgetState, ReturnType<typeof require>> = {
  excellent: require('../assets/sounds/excellent.wav'),
  good: require('../assets/sounds/good.wav'),
  warning: require('../assets/sounds/warning.wav'),
  critical: require('../assets/sounds/critical.wav'),
  overBudget: require('../assets/sounds/overbudget.wav'),
};

let currentSound: Audio.Sound | null = null;

export async function playBudgetTone(state: BudgetState): Promise<void> {
  try {
    await stopTone();

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });

    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[state]);
    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        if (currentSound === sound) {
          currentSound = null;
        }
      }
    });

    await sound.playAsync();
  } catch (err) {
    console.warn('Tonal audio playback failed:', err);
  }
}

export async function stopTone(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Already unloaded
    }
    currentSound = null;
  }
}
