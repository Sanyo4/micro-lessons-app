import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { getTopPlans, getDefaultPlan, type FinancialPlan } from '../../data/plans';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function PlanScreen() {
  const { data, updateData } = useOnboarding();
  const topPlans = getTopPlans(data.motivationFocuses, 3);
  const [selectedId, setSelectedId] = useState<string>(data.selectedPlanId || topPlans[0]?.id || '');

  const handleSelect = (id: string) => {
    setSelectedId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleContinue = () => {
    updateData({ selectedPlanId: selectedId });
    router.push('/onboarding/pin-setup');
  };

  const handleSkip = () => {
    updateData({ selectedPlanId: getDefaultPlan().id });
    router.push('/onboarding/pin-setup');
  };

  const renderPlanCard = (plan: FinancialPlan) => (
    <Pressable
      key={plan.id}
      style={[styles.planCard, selectedId === plan.id && styles.planCardSelected]}
      onPress={() => handleSelect(plan.id)}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedId === plan.id }}
      accessibilityLabel={`${plan.title}. ${plan.description}`}
    >
      <View style={styles.planHeader}>
        <Text style={[styles.planTitle, selectedId === plan.id && styles.planTitleSelected]}>
          {plan.title}
        </Text>
        {selectedId === plan.id && (
          <View style={styles.checkCircle}>
            <Text style={styles.check}>✓</Text>
          </View>
        )}
      </View>
      <Text style={styles.planDesc}>{plan.description}</Text>
      <View style={styles.categoryRow}>
        {plan.categories.map((cat) => (
          <View key={cat.id} style={[styles.catChip, { backgroundColor: cat.bgColor }]}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={[styles.catName, { color: cat.color }]}>{cat.name}</Text>
            <Text style={styles.catPercent}>{cat.weeklyLimitPercent}%</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={5} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">Choose Your Plan</Text>
        <Text style={styles.subtitle}>Based on your goals, we recommend:</Text>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {topPlans.map(renderPlanCard)}
        </ScrollView>

        <Pressable style={styles.cta} onPress={handleContinue} accessibilityRole="button">
          <Text style={styles.ctaText}>Continue with plan</Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip} accessibilityRole="button">
          <Text style={styles.skipText}>Skip — I'll choose later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  list: { flex: 1 },
  listContent: { gap: Spacing.lg, paddingVertical: Spacing.sm },
  planCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    backgroundColor: Colors.surfaceSolid,
    gap: Spacing.md,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#E6F7F5',
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  planTitleSelected: { color: Colors.primary },
  planDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  check: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  catIcon: { fontSize: 14 },
  catName: { fontSize: FontSize.xs, fontWeight: '600' },
  catPercent: { fontSize: 11, color: Colors.textMuted },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
  skipButton: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
});
