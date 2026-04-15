// Brief 02 — Animal Crossing-style speech bubble with typewriter animation
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { useTheme, getTypewriterSpeed } from '../../theme';

interface SpeechBubbleProps {
  message: string;
  onAnimationComplete?: () => void;
}

export default function SpeechBubble({ message, onAnimationComplete }: SpeechBubbleProps) {
  const theme = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  const reducedMotion = theme.accessibility.reducedMotion;
  const speed = getTypewriterSpeed(theme.accessibility.ttsSpeed);

  // Start typewriter animation when message changes
  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      return;
    }

    if (reducedMotion) {
      // Show full text immediately in reduced motion mode
      setDisplayedText(message);
      speakMessage(message);
      onAnimationComplete?.();
      return;
    }

    // Reset and start typewriter
    setDisplayedText('');
    indexRef.current = 0;
    setIsAnimating(true);

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= message.length) {
        setDisplayedText(message);
        setIsAnimating(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        speakMessage(message);
        onAnimationComplete?.();
      } else {
        setDisplayedText(message.slice(0, indexRef.current));
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [message, reducedMotion, speed]);

  const speakMessage = useCallback(async (text: string) => {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) await Speech.stop();

      const rateMap = { slow: 0.8, normal: 0.95, fast: 1.15 };
      Speech.speak(text, {
        language: 'en-US',
        rate: rateMap[theme.accessibility.ttsSpeed],
      });
    } catch {
      // TTS may not be available on all platforms
    }
  }, [theme.accessibility.ttsSpeed]);

  const handleTapToSkip = useCallback(() => {
    if (!isAnimating) return;

    // Skip to full text
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText(message);
    setIsAnimating(false);
    speakMessage(message);
    onAnimationComplete?.();
  }, [isAnimating, message, speakMessage, onAnimationComplete]);

  if (!message) return null;

  return (
    <View style={styles.container}>
      {/* Tail pointing up toward terminal */}
      <View
        style={[
          styles.tail,
          { borderBottomColor: theme.colors.base.surface },
        ]}
      />

      <Pressable
        onPress={handleTapToSkip}
        accessible
        accessibilityRole="text"
        accessibilityLabel={message}
        accessibilityHint={isAnimating ? 'Tap to skip animation' : 'Double tap to hear again'}
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.base.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
          },
          theme.shadows.sm,
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: theme.colors.base.textPrimary,
              fontFamily: theme.fontsLoaded ? theme.fonts.body : undefined,
              fontSize: theme.typeScale.bodyLarge,
              lineHeight: theme.typeScale.bodyLarge * theme.lineHeight.normal,
            },
          ]}
        >
          {displayedText}
          {isAnimating && <Text style={styles.cursor}>|</Text>}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  bubble: {
    width: '100%',
  },
  text: {
    textAlign: 'left',
  },
  cursor: {
    opacity: 0.5,
  },
});
