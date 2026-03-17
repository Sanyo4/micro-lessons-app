import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import VoiceInput from '../../components/VoiceInput';
import { useOnboarding } from '../../services/onboardingContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

function parseBill(text: string): { name: string; amount: number } | null {
  const lower = text.toLowerCase();
  if (lower.includes('done') || lower.includes('finish') || lower.includes('that\'s it') || lower.includes("that's all")) {
    return null;
  }
  const amountMatch = text.match(/£?\s*(\d[\d,]*\.?\d*)/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  const nameText = text.replace(/£?\s*\d[\d,]*\.?\d*/g, '').trim();
  const name = nameText || 'Bill';
  return { name: name.charAt(0).toUpperCase() + name.slice(1), amount };
}

export default function VoiceBillsScreen() {
  const { data, updateData } = useOnboarding();
  const [bills, setBills] = useState<{ name: string; amount: number }[]>(data.fixedExpenses);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    Speech.speak("What are your regular bills? Say a bill name and amount, then say done when finished.", { rate: 0.85 });
  }, []);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    const lower = text.toLowerCase();
    if (lower.includes('done') || lower.includes('finish') || lower.includes("that's it") || lower.includes("that's all")) {
      Speech.speak(`Got ${bills.length} bills. Moving on.`, { rate: 0.95 });
      setIsProcessing(false);
      handleContinue();
      return;
    }
    const bill = parseBill(text);
    if (bill) {
      setBills((prev) => [...prev, bill]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak(`Added ${bill.name}, £${Math.round(bill.amount)}. Next bill, or say done.`, { rate: 0.95 });
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Speech.speak("Say a bill name and amount, like rent 900.", { rate: 0.95 });
    }
    setIsProcessing(false);
  };

  const handleContinue = () => {
    updateData({ fixedExpenses: bills });
    router.push('/onboarding/voice-flexible');
  };

  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={3} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">Regular Bills</Text>
        <Text style={styles.subtitle}>Name each bill and its amount. Say "done" when finished.</Text>

        {bills.length > 0 && (
          <ScrollView style={styles.billList} contentContainerStyle={styles.billListContent}>
            {bills.map((bill, i) => (
              <View key={i} style={styles.billRow}>
                <Text style={styles.billName}>{bill.name}</Text>
                <Text style={styles.billAmount}>£{bill.amount.toFixed(0)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>£{totalBills.toFixed(0)}</Text>
            </View>
          </ScrollView>
        )}

        <VoiceInput onTranscript={handleTranscript} isProcessing={isProcessing} />

        <Pressable
          style={styles.altButton}
          onPress={() => router.replace('/onboarding/text-expenses')}
          accessibilityRole="button"
        >
          <Text style={styles.altButtonText}>Type instead</Text>
        </Pressable>

        <Pressable style={styles.cta} onPress={handleContinue} accessibilityRole="button">
          <Text style={styles.ctaText}>{bills.length > 0 ? 'Continue' : 'Skip — no bills'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, gap: Spacing.md, alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  billList: { maxHeight: 200, alignSelf: 'stretch' },
  billListContent: { gap: Spacing.sm },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.menuBg, borderRadius: BorderRadius.sm },
  billName: { fontSize: FontSize.body, color: Colors.text, fontWeight: '500' },
  billAmount: { fontSize: FontSize.body, color: Colors.primary, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: FontSize.body, color: Colors.text, fontWeight: '700' },
  totalAmount: { fontSize: FontSize.body, color: Colors.primary, fontWeight: '700' },
  altButton: { paddingVertical: Spacing.sm },
  altButtonText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center', alignSelf: 'stretch' },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});
