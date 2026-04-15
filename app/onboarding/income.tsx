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

export default function IncomeScreen() {
  const theme = useTheme();
  const { data, updateData } = useOnboarding();
  const [value, setValue] = useState(data.monthlyIncome > 0 ? data.monthlyIncome.toString() : '');

  const eggLines = getPetArt('egg');
  const monoFont = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const headingFont = theme.fontsLoaded ? theme.fonts.heading : theme.fonts.headingFallback;

  const numericValue = parseFloat(value) || 0;
  const canContinue = numericValue > 0;

  const handleChangeText = (text: string) => {
    // Allow only digits and a single decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) return;
    // Limit total length
    if (cleaned.length > 10) return;
    setValue(cleaned);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    updateData({ monthlyIncome: Math.round(numericValue * 100) / 100 });
    router.push('/onboarding/expenses');
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
              accessibilityLabel={`${data.petName} the egg watches as you enter your income`}
              style={[
                styles.terminal,
                {
                  backgroundColor: theme.colors.base.terminal,
                  borderRadius: theme.radius.terminal - 2,
                  padding: theme.spacing.sm,
                },
              ]}
            >
              {eggLines.slice(1, 8).map((line, i) => (
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
            Monthly Income
          </Text>
          <Text
            style={{
              color: theme.colors.base.textSecondary,
              fontSize: theme.typeScale.bodyLarge,
              textAlign: 'center',
              marginTop: theme.spacing.xs,
            }}
          >
            Your take-home pay after taxes
          </Text>

          {/* Terminal-style income input */}
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
                marginBottom: theme.spacing.sm,
              }}
            >
              {'> Enter monthly take-home pay'}
            </Text>
            <View style={styles.promptRow}>
              <Text
                style={{
                  color: theme.colors.petStates.thriving.light,
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
                value={value}
                onChangeText={handleChangeText}
                placeholder="0.00"
                placeholderTextColor={theme.colors.base.terminalText + '44'}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                accessibilityLabel="Monthly income amount"
                accessibilityRole="text"
                accessibilityHint="Enter your monthly take-home pay"
              />
            </View>
          </View>

          {/* Display formatted value */}
          {numericValue > 0 && (
            <Text
              style={{
                color: theme.colors.base.textSecondary,
                fontFamily: monoFont,
                fontSize: theme.typeScale.bodySmall,
                textAlign: 'center',
                marginTop: theme.spacing.md,
              }}
              accessibilityLabel={`Monthly income: $${numericValue.toLocaleString()}`}
            >
              {`= $${numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month`}
            </Text>
          )}

          {/* Continue button */}
          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: canContinue
                  ? theme.colors.interactive.primary
                  : theme.colors.interactive.disabled,
                borderRadius: theme.radius.xl,
                marginTop: theme.spacing.xl,
              },
              canContinue ? theme.shadows.md : undefined,
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to expenses"
            accessibilityState={{ disabled: !canContinue }}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: canContinue
                    ? theme.colors.interactive.primaryText
                    : theme.colors.interactive.disabledText,
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
    justifyContent: 'center',
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
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    fontWeight: '700',
  },
});
