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

export default function VoiceIncomeScreen() {
  const { data, updateData } = useOnboarding();
  const [amount, setAmount] = useState<number | null>(data.monthlyIncome || null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    Speech.speak("What's your monthly take-home pay?", { rate: 0.9 });
  }, []);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    const parsed = parseAmount(text);
    if (parsed && parsed > 0) {
      setAmount(parsed);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak(`Got it, £${Math.round(parsed)} per month`, { rate: 0.95 });
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Speech.speak("I didn't catch an amount. Try saying a number like 2000.", { rate: 0.95 });
    }
    setIsProcessing(false);
  };

  const handleContinue = () => {
    if (!amount) return;
    updateData({ monthlyIncome: amount });
    router.push('/onboarding/voice-bills');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={3} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">Monthly Income</Text>
        <Text style={styles.subtitle}>What's your monthly take-home pay?</Text>

        {amount !== null && (
          <View style={styles.amountDisplay}>
            <Text style={styles.amountText}>£{amount.toLocaleString()}</Text>
            <Text style={styles.perMonth}>per month</Text>
          </View>
        )}

        <VoiceInput onTranscript={handleTranscript} isProcessing={isProcessing} />

        <Pressable
          style={styles.altButton}
          onPress={() => router.replace('/onboarding/text-income')}
          accessibilityRole="button"
          accessibilityLabel="Type instead"
        >
          <Text style={styles.altButtonText}>Type instead</Text>
        </Pressable>

        {amount !== null && (
          <Pressable
            style={styles.cta}
            onPress={handleContinue}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.lg, alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  amountDisplay: { alignItems: 'center', paddingVertical: Spacing.lg },
  amountText: { fontSize: 40, fontWeight: '700', color: Colors.primary },
  perMonth: { fontSize: FontSize.sm, color: Colors.textMuted },
  altButton: { paddingVertical: Spacing.sm },
  altButtonText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center', alignSelf: 'stretch' },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});
