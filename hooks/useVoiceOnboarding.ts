// Reusable voice onboarding hook — shake to talk + keyword matching.
// Each screen passes an instruction (TTS) and keyword→handler map.
// User hears instruction → auto-mic activates → says keyword → handler fires.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useShakeDetector } from './useShakeDetector';
import {
  playMicActivateHaptic,
  playMicDeactivateHaptic,
  playShakeDetectedHaptic,
} from '../services/haptics';

interface VoiceOnboardingOptions {
  // TTS instruction spoken on mount
  instruction: string;
  // Keyword → handler map. Keys are lowercase phrases to match.
  // Special key '*' matches any input and passes the transcript.
  keywords: Record<string, (transcript?: string) => void>;
  // Delay before speaking instruction (default 600ms)
  speakDelay?: number;
  // Whether the hook is active (default true)
  enabled?: boolean;
}

interface VoiceOnboardingState {
  isListening: boolean;
  transcript: string;
  // Call to manually re-speak the instruction
  repeatInstruction: () => void;
  // Call to manually start listening (without shake)
  startListening: () => void;
  // Speak feedback text then auto-activate mic when done
  speakWithAutoMic: (text: string, rate?: number) => void;
}

export function useVoiceOnboarding({
  instruction,
  keywords,
  speakDelay = 600,
  enabled = true,
}: VoiceOnboardingOptions): VoiceOnboardingState {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const keywordsRef = useRef(keywords);
  const instructionRef = useRef(instruction);
  const hadFinalResultRef = useRef(false);

  // Keep refs fresh
  useEffect(() => {
    keywordsRef.current = keywords;
  }, [keywords]);
  useEffect(() => {
    instructionRef.current = instruction;
  }, [instruction]);

  const startListening = useCallback(async () => {
    if (!enabled || Platform.OS === 'web') return;
    Speech.stop();
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) return;
    setTranscript('');
    playMicActivateHaptic();
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }, [enabled]);

  // Speak instruction on mount, auto-mic when done
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      Speech.speak(instruction, {
        language: 'en-US',
        rate: 0.9,
        onDone: () => { startListening(); },
        onStopped: () => { /* user interrupted — no auto-mic */ },
      });
    }, speakDelay);
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [instruction, speakDelay, enabled, startListening]);

  const repeatInstruction = useCallback(() => {
    Speech.stop();
    Speech.speak(instructionRef.current, {
      language: 'en-US',
      rate: 0.9,
      onDone: () => { startListening(); },
      onStopped: () => {},
    });
  }, [startListening]);

  const speakWithAutoMic = useCallback((text: string, rate = 0.95) => {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate,
      onDone: () => { startListening(); },
      onStopped: () => {},
    });
  }, [startListening]);

  // Shake to start listening
  useShakeDetector({
    onShake: () => {
      playShakeDetectedHaptic();
      startListening();
    },
    enabled: enabled && !isListening,
  });

  // Speech recognition events
  useSpeechRecognitionEvent('start', () => {
    hadFinalResultRef.current = false;
    setIsListening(true);
  });
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    if (hadFinalResultRef.current) playMicDeactivateHaptic();
  });
  useSpeechRecognitionEvent('error', () => setIsListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);

    if (event.isFinal && text.trim()) {
      hadFinalResultRef.current = true;
      const lower = text.toLowerCase().trim();
      setTranscript('');

      // Check keyword matches
      const kws = keywordsRef.current;
      for (const [keyword, handler] of Object.entries(kws)) {
        if (keyword === '*') continue; // wildcard handled last
        if (lower.includes(keyword) || lower === keyword) {
          handler(text);
          return;
        }
      }

      // Wildcard fallback — passes full transcript
      if (kws['*']) {
        kws['*'](text);
      }
    }
  });

  return { isListening, transcript, repeatInstruction, startListening, speakWithAutoMic };
}
