// Brief 04 — Budget screen with drill-down + editable limits
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  getBudgetCategories,
  getUserProfile,
  getTransactionsByCategory,
  updateCategoryLimit,
  type BudgetCategory,
  type UserProfile,
  type Transaction,
} from '../../services/database';
import { useTheme } from '../../theme';

export default function BudgetScreen() {
  const theme = useTheme();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    const [cats, prof] = await Promise.all([getBudgetCategories(), getUserProfile()]);
    setCategories(cats);
    setProfile(prof);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleToggle = async (catId: string) => {
    if (expandedId === catId) {
      setExpandedId(null);
      setTransactions([]);
    } else {
      setExpandedId(catId);
      const txns = await getTransactionsByCategory(catId, 'weekly');
      setTransactions(txns.slice(0, 5));
    }
  };

  const handleAdjustLimit = async (catId: string, delta: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const newLimit = Math.max(1, cat.weekly_limit + delta);
    await updateCategoryLimit(catId, newLimit);
    await loadData();
  };

  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalLimit = categories.reduce((sum, c) => sum + c.weekly_limit, 0);
  const totalLeft = totalLimit - totalSpent;
  const pctUsed = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const getStatusIndicator = (spent: number, limit: number) => {
    if (limit <= 0) return { text: ' [ok]', label: 'on track', insight: '  on track', opacity: 0.4 };
    const pct = (spent / limit) * 100;
    if (pct > 100) return { text: ' !!!', label: 'over budget', insight: '  over!', opacity: 1.0 };
    if (pct > 80) return { text: ' !!', label: 'approaching limit', insight: '  tight!', opacity: 0.8 };
    if (pct > 50) return { text: ' [ok]', label: 'watch spending', insight: '  watch it', opacity: 0.6 };
    return { text: ' [ok]', label: 'on track', insight: '  on track', opacity: 0.4 };
  };

  const summaryBar = () => {
    const filled = Math.min(Math.round((pctUsed / 100) * 10), 10);
    const empty = 10 - filled;
    return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
  };

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.base.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={[styles.terminal, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
          <Text style={[styles.termHeader, { color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 18 * fs }]}>
            {'── Budget Overview ──'}
          </Text>

          {categories.length > 0 ? (
            <>
              {/* Summary header */}
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
                {`${summaryBar()} ${pctUsed}% used`}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.7 }}>
                {totalLeft >= 0
                  ? `\u00A3${totalLeft.toFixed(0)} remaining this week`
                  : `\u00A3${Math.abs(totalLeft).toFixed(0)} over budget!`}
              </Text>
              {profile && (
                <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5 }}>
                  {`Streak: ${profile.streak_days}d`}
                </Text>
              )}
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.3, marginTop: 4, marginBottom: 8 }}>
                {'────────────────────────────'}
              </Text>

              {/* Table header */}
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
                {'CATEGORY      SPENT    LEFT'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.4 }}>
                {'──────────    ─────    ────'}
              </Text>

              {/* Rows */}
              {categories.map((cat) => {
                const left = cat.weekly_limit - cat.spent;
                const status = getStatusIndicator(cat.spent, cat.weekly_limit);
                const name = cat.name.padEnd(14).slice(0, 14);
                const spentStr = `\u00A3${cat.spent.toFixed(0)}`.padStart(5);
                const leftStr = left >= 0 ? `\u00A3${left.toFixed(0)}`.padStart(5) : `-\u00A3${Math.abs(left).toFixed(0)}`.padStart(5);
                const isExpanded = expandedId === cat.id;

                return (
                  <View key={cat.id}>
                    <Pressable
                      onPress={() => handleToggle(cat.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${cat.name}: spent \u00A3${cat.spent.toFixed(0)} of \u00A3${cat.weekly_limit.toFixed(0)}, ${status.label}. Tap to ${isExpanded ? 'collapse' : 'expand'}.`}
                    >
                      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs }}>
                        {`${isExpanded ? 'v' : '>'} ${name}${spentStr}  ${leftStr}${status.text}`}
                      </Text>
                      <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: status.opacity }}>
                        {`  ${status.insight.trim()}`}
                      </Text>
                    </Pressable>

                    {/* Expanded: transactions + edit limit */}
                    {isExpanded && (
                      <View style={styles.expanded}>
                        {transactions.length > 0 ? (
                          transactions.map((txn, i) => {
                            const isLast = i === transactions.length - 1;
                            const prefix = isLast ? '\u2514' : '\u251C';
                            const desc = txn.description.length > 18 ? txn.description.slice(0, 18) + '..' : txn.description;
                            return (
                              <Text
                                key={txn.id}
                                style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.6 }}
                              >
                                {`  ${prefix} \u00A3${txn.amount.toFixed(0).padStart(4)}  ${desc.padEnd(20)} ${formatDate(txn.timestamp)}`}
                              </Text>
                            );
                          })
                        ) : (
                          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.5 }}>
                            {'    no transactions this week'}
                          </Text>
                        )}

                        {/* Edit limit controls */}
                        <View style={styles.editRow}>
                          <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, opacity: 0.6 }}>
                            {`  > limit: \u00A3${cat.weekly_limit.toFixed(0)}`}
                          </Text>
                          <Pressable
                            onPress={() => handleAdjustLimit(cat.id, -5)}
                            accessibilityLabel={`Decrease ${cat.name} limit by 5 pounds`}
                            accessibilityRole="button"
                            style={[styles.editBtn, { backgroundColor: theme.colors.interactive.secondary, borderRadius: theme.radius.sm }]}
                          >
                            <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 14 * fs, fontWeight: '700' }}>[-]</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleAdjustLimit(cat.id, 5)}
                            accessibilityLabel={`Increase ${cat.name} limit by 5 pounds`}
                            accessibilityRole="button"
                            style={[styles.editBtn, { backgroundColor: theme.colors.interactive.secondary, borderRadius: theme.radius.sm }]}
                          >
                            <Text style={{ color: theme.colors.interactive.secondaryText, fontFamily: mono, fontSize: 14 * fs, fontWeight: '700' }}>[+]</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Totals */}
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, opacity: 0.4, marginTop: 4 }}>
                {'──────────    ─────    ────'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, fontWeight: '700' }}>
                {`${'TOTAL'.padEnd(14)}${`\u00A3${totalSpent.toFixed(0)}`.padStart(5)}  ${(totalLeft >= 0 ? `\u00A3${totalLeft.toFixed(0)}` : `-\u00A3${Math.abs(totalLeft).toFixed(0)}`).padStart(5)}`}
              </Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center' }}>
                {'No budget set up yet!'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center', opacity: 0.7, marginTop: 12 }}>
                {'Head to the home screen and\ntell Buddy about your spending.'}
              </Text>
              <Text style={{ color: theme.colors.base.terminalText, fontFamily: mono, fontSize: 14 * fs, lineHeight: 22 * fs, textAlign: 'center', opacity: 0.5, marginTop: 12 }}>
                {'> hint: try "I have 50 a week\n  for food and 20 for coffee"'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, gap: 16 },
  terminal: { padding: 16 },
  termHeader: { textAlign: 'center', marginBottom: 12 },
  emptyState: { paddingVertical: 24 },
  expanded: { marginBottom: 8 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
});
