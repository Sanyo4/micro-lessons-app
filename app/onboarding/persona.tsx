import { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { useVoiceOnboarding } from '../../hooks/useVoiceOnboarding';
import VoiceMicButton from '../../components/VoiceMicButton';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const PERSONAS = [
  {
    key: 'beginner' as const,
    title: 'Keep it simple',
    description: 'No jargon, just clear guidance',
    icon: '🌱',
  },
  {
    key: 'learner' as const,
    title: 'I know the basics',
    description: 'Explain the why behind the numbers',
    icon: '📖',
  },
  {
    key: 'pro' as const,
    title: 'Give me the raw data',
    description: 'ISA rates, APR, compound interest — bring it on',
    icon: '📊',
  },
];

export default function PersonaScreen() {
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<'beginner' | 'learner' | 'pro'>(data.financialPersona);
  const autoContinueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = useCallback((key: 'beginner' | 'learner' | 'pro') => {
    setSelected(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const persona = PERSONAS.find((p) => p.key === key)!;
    Speech.speak(persona.title, { rate: 0.95 });
  }, []);

  const handleContinue = useCallback(() => {
    updateData({ financialPersona: selected });
    router.push('/onboarding/plan');
  }, [selected, updateData]);

  const handleVoiceSelect = useCallback((key: 'beginner' | 'learner' | 'pro') => {
    handleSelect(key);
    if (autoContinueTimer.current) clearTimeout(autoContinueTimer.current);
    autoContinueTimer.current = setTimeout(() => {
      updateData({ financialPersona: key });
      router.push('/onboarding/plan');
    }, 1500);
  }, [handleSelect, updateData]);

  const { isListening, transcript, startListening } = useVoiceOnboarding({
    instruction: "How should we talk about money? Say 'simple' for plain language, 'basics' for some explanation, or 'data' for full detail.",
    keywords: {
      'simple': () => handleVoiceSelect('beginner'),
      'beginner': () => handleVoiceSelect('beginner'),
      'basics': () => handleVoiceSelect('learner'),
      'learner': () => handleVoiceSelect('learner'),
      'data': () => handleVoiceSelect('pro'),
      'pro': () => handleVoiceSelect('pro'),
      'raw': () => handleVoiceSelect('pro'),
    },
    enabled: true,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={5} totalSteps={9} />

        <Text style={styles.title} accessibilityRole="header">Communication Style</Text>
        <Text style={styles.subtitle}>How should we talk about money?</Text>

        <View style={styles.cards}>
          {PERSONAS.map((persona) => (
            <Pressable
              key={persona.key}
              style={[styles.card, selected === persona.key && styles.cardSelected]}
              onPress={() => handleSelect(persona.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === persona.key }}
              accessibilityLabel={`${persona.title}. ${persona.description}`}
            >
              <Text style={styles.cardIcon}>{persona.icon}</Text>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, selected === persona.key && styles.cardTitleSelected]}>
                  {persona.title}
                </Text>
                <Text style={styles.cardDesc}>{persona.description}</Text>
              </View>
              {selected === persona.key && (
                <View style={styles.checkCircle}>
                  <Text style={styles.check}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <VoiceMicButton
          onPress={startListening}
          isListening={isListening}
          transcript={transcript}
        />

        <Pressable style={styles.cta} onPress={handleContinue} accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  cards: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSolid,
    gap: Spacing.lg,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#E6F7F5',
  },
  cardIcon: { fontSize: 36 },
  cardContent: { flex: 1, gap: Spacing.xs },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  cardTitleSelected: { color: Colors.primary },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  check: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});
