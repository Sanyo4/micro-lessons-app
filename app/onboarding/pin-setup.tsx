import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import NumPad from '../../components/NumPad';
import { useOnboarding } from '../../services/onboardingContext';
import { useAuth } from '../../services/authContext';
import { Colors, Spacing, FontSize } from '../../constants/theme';

const PIN_LENGTH = 4;

type Phase = 'create' | 'confirm';

export default function PinSetupScreen() {
  const { setupPin } = useAuth();
  const [phase, setPhase] = useState<Phase>('create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleDigit = useCallback(async (digit: string) => {
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
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Speech.speak('PIN created', { rate: 0.95 });
          await setupPin(newPin);
          router.push('/onboarding/done');
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
  }, [pin, phase, firstPin, setupPin, shakeX]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={6} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">
          {phase === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {phase === 'create' ? 'Choose a 4-digit PIN to secure your data' : 'Enter the same PIN again'}
        </Text>

        <Animated.View style={[styles.dotsRow, shakeStyle]}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </Animated.View>

        <NumPad
          onDigit={handleDigit}
          onDelete={handleDelete}
          currentLength={pin.length}
          maxLength={PIN_LENGTH}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: Spacing.xl, paddingVertical: Spacing.lg },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary },
  dotFilled: { backgroundColor: Colors.primary },
  dotEmpty: { backgroundColor: 'transparent' },
});
