import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import VoiceInput from '../../components/VoiceInput';
import { useOnboarding } from '../../services/onboardingContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

function parseAmount(text: string): number | null {
  const match = text.match(/£?\s*(\d[\d,]*\.?\d*)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

export default function VoiceFlexibleScreen() {
  const { data, updateData } = useOnboarding();
  const totalBills = data.fixedExpenses.reduce((sum, b) => sum + b.amount, 0);
  const autoCalc = Math.max(0, data.monthlyIncome - totalBills);
  const [amount, setAmount] = useState<number | null>(autoCalc > 0 ? autoCalc : null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (autoCalc > 0) {
      Speech.speak(
        `After bills, you have about £${Math.round(autoCalc)} left. How much do you want for daily spending?`,
        { rate: 0.85 }
      );
    } else {
      Speech.speak("How much do you want for daily spending each month?", { rate: 0.9 });
    }
  }, [autoCalc]);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    const parsed = parseAmount(text);
    if (parsed && parsed > 0) {
      setAmount(parsed);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak(`£${Math.round(parsed)} for flexible spending`, { rate: 0.95 });
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Speech.speak("Say an amount, like 500.", { rate: 0.95 });
    }
    setIsProcessing(false);
  };

  const handleContinue = () => {
    updateData({ flexibleSpending: amount || autoCalc });
    router.push('/onboarding/persona');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={3} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">Flexible Budget</Text>
        <Text style={styles.subtitle}>How much for groceries, transport, dining, shopping?</Text>

        {autoCalc > 0 && (
          <View style={styles.calcBox}>
            <Text style={styles.calcLine}>Income: £{data.monthlyIncome.toLocaleString()}</Text>
            <Text style={styles.calcLine}>Bills: −£{totalBills.toLocaleString()}</Text>
            <Text style={styles.calcResult}>Available: £{autoCalc.toLocaleString()}</Text>
          </View>
        )}

        {amount !== null && (
          <View style={styles.amountDisplay}>
            <Text style={styles.amountText}>£{amount.toLocaleString()}</Text>
            <Text style={styles.perMonth}>flexible spending / month</Text>
          </View>
        )}

        <VoiceInput onTranscript={handleTranscript} isProcessing={isProcessing} />

        <Pressable
          style={styles.altButton}
          onPress={() => router.replace('/onboarding/text-spending')}
          accessibilityRole="button"
        >
          <Text style={styles.altButtonText}>Type instead</Text>
        </Pressable>

        <Pressable
          style={[styles.cta, !amount && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={!amount}
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
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.lg, alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  calcBox: { backgroundColor: Colors.menuBg, borderRadius: BorderRadius.md, padding: Spacing.lg, alignSelf: 'stretch', gap: Spacing.xs },
  calcLine: { fontSize: FontSize.sm, color: Colors.textSecondary },
  calcResult: { fontSize: FontSize.body, color: Colors.primary, fontWeight: '700', marginTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  amountDisplay: { alignItems: 'center', paddingVertical: Spacing.md },
  amountText: { fontSize: 40, fontWeight: '700', color: Colors.primary },
  perMonth: { fontSize: FontSize.sm, color: Colors.textMuted },
  altButton: { paddingVertical: Spacing.sm },
  altButtonText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center', alignSelf: 'stretch' },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});
