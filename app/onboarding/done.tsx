import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { useAuth } from '../../services/authContext';
import { writeOnboardingData } from '../../services/onboardingWriter';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function DoneScreen() {
  const { data } = useOnboarding();
  const { refresh } = useAuth();

  useEffect(() => {
    // Success haptic cascade
    const cascade = async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((r) => setTimeout(r, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };
    cascade();
    Speech.speak(`You're all set, ${data.userName}. Let's start tracking.`, { rate: 0.9 });
  }, [data.userName]);

  const handleStart = async () => {
    try {
      await writeOnboardingData(data);
      await refresh();
      router.replace('/(tabs)/');
    } catch (err) {
      console.error('Failed to write onboarding data:', err);
      Speech.speak('Something went wrong. Please try again.', { rate: 1.0 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={7} totalSteps={7} />

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(0).duration(600)} style={styles.iconContainer}>
            <Text style={styles.bigIcon}>🎉</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
            You're all set, {data.userName}!
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.summaryCard}>
            <SummaryRow label="Income" value={`£${data.monthlyIncome.toLocaleString()}/month`} />
            <SummaryRow label="Bills" value={`£${data.fixedExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}/month`} />
            <SummaryRow label="Flexible" value={`£${data.flexibleSpending.toLocaleString()}/month`} />
            <SummaryRow label="Goals" value={`${data.motivationFocuses.length} selected`} />
            <SummaryRow label="Style" value={data.financialPersona} />
            <SummaryRow label="Input" value={data.inputPreference === 'voice' ? 'Voice' : 'Text'} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={{ alignSelf: 'stretch' }}>
          <Pressable style={styles.cta} onPress={handleStart} accessibilityRole="button">
            <Text style={styles.ctaText}>Start tracking</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.xxl },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.xxl },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  bigIcon: { fontSize: 40 },
  title: { fontSize: FontSize.title, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  summaryCard: { backgroundColor: Colors.menuBg, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignSelf: 'stretch', gap: Spacing.sm },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  value: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },
});
