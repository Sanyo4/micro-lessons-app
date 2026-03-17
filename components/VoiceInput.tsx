import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface VoiceInputProps {
  onTranscript: (text: string) => Promise<void>;
  isProcessing: boolean;
}

const MIC_SIZE = 72;
const RING_DURATION = 1500;

export default function VoiceInput({ onTranscript, isProcessing }: VoiceInputProps) {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Pulse ring animations
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0);

  useEffect(() => {
    if (recognizing) {
      // Ring 1
      ring1Scale.value = withRepeat(
        withTiming(1.8, { duration: RING_DURATION, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      ring1Opacity.value = withRepeat(
        withTiming(0, { duration: RING_DURATION, easing: Easing.in(Easing.ease) }),
        -1,
        false,
      );

      // Ring 2 (staggered)
      ring2Scale.value = withDelay(
        RING_DURATION / 2,
        withRepeat(
          withTiming(1.8, { duration: RING_DURATION, easing: Easing.out(Easing.ease) }),
          -1,
          false,
        ),
      );
      ring2Opacity.value = withDelay(
        RING_DURATION / 2,
        withRepeat(
          withTiming(0, { duration: RING_DURATION, easing: Easing.in(Easing.ease) }),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(ring1Scale);
      cancelAnimation(ring1Opacity);
      cancelAnimation(ring2Scale);
      cancelAnimation(ring2Opacity);
      ring1Scale.value = withTiming(1, { duration: 200 });
      ring1Opacity.value = withTiming(0, { duration: 200 });
      ring2Scale.value = withTiming(1, { duration: 200 });
      ring2Opacity.value = withTiming(0, { duration: 200 });
    }
  }, [recognizing, ring1Scale, ring1Opacity, ring2Scale, ring2Opacity]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
  });
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);

    // If this is a final result, send it
    if (event.isFinal && text.trim()) {
      setTranscript('');
      onTranscript(text.trim());
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error:', event.error, event.message);
    setRecognizing(false);
  });

  const handlePress = async () => {
    if (isProcessing) return;

    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      return;
    }

    setTranscript('');
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* Mic button with pulse rings */}
      <View style={styles.micContainer}>
        <Animated.View style={[styles.ring, ring1Style]} />
        <Animated.View style={[styles.ring, ring2Style]} />
        <Pressable
          style={[
            styles.micButton,
            recognizing && styles.micButtonActive,
            isProcessing && styles.micButtonDisabled,
          ]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={
            isProcessing
              ? 'Processing'
              : recognizing
                ? 'Stop recording'
                : 'Start voice input'
          }
          accessibilityState={{ disabled: isProcessing, busy: isProcessing }}
        >
          <Text style={styles.micIcon} importantForAccessibility="no">
            {recognizing ? '⏹️' : '🎙️'}
          </Text>
        </Pressable>
      </View>

      {/* Transcript or hint */}
      <Text
        style={styles.transcript}
        accessibilityLiveRegion="polite"
      >
        {isProcessing
          ? 'Processing...'
          : transcript
            ? transcript
            : recognizing
              ? 'Listening...'
              : 'Tap to speak'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  micContainer: {
    width: MIC_SIZE * 2,
    height: MIC_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: Colors.voicePulse,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: Colors.primaryDark,
  },
  micButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  micIcon: {
    fontSize: 28,
  },
  transcript: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    minHeight: 22,
    paddingHorizontal: Spacing.xxl,
  },
});
