import { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const SLIDER_WIDTH = 300;
const KNOB_SIZE = 32;
const MIN = 0;
const MAX = 1000;
const STEP = 25;

export default function TextSpendingScreen() {
  const { data, updateData } = useOnboarding();
  const totalBills = data.fixedExpenses.reduce((sum, b) => sum + b.amount, 0);
  const available = Math.max(0, data.monthlyIncome - totalBills);
  const maxSlider = available > 0 ? Math.min(available, MAX) : MAX;

  const [value, setValue] = useState(
    data.flexibleSpending > 0 ? data.flexibleSpending : Math.round(available * 0.8)
  );

  const position = useMemo(() => {
    return ((value - MIN) / (maxSlider - MIN)) * (SLIDER_WIDTH - KNOB_SIZE);
  }, [value, maxSlider]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(position, { duration: 100 }) }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(position + KNOB_SIZE / 2, { duration: 100 }),
  }));

  const adjustValue = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValue((prev) => Math.max(MIN, Math.min(maxSlider, prev + delta)));
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ flexibleSpending: value });
    router.push('/onboarding/persona');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={3} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">Flexible Spending</Text>
        <Text style={styles.subtitle}>How much for daily spending each month?</Text>

        {available > 0 && (
          <Text style={styles.availableText}>
            £{available.toLocaleString()} available after bills
          </Text>
        )}

        <View style={styles.amountDisplay}>
          <Text style={styles.amountText}>£{value.toLocaleString()}</Text>
          <Text style={styles.perMonth}>per month</Text>
        </View>

        <View style={styles.sliderContainer}>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, fillStyle]} />
            <Animated.View style={[styles.knob, knobStyle]} />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>£{MIN}</Text>
            <Text style={styles.sliderLabel}>£{maxSlider}</Text>
          </View>
        </View>

        <View style={styles.adjustRow}>
          <Pressable
            style={styles.adjustButton}
            onPress={() => adjustValue(-STEP)}
            accessibilityRole="button"
            accessibilityLabel={`Decrease by £${STEP}`}
          >
            <Text style={styles.adjustText}>−£{STEP}</Text>
          </Pressable>
          <Pressable
            style={styles.adjustButton}
            onPress={() => adjustValue(STEP)}
            accessibilityRole="button"
            accessibilityLabel={`Increase by £${STEP}`}
          >
            <Text style={styles.adjustText}>+£{STEP}</Text>
          </Pressable>
        </View>

        <View style={styles.includesBox}>
          <Text style={styles.includesTitle}>This includes:</Text>
          <Text style={styles.includesText}>Groceries, Transport, Dining, Shopping</Text>
        </View>

        <Pressable
          style={[styles.cta, value <= 0 && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={value <= 0}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  availableText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: '600' },
  amountDisplay: { alignItems: 'center' },
  amountText: { fontSize: 44, fontWeight: '700', color: Colors.primary },
  perMonth: { fontSize: FontSize.sm, color: Colors.textMuted },
  sliderContainer: { width: SLIDER_WIDTH, gap: Spacing.sm },
  track: { height: 8, backgroundColor: Colors.menuBg, borderRadius: 4, justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  knob: { position: 'absolute', width: KNOB_SIZE, height: KNOB_SIZE, borderRadius: KNOB_SIZE / 2, backgroundColor: Colors.primary, borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  adjustRow: { flexDirection: 'row', gap: Spacing.lg },
  adjustButton: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.menuBg, borderWidth: 1, borderColor: Colors.border },
  adjustText: { fontSize: FontSize.body, fontWeight: '600', color: Colors.text },
  includesBox: { backgroundColor: Colors.menuBg, borderRadius: BorderRadius.md, padding: Spacing.md, alignSelf: 'stretch', alignItems: 'center' },
  includesTitle: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  includesText: { fontSize: FontSize.sm, color: Colors.textMuted },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center', alignSelf: 'stretch' },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});
