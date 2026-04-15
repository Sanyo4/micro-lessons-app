import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../theme';
import { useOnboarding } from '../../services/onboardingContext';
import { getPetArt } from '../../assets/pet';

interface ExpenseRow {
  name: string;
  value: string;
}

const DEFAULT_EXPENSES: ExpenseRow[] = [
  { name: 'Rent / Mortgage', value: '' },
  { name: 'Utilities', value: '' },
  { name: 'Phone / Internet', value: '' },
  { name: 'Insurance', value: '' },
  { name: 'Subscriptions', value: '' },
];

export default function ExpensesScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();

  const [expenses, setExpenses] = useState<ExpenseRow[]>(() => {
    if (data.fixedExpenses.length > 0) {
      return data.fixedExpenses.map((e) => ({
        name: e.name,
        value: e.amount > 0 ? e.amount.toString() : '',
      }));
    }
    return DEFAULT_EXPENSES;
  });

  const [flexibleSpending, setFlexibleSpending] = useState(
    data.flexibleSpending > 0 ? data.flexibleSpending.toString() : '',
  );

  const eggLines = getPetArt('egg');
  const monoFont = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const headingFont = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;

  const fixedTotal = expenses.reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0);
  const flexValue = parseFloat(flexibleSpending) || 0;
  const grandTotal = fixedTotal + flexValue;

  const sanitizeAmount = (text: string): string => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return parts.slice(0, 2).join('.');
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    return cleaned.slice(0, 10);
  };

  const updateExpenseValue = (index: number, text: string) => {
    const sanitized = sanitizeAmount(text);
    setExpenses((prev) =>
      prev.map((e, i) => (i === index ? { ...e, value: sanitized } : e)),
    );
  };

  const handleFlexibleChange = (text: string) => {
    setFlexibleSpending(sanitizeAmount(text));
  };

  const handleAddExpense = () => {
    setExpenses((prev) => [...prev, { name: '', value: '' }]);
  };

  const updateExpenseName = (index: number, name: string) => {
    setExpenses((prev) =>
      prev.map((e, i) => (i === index ? { ...e, name } : e)),
    );
  };

  const handleContinue = () => {
    const fixedExpenses = expenses
      .filter((e) => e.name.trim() && (parseFloat(e.value) || 0) > 0)
      .map((e) => ({ name: e.name.trim(), amount: parseFloat(e.value) || 0 }));

    updateData({
      fixedExpenses,
      flexibleSpending: Math.round(flexValue * 100) / 100,
    });

    router.push('/onboarding/plan');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.base.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Compact egg terminal */}
          <View
            style={[
              styles.outerCard,
              {
                backgroundColor: theme.colors.base.surface,
                borderRadius: theme.radius.terminal,
                borderColor: theme.colors.petStates.neutral.light,
              },
              theme.shadows.md,
            ]}
          >
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${data.petName} the egg watches as you enter your expenses`}
              style={[
                styles.terminal,
                {
                  backgroundColor: theme.colors.base.terminal,
                  borderRadius: theme.radius.terminal - 2,
                  padding: theme.spacing.sm,
                },
              ]}
            >
              {eggLines.slice(2, 7).map((line, i) => (
                <Text
                  key={i}
                  style={{
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                    fontSize: theme.typeScale.terminalSmall,
                    lineHeight: theme.typeScale.terminalSmall * theme.lineHeight.relaxed,
                    textAlign: 'center',
                  }}
                >
                  {line}
                </Text>
              ))}
            </View>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.base.textPrimary,
                fontFamily: headingFont,
                fontSize: theme.typeScale.displaySmall,
                marginTop: theme.spacing.xl,
              },
            ]}
            accessibilityRole="header"
          >
            Monthly Expenses
          </Text>
          <Text
            style={{
              color: theme.colors.base.textSecondary,
              fontSize: theme.typeScale.bodyLarge,
              textAlign: 'center',
              marginTop: theme.spacing.xs,
            }}
          >
            Fixed bills and flexible spending
          </Text>

          {/* Fixed expenses terminal block */}
          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: theme.colors.base.terminal,
                borderRadius: theme.radius.terminal,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.petStates.thriving.light,
                fontFamily: monoFont,
                fontSize: theme.typeScale.terminalSmall,
                marginBottom: theme.spacing.md,
              }}
            >
              {'> Fixed expenses (rent, bills, subs)'}
            </Text>

            {expenses.map((expense, index) => (
              <View
                key={index}
                style={[styles.expenseRow, { marginBottom: theme.spacing.sm }]}
              >
                <TextInput
                  style={[
                    styles.expenseNameInput,
                    {
                      color: theme.colors.base.terminalText,
                      fontFamily: monoFont,
                      fontSize: theme.typeScale.terminalSmall,
                      borderBottomColor: theme.colors.base.terminalText + '33',
                    },
                  ]}
                  value={expense.name}
                  onChangeText={(text) => updateExpenseName(index, text)}
                  placeholder="Expense name"
                  placeholderTextColor={theme.colors.base.terminalText + '44'}
                  accessibilityLabel={`Expense ${index + 1} name`}
                  accessibilityRole="text"
                />
                <View style={styles.amountCell}>
                  <Text
                    style={{
                      color: theme.colors.petStates.thriving.light,
                      fontFamily: monoFont,
                      fontSize: theme.typeScale.terminalSmall,
                    }}
                  >
                    {'$ '}
                  </Text>
                  <TextInput
                    style={[
                      styles.amountInput,
                      {
                        color: theme.colors.base.terminalText,
                        fontFamily: monoFont,
                        fontSize: theme.typeScale.terminalSmall,
                        borderBottomColor: theme.colors.base.terminalText + '33',
                      },
                    ]}
                    value={expense.value}
                    onChangeText={(text) => updateExpenseValue(index, text)}
                    placeholder="0"
                    placeholderTextColor={theme.colors.base.terminalText + '44'}
                    keyboardType="decimal-pad"
                    accessibilityLabel={`${expense.name || `Expense ${index + 1}`} amount`}
                    accessibilityRole="text"
                  />
                </View>
              </View>
            ))}

            {/* Add expense row */}
            <Pressable
              style={[styles.addRow, { marginTop: theme.spacing.sm }]}
              onPress={handleAddExpense}
              accessibilityRole="button"
              accessibilityLabel="Add another expense"
            >
              <Text
                style={{
                  color: theme.colors.petStates.thriving.light,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminalSmall,
                  opacity: 0.7,
                }}
              >
                {'> + Add another expense'}
              </Text>
            </Pressable>

            {/* Divider */}
            <View
              style={[
                styles.divider,
                {
                  borderBottomColor: theme.colors.base.terminalText + '33',
                  marginVertical: theme.spacing.md,
                },
              ]}
            />

            {/* Fixed total */}
            <View style={styles.totalRow}>
              <Text
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminalSmall,
                  opacity: 0.8,
                }}
              >
                {'Fixed total:'}
              </Text>
              <Text
                style={{
                  color: theme.colors.base.terminalText,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminalSmall,
                }}
                accessibilityLabel={`Fixed expenses total: $${fixedTotal.toFixed(2)}`}
              >
                {`$ ${fixedTotal.toFixed(2)}`}
              </Text>
            </View>
          </View>

          {/* Flexible spending terminal block */}
          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: theme.colors.base.terminal,
                borderRadius: theme.radius.terminal,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.lg,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.petStates.happy.light,
                fontFamily: monoFont,
                fontSize: theme.typeScale.terminalSmall,
                marginBottom: theme.spacing.sm,
              }}
            >
              {'> Flexible spending (food, fun, etc.)'}
            </Text>
            <View style={styles.promptRow}>
              <Text
                style={{
                  color: theme.colors.petStates.happy.light,
                  fontFamily: monoFont,
                  fontSize: theme.typeScale.terminal,
                }}
              >
                {'> $ '}
              </Text>
              <TextInput
                style={[
                  styles.terminalInput,
                  {
                    color: theme.colors.base.terminalText,
                    fontFamily: monoFont,
                    fontSize: theme.typeScale.terminal,
                  },
                ]}
                value={flexibleSpending}
                onChangeText={handleFlexibleChange}
                placeholder="0.00"
                placeholderTextColor={theme.colors.base.terminalText + '44'}
                keyboardType="decimal-pad"
                accessibilityLabel="Flexible spending amount"
                accessibilityRole="text"
                accessibilityHint="Enter how much you spend on flexible items like food and entertainment"
              />
            </View>
          </View>

          {/* Grand total */}
          {grandTotal > 0 && (
            <View
              style={[
                styles.grandTotalCard,
                {
                  backgroundColor: theme.colors.base.surface,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.lg,
                  borderColor: theme.colors.base.border,
                },
              ]}
            >
              <Text
                style={{
                  color: theme.colors.base.textSecondary,
                  fontSize: theme.typeScale.bodySmall,
                  fontFamily: monoFont,
                }}
              >
                Total monthly expenses
              </Text>
              <Text
                style={{
                  color: theme.colors.base.textPrimary,
                  fontSize: theme.typeScale.titleLarge,
                  fontFamily: headingFont,
                  fontWeight: '700',
                  marginTop: theme.spacing.xs,
                }}
                accessibilityLabel={`Total monthly expenses: $${grandTotal.toFixed(2)}`}
              >
                {`$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </Text>
              {data.monthlyIncome > 0 && (
                <Text
                  style={{
                    color:
                      grandTotal <= data.monthlyIncome
                        ? theme.colors.petStates.thriving.medium
                        : theme.colors.petStates.worried.medium,
                    fontSize: theme.typeScale.bodySmall,
                    fontFamily: monoFont,
                    marginTop: theme.spacing.xs,
                  }}
                  accessibilityLabel={`Remaining after expenses: $${(data.monthlyIncome - grandTotal).toFixed(2)}`}
                >
                  {`Remaining: $${(data.monthlyIncome - grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
              )}
            </View>
          )}

          {/* Continue button */}
          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.interactive.primary,
                borderRadius: theme.radius.xl,
                marginTop: theme.spacing.xl,
              },
              theme.shadows.md,
            ]}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to plan selection"
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: theme.colors.interactive.primaryText,
                  fontFamily: headingFont,
                  fontSize: theme.typeScale.bodyLarge,
                },
              ]}
            >
              Continue
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  outerCard: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  terminal: {
    alignItems: 'center',
  },
  inputCard: {
    overflow: 'hidden',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  terminalInput: {
    flex: 1,
    padding: 0,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseNameInput: {
    flex: 1,
    padding: 0,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  amountCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  amountInput: {
    flex: 1,
    padding: 0,
    borderBottomWidth: 1,
    paddingBottom: 4,
    textAlign: 'right',
  },
  addRow: {
    paddingVertical: 4,
  },
  divider: {
    borderBottomWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalCard: {
    borderWidth: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  buttonText: {
    fontWeight: '700',
  },
});
