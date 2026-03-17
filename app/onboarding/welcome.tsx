import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function WelcomeScreen() {
  const { data, updateData } = useOnboarding();
  const [name, setName] = useState(data.userName);
  const [inputMethod, setInputMethod] = useState<'voice' | 'text'>(data.inputPreference);

  useEffect(() => {
    Speech.speak("Welcome to Micro Lessons. What's your name?", { rate: 0.9 });
  }, []);

  const handleContinue = () => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ userName: name.trim(), inputPreference: inputMethod });
    router.push('/onboarding/motivation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <OnboardingProgress currentStep={1} totalSteps={7} />

        <View style={styles.content}>
          <Text style={styles.title} accessibilityRole="header">Welcome to Micro Lessons</Text>
          <Text style={styles.subtitle}>Let's personalise your experience</Text>

          <View style={styles.field}>
            <Text style={styles.label}>What's your name?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              accessibilityLabel="Your name"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>How would you like to input expenses?</Text>
            <View style={styles.methodRow}>
              <Pressable
                style={[styles.methodCard, inputMethod === 'voice' && styles.methodCardSelected]}
                onPress={() => { setInputMethod('voice'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                accessibilityRole="button"
                accessibilityState={{ selected: inputMethod === 'voice' }}
                accessibilityLabel="Talk it through, voice input"
              >
                <Text style={styles.methodIcon}>🎙️</Text>
                <Text style={[styles.methodTitle, inputMethod === 'voice' && styles.methodTitleSelected]}>Talk it through</Text>
                <Text style={styles.methodDesc}>Voice</Text>
              </Pressable>
              <Pressable
                style={[styles.methodCard, inputMethod === 'text' && styles.methodCardSelected]}
                onPress={() => { setInputMethod('text'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                accessibilityRole="button"
                accessibilityState={{ selected: inputMethod === 'text' }}
                accessibilityLabel="Tap it out, text input"
              >
                <Text style={styles.methodIcon}>⌨️</Text>
                <Text style={[styles.methodTitle, inputMethod === 'text' && styles.methodTitleSelected]}>Tap it out</Text>
                <Text style={styles.methodDesc}>Text</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.cta, !name.trim() && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
          accessibilityRole="button"
          accessibilityLabel="Let's begin"
        >
          <Text style={styles.ctaText}>Let's begin</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.lg,
    color: Colors.text,
    backgroundColor: Colors.surfaceSolid,
  },
  methodRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSolid,
    gap: Spacing.xs,
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#E6F7F5',
  },
  methodIcon: {
    fontSize: 32,
  },
  methodTitle: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.text,
  },
  methodTitleSelected: {
    color: Colors.primary,
  },
  methodDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
