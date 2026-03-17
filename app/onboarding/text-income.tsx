import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import NumPad from '../../components/NumPad';
import { useOnboarding } from '../../services/onboardingContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function TextIncomeScreen() {
  const { data, updateData } = useOnboarding();
  const [value, setValue] = useState(data.monthlyIncome > 0 ? data.monthlyIncome.toString() : '');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const handleDigit = (digit: string) => {
    if (digit === '.' && value.includes('.')) return;
    if (value.length >= 8) return;
    setValue((prev) => prev + digit);
  };

  const handleDelete = () => {
    setValue((prev) => prev.slice(0, -1));
  };

  const numValue = parseFloat(value) || 0;
  const monthlyValue = frequency === 'weekly' ? numValue * 4.3
    : frequency === 'yearly' ? numValue / 12
    : numValue;

  const handleContinue = () => {
    if (monthlyValue <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ monthlyIncome: Math.round(monthlyValue * 100) / 100 });
    router.push('/onboarding/text-expenses');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={3} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">Monthly Income</Text>

        <View style={styles.display}>
          <Text style={styles.currency}>£</Text>
          <Text style={styles.amount}>{value || '0'}</Text>
        </View>

        <View style={styles.freqRow}>
          {(['weekly', 'monthly', 'yearly'] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.freqButton, frequency === f && styles.freqButtonActive]}
              onPress={() => setFrequency(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: frequency === f }}
            >
              <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {frequency !== 'monthly' && numValue > 0 && (
          <Text style={styles.conversion}>≈ £{Math.round(monthlyValue).toLocaleString()} / month</Text>
        )}

        <NumPad onDigit={handleDigit} onDelete={handleDelete} showDecimal />

        <Pressable
          style={[styles.cta, monthlyValue <= 0 && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={monthlyValue <= 0}
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
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.md, alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  display: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: Spacing.md },
  currency: { fontSize: FontSize.xxl, color: Colors.textMuted, fontWeight: '600' },
  amount: { fontSize: 44, fontWeight: '700', color: Colors.text },
  freqRow: { flexDirection: 'row', gap: Spacing.sm },
  freqButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  freqButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  freqText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  freqTextActive: { color: '#FFFFFF' },
  conversion: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center', alignSelf: 'stretch', marginTop: Spacing.sm },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});
