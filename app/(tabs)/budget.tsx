// Brief 04 — Budget screen as terminal-style table
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getBudgetCategories, type BudgetCategory } from '../../services/database';
import { useTheme } from '../../theme';

export default function BudgetScreen() {
  const theme = useTheme();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);

  useFocusEffect(
    useCallback(() => {
      getBudgetCategories().then(setCategories);
    }, [])
  );

  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalLimit = categories.reduce((sum, c) => sum + c.weekly_limit, 0);
  const totalLeft = totalLimit - totalSpent;
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;

  const getStatusIndicator = (spent: number, limit: number) => {
    if (limit <= 0) return { text: ' [ok]', label: 'on track' };
    const pct = (spent / limit) * 100;
    if (pct > 100) return { text: ' !!!', label: 'over budget' };
    if (pct > 80) return { text: ' !!', label: 'approaching limit' };
    return { text: ' [ok]', label: 'on track' };
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        {/* Terminal Panel */}
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
            {'── Budget Overview ──'}
          </Text>
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.6 }]}>
            {''}
          </Text>

          {/* Table header */}
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
            {'CATEGORY      SPENT    LEFT'}
          </Text>
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.4 }]}>
            {'──────────    ─────    ────'}
          </Text>

          {/* Rows */}
          {categories.map((cat) => {
            const left = cat.weekly_limit - cat.spent;
            const status = getStatusIndicator(cat.spent, cat.weekly_limit);
            const name = cat.name.padEnd(14).slice(0, 14);
            const spentStr = `£${cat.spent.toFixed(0)}`.padStart(5);
            const leftStr = left >= 0 ? `£${left.toFixed(0)}`.padStart(5) : `-£${Math.abs(left).toFixed(0)}`.padStart(5);

            return (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                accessibilityLabel={`${cat.name}: spent £${cat.spent.toFixed(0)} of £${cat.weekly_limit.toFixed(0)}, ${status.label}`}
              >
                <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono }]}>
                  {`${name}${spentStr}  ${leftStr}${status.text}`}
                </Text>
              </Pressable>
            );
          })}

          {/* Totals */}
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, opacity: 0.4, marginTop: 4 }]}>
            {'──────────    ─────    ────'}
          </Text>
          <Text style={[styles.termText, { color: theme.colors.base.terminalText, fontFamily: mono, fontWeight: '700' }]}>
            {`${'TOTAL'.padEnd(14)}${`£${totalSpent.toFixed(0)}`.padStart(5)}  ${(totalLeft >= 0 ? `£${totalLeft.toFixed(0)}` : `-£${Math.abs(totalLeft).toFixed(0)}`).padStart(5)}`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, gap: 16 },
  terminal: { padding: 16 },
  termHeader: { fontSize: 18, textAlign: 'center', marginBottom: 12 },
  termText: { fontSize: 14, lineHeight: 22 },
});
