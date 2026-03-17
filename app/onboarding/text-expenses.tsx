import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import OnboardingProgress from '../../components/OnboardingProgress';
import { useOnboarding } from '../../services/onboardingContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const DEFAULT_EXPENSES = [
  { name: 'Rent', amount: 900 },
  { name: 'Utilities', amount: 120 },
  { name: 'Phone', amount: 35 },
  { name: 'Insurance', amount: 60 },
  { name: 'Transport', amount: 80 },
  { name: 'Other', amount: 0 },
];

interface ExpenseItem {
  name: string;
  amount: number;
  enabled: boolean;
}

export default function TextExpensesScreen() {
  const { data, updateData } = useOnboarding();
  const [expenses, setExpenses] = useState<ExpenseItem[]>(
    data.fixedExpenses.length > 0
      ? data.fixedExpenses.map((e) => ({ ...e, enabled: true }))
      : DEFAULT_EXPENSES.map((e) => ({ ...e, enabled: e.amount > 0 }))
  );

  const toggleExpense = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpenses((prev) => prev.map((e, i) => i === index ? { ...e, enabled: !e.enabled } : e));
  };

  const updateAmount = (index: number, text: string) => {
    const num = parseFloat(text) || 0;
    setExpenses((prev) => prev.map((e, i) => i === index ? { ...e, amount: num } : e));
  };

  const total = expenses.filter((e) => e.enabled).reduce((sum, e) => sum + e.amount, 0);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fixedExpenses = expenses
      .filter((e) => e.enabled && e.amount > 0)
      .map(({ name, amount }) => ({ name, amount }));
    updateData({ fixedExpenses });
    router.push('/onboarding/text-spending');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <OnboardingProgress currentStep={3} totalSteps={7} />

        <Text style={styles.title} accessibilityRole="header">Regular Bills</Text>
        <Text style={styles.subtitle}>Toggle and adjust your monthly bills</Text>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {expenses.map((expense, index) => (
            <View key={index} style={[styles.row, !expense.enabled && styles.rowDisabled]}>
              <Pressable
                style={[styles.checkbox, expense.enabled && styles.checkboxChecked]}
                onPress={() => toggleExpense(index)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: expense.enabled }}
                accessibilityLabel={expense.name}
              >
                {expense.enabled && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
              <Text style={[styles.expenseName, !expense.enabled && styles.textDisabled]}>{expense.name}</Text>
              <View style={styles.amountInput}>
                <Text style={styles.pound}>£</Text>
                <TextInput
                  style={styles.input}
                  value={expense.amount > 0 ? expense.amount.toString() : ''}
                  onChangeText={(text) => updateAmount(index, text)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  editable={expense.enabled}
                  accessibilityLabel={`${expense.name} amount`}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total monthly bills</Text>
          <Text style={styles.totalAmount}>£{total.toLocaleString()}</Text>
        </View>

        <Pressable style={styles.cta} onPress={handleContinue} accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
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
  listContent: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: Colors.menuBg, borderRadius: BorderRadius.md },
  rowDisabled: { opacity: 0.5 },
  checkbox: { width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  expenseName: { flex: 1, fontSize: FontSize.body, color: Colors.text, fontWeight: '500' },
  textDisabled: { color: Colors.textMuted },
  amountInput: { flexDirection: 'row', alignItems: 'center' },
  pound: { fontSize: FontSize.body, color: Colors.textSecondary, marginRight: 2 },
  input: { width: 70, height: 40, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, fontSize: FontSize.body, color: Colors.text, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: FontSize.body, fontWeight: '700', color: Colors.text },
  totalAmount: { fontSize: FontSize.body, fontWeight: '700', color: Colors.primary },
  cta: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center' },
  ctaText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFFFFF' },
});
