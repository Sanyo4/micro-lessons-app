import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OnboardingProgress from '../../components/OnboardingProgress';
import MotivationCard from '../../components/MotivationCard';
import { useOnboarding } from '../../services/onboardingContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const GOALS = [
  { key: 'budgeting', title: 'Master your budget', icon: '💰' },
  { key: 'emergency_fund', title: 'Build an emergency fund', icon: '🛡️' },
  { key: 'literacy', title: 'Understand your money', icon: '📚' },
  { key: 'goal_setting', title: 'Set financial goals', icon: '🎯' },
  { key: 'expense_tracking', title: 'Track every penny', icon: '🔍' },
];

export default function MotivationScreen() {
  const { data, updateData } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>(data.motivationFocuses);

  useEffect(() => {
    if (currentIndex < GOALS.length) {
      Speech.speak(GOALS[currentIndex].title, { rate: 0.9 });
    }
  }, [currentIndex]);

  const handleSelect = () => {
    const goal = GOALS[currentIndex];
    setSelected((prev) => prev.includes(goal.key) ? prev : [...prev, goal.key]);
    advance();
  };

  const handleSkip = () => {
    advance();
  };

  const advance = () => {
    if (currentIndex < GOALS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const allReviewed = currentIndex >= GOALS.length - 1;

  const handleContinue = () => {
    const finalSelected = selected.length > 0 ? selected : ['budgeting'];
    updateData({ motivationFocuses: finalSelected });
    if (data.inputPreference === 'voice') {
      router.push('/onboarding/voice-income');
    } else {
      router.push('/onboarding/text-income');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <OnboardingProgress currentStep={2} totalSteps={7} />

          <Text style={styles.title} accessibilityRole="header">What matters to you?</Text>
          <Text style={styles.subtitle}>Swipe right to select, left to skip</Text>

          <View style={styles.cardArea}>
            {currentIndex < GOALS.length ? (
              <>
                <Text style={styles.counter}>{currentIndex + 1} of {GOALS.length}</Text>
                <MotivationCard
                  key={GOALS[currentIndex].key}
                  title={GOALS[currentIndex].title}
                  icon={GOALS[currentIndex].icon}
                  onSelect={handleSelect}
                  onSkip={handleSkip}
                />
              </>
            ) : (
              <View style={styles.doneCard}>
                <Text style={styles.doneIcon}>✅</Text>
                <Text style={styles.doneText}>
                  {selected.length} goal{selected.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            )}
          </View>

          {selected.length > 0 && (
            <View style={styles.selectedRow}>
              {selected.map((key) => {
                const goal = GOALS.find((g) => g.key === key);
                return goal ? (
                  <View key={key} style={styles.chip}>
                    <Text style={styles.chipText}>{goal.icon} {goal.title}</Text>
                  </View>
                ) : null;
              })}
            </View>
          )}

          {allReviewed && (
            <Pressable
              style={[styles.cta, selected.length === 0 && styles.ctaDisabled]}
              onPress={handleContinue}
              disabled={selected.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
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
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  counter: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  doneCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  doneIcon: {
    fontSize: 48,
  },
  doneText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '600',
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
