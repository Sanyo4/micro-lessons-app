import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import NumPad from '../../components/NumPad';
import { useOnboarding } from '../../services/onboardingContext';
import { useTheme } from '../../theme';
import { createAppSettings } from '../../services/database';
import { hashPin } from '../../utils/pin';

const PIN_LENGTH = 4;

type Phase = 'create' | 'confirm';

export default function PinSetupScreen() {
  const theme = useTheme();
  const { data } = useOnboarding();
  const [phase, setPhase] = useState<Phase>('create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const monoFont = theme.fontsLoaded
    ? theme.fonts.monospace
    : theme.fonts.monospaceFallback;

  const handleDigit = useCallback(
    async (digit: string) => {
      if (pin.length >= PIN_LENGTH) return;
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        if (phase === 'create') {
          setFirstPin(newPin);
          setPin('');
          setPhase('confirm');
          Speech.speak('Now confirm your PIN', { rate: 0.95 });
        } else {
          if (newPin === firstPin) {
            // Success
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            Speech.speak('PIN created', { rate: 0.95 });
            const pinHash = await hashPin(newPin);
            await createAppSettings(pinHash);
            router.push('/onboarding/done');
          } else {
            // Mismatch -- shake and reset
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            );
            Speech.speak("PINs don't match. Try again.", { rate: 1.0 });
            shakeX.value = withSequence(
              withTiming(-12, { duration: 50 }),
              withTiming(12, { duration: 50 }),
              withTiming(-12, { duration: 50 }),
              withTiming(12, { duration: 50 }),
              withTiming(0, { duration: 50 }),
            );
            setTimeout(() => {
              setPin('');
              setFirstPin('');
              setPhase('create');
            }, 300);
          }
        }
      }
    },
    [pin, phase, firstPin, shakeX],
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const phaseLabel =
    phase === 'create' ? 'Create Your PIN' : 'Confirm Your PIN';
  const phaseHint =
    phase === 'create'
      ? 'Choose a 4-digit PIN to secure your data'
      : 'Enter the same PIN again';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.base.background }]}
    >
      <View style={styles.inner}>
        <OnboardingProgress currentStep={7} totalSteps={8} />

        {/* Terminal-styled PIN display */}
        <View
          style={[
            styles.terminalOuter,
            {
              backgroundColor: theme.colors.base.surface,
              borderRadius: theme.radius.terminal,
              borderColor: theme.colors.base.border,
            },
            theme.shadows.md,
          ]}
        >
          {/* Terminal header bar */}
          <View
            style={[
              styles.terminalHeader,
              {
                backgroundColor: theme.colors.base.terminal,
                borderTopLeftRadius: theme.radius.terminal - 2,
                borderTopRightRadius: theme.radius.terminal - 2,
                padding: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
              },
            ]}
          >
            <View style={styles.terminalDots}>
              <View
                style={[styles.terminalDot, { backgroundColor: '#FF6B6B' }]}
              />
              <View
                style={[styles.terminalDot, { backgroundColor: '#F5C842' }]}
              />
              <View
                style={[styles.terminalDot, { backgroundColor: '#6BC5A0' }]}
              />
            </View>
            <Text
              style={[
                styles.terminalTitleText,
                {
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                },
              ]}
            >
              pin-setup
            </Text>
          </View>

          {/* PIN content area */}
          <View
            style={[
              styles.pinArea,
              {
                backgroundColor: theme.colors.base.terminal,
                padding: theme.spacing.xl,
              },
            ]}
          >
            <Text
              style={[
                styles.promptText,
                {
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                },
              ]}
            >
              {'> '}
              {phase === 'create' ? 'Enter new PIN:' : 'Confirm PIN:'}
            </Text>

            <Animated.View style={[styles.dotsRow, shakeStyle]}>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      borderColor: theme.colors.interactive.primary,
                      backgroundColor:
                        i < pin.length
                          ? theme.colors.interactive.primary
                          : 'transparent',
                    },
                  ]}
                  accessibilityLabel={
                    i < pin.length
                      ? `Digit ${i + 1} entered`
                      : `Digit ${i + 1} empty`
                  }
                />
              ))}
            </Animated.View>

            <Text
              style={[
                styles.statusText,
                {
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                  opacity: 0.6,
                },
              ]}
            >
              {pin.length}/{PIN_LENGTH} digits
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: theme.colors.base.textPrimary,
              fontFamily: theme.fontsLoaded ? theme.fonts.heading : undefined,
            },
          ]}
          accessibilityRole="header"
        >
          {phaseLabel}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.base.textSecondary }]}
        >
          {phaseHint}
        </Text>

        <View style={styles.numPadContainer}>
          <NumPad
            onDigit={handleDigit}
            onDelete={handleDelete}
            currentLength={pin.length}
            maxLength={PIN_LENGTH}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 16,
  },
  terminalOuter: {
    borderWidth: 2,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 6,
  },
  terminalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalTitleText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  pinArea: {
    alignItems: 'center',
    gap: 16,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 8,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  statusText: {
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  numPadContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
