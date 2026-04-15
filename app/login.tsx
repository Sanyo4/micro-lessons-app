// Brief 04 — Terminal-themed PIN entry with pet art
import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import NumPad from '../components/NumPad';
import PetTerminal from '../components/pet/PetTerminal';
import { useAuth } from '../services/authContext';
import { getPetProfile, type PetProfile } from '../services/database';
import { useTheme, type PetMood } from '../theme';

const PIN_LENGTH = 4;

export default function LoginScreen() {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pet, setPet] = useState<PetProfile | null>(null);
  const { login, resetApp } = useAuth();
  const shakeX = useSharedValue(0);

  useEffect(() => {
    getPetProfile().then(setPet).catch(() => {});
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleDigit = useCallback(async (digit: string) => {
    if (pin.length >= PIN_LENGTH || isVerifying) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setIsVerifying(true);
      const success = await login(newPin);
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Speech.speak('Welcome back', { rate: 0.9 });
        router.replace('/(tabs)/');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Speech.speak('Incorrect PIN', { rate: 1.0 });
        shakeX.value = withSequence(
          withTiming(-12, { duration: 50 }),
          withTiming(12, { duration: 50 }),
          withTiming(-12, { duration: 50 }),
          withTiming(12, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
        setTimeout(() => setPin(''), 300);
      }
      setIsVerifying(false);
    }
  }, [pin, isVerifying, login, shakeX]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleForgotPin = () => {
    Alert.alert(
      'Reset App',
      'This will erase all your data and restart setup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
            router.replace('/onboarding/welcome');
          },
        },
      ]
    );
  };

  const petName = pet?.name ?? 'Buddy';
  const petState = (pet?.current_state as PetMood) ?? 'neutral';
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <View style={styles.content}>
        {/* Compact pet terminal */}
        <View style={styles.petSection}>
          <PetTerminal petState={petState} petName={petName} compact />
        </View>

        {/* Terminal-style PIN prompt */}
        <View style={[styles.pinTerminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.pinPrompt, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
            {`── Enter PIN to check on\n   ${petName} ──`}
          </Text>

          <Animated.View style={[styles.dotsRow, shakeStyle]}>
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    borderColor: theme.colors.interactive.primary,
                    backgroundColor: i < pin.length ? theme.colors.interactive.primary : 'transparent',
                  },
                ]}
                accessibilityLabel={i < pin.length ? 'Digit entered' : 'Digit not entered'}
              />
            ))}
          </Animated.View>
        </View>

        <NumPad
          onDigit={handleDigit}
          onDelete={handleDelete}
          disabled={isVerifying}
          currentLength={pin.length}
          maxLength={PIN_LENGTH}
        />

        <Pressable
          onPress={handleForgotPin}
          style={styles.forgotButton}
          accessibilityRole="button"
          accessibilityLabel="Forgot PIN — reset app"
        >
          <Text style={[styles.forgotText, { color: theme.colors.interactive.danger }]}>Forgot PIN?</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  petSection: { width: '100%' },
  pinTerminal: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  pinPrompt: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 8,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  forgotButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
