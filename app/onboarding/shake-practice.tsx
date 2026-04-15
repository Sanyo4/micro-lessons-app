// Onboarding: Shake-to-talk practice — user must shake to continue
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import OnboardingProgress from '../../components/OnboardingProgress';
import PetTerminal from '../../components/pet/PetTerminal';
import SpeechBubble from '../../components/pet/SpeechBubble';
import { useOnboarding } from '../../services/onboardingContext';
import { useShakeDetector } from '../../hooks/useShakeDetector';
import { useTheme } from '../../theme';

export default function ShakePracticeScreen() {
  const theme = useTheme();
  const { data } = useOnboarding();
  const [shaken, setShaken] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  const petName = data.petName || 'Buddy';
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  // Subtle bob animation for the shake hint
  const bobY = useSharedValue(0);
  useEffect(() => {
    if (!shaken) {
      bobY.value = withRepeat(
        withTiming(-6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [shaken, bobY]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  // Shake detector
  useShakeDetector({
    onShake: () => {
      if (shaken) return;
      setShakeCount((n) => n + 1);
    },
    enabled: !shaken,
    threshold: 1.8,
    debounceMs: 800,
  });

  // After first shake — confirm and proceed
  useEffect(() => {
    if (shakeCount >= 1 && !shaken) {
      setShaken(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Nice! You've got it. Shake anytime to talk to me.", { rate: 0.9 });
      // Navigate after a moment
      setTimeout(() => {
        router.push('/onboarding/done');
      }, 2500);
    }
  }, [shakeCount, shaken]);

  // Speak the instruction on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      Speech.speak(
        `One more thing! You can talk to ${petName} without touching the screen. Just shake your phone to start talking. Try it now!`,
        { rate: 0.9 },
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [petName]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={8} totalSteps={9} />

        <View style={styles.content}>
          {/* Pet */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <PetTerminal petState="happy" petName={petName} />
          </Animated.View>

          {/* Speech bubble */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <SpeechBubble
              message={
                shaken
                  ? `Nice! You've got it. Shake anytime to talk to me.`
                  : `One more thing! You can talk to me without touching the screen. Just shake your phone to start talking. Try it now!`
              }
            />
          </Animated.View>

          {/* Shake hint */}
          {!shaken ? (
            <Animated.View
              entering={FadeInDown.delay(800).duration(600)}
              style={[styles.hintCard, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}
            >
              <Animated.View style={bobStyle}>
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 32, textAlign: 'center' }}>
                  {'((( )))'}
                </Text>
              </Animated.View>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', marginTop: 12, opacity: 0.8 }}>
                {'> shake your phone to continue'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 12, textAlign: 'center', marginTop: 4, opacity: 0.5 }}>
                {'this activates voice input\nso you can use the app eyes-free'}
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={[styles.hintCard, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}
            >
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 28, textAlign: 'center' }}>
                {'[ok]'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14, textAlign: 'center', marginTop: 12, opacity: 0.8 }}>
                {'> shake detected!'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 12, textAlign: 'center', marginTop: 4, opacity: 0.5 }}>
                {'heading to the app...'}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  hintCard: {
    padding: 24,
    alignItems: 'center',
  },
});
