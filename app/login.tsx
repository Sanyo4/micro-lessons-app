import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import NumPad from '../components/NumPad';
import { useAuth } from '../services/authContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

const PIN_LENGTH = 4;

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { login, resetApp } = useAuth();
  const shakeX = useSharedValue(0);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>

        <Animated.View style={[styles.dotsRow, shakeStyle]}>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]}
              accessibilityLabel={i < pin.length ? 'Digit entered' : 'Digit not entered'}
            />
          ))}
        </Animated.View>

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
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },
  forgotButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  forgotText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '600',
  },
});
