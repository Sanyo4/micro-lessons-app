import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface CategoryDetailCardProps {
  data: {
    category: {
      id: string;
      name: string;
      spent: number;
      weekly_limit: number;
    };
    transactions: Array<{
      id: number;
      amount: number;
      description: string;
      timestamp: string;
    }>;
    remaining: number;
    pct: number;
  };
}

export default function CategoryDetailCard({ data }: CategoryDetailCardProps) {
  const theme = useTheme();
  const mono = theme.fontsLoaded ? theme.fonts.monospace : theme.fonts.monospaceFallback;
  const fs = theme.fontScale;

  const { category, transactions, remaining, pct } = data;

  const progressBar = () => {
    const filled = Math.min(Math.round((pct / 100) * 10), 10);
    const empty = 10 - filled;
    return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
  };

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  };

  const textStyle = {
    color: theme.colors.base.terminalText,
    fontFamily: mono,
    fontSize: 14 * fs,
    lineHeight: 22 * fs,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.base.terminal, borderRadius: theme.radius.terminal }]}>
      {/* Category header */}
      <Text style={[textStyle, { fontSize: 18 * fs, textAlign: 'center', marginBottom: 8 }]}>
        {`── ${category.name} ──`}
      </Text>
      <Text style={textStyle}>
        {`> \u00A3${category.spent.toFixed(0)} / \u00A3${category.weekly_limit.toFixed(0)}  (${pct}%)`}
      </Text>

      {/* Progress bar */}
      <Text style={textStyle}>
        {`  ${progressBar()} ${remaining >= 0 ? `\u00A3${remaining.toFixed(0)} left` : `\u00A3${Math.abs(remaining).toFixed(0)} over!`}`}
      </Text>

      {/* Separator */}
      <Text style={[textStyle, { opacity: 0.3, marginTop: 4, marginBottom: 8 }]}>
        {'────────────────────────────'}
      </Text>

      {/* Transactions */}
      {transactions.length > 0 ? (
        transactions.map((txn, i) => {
          const isLast = i === transactions.length - 1;
          const prefix = isLast ? '\u2514' : '\u251C';
          const desc = txn.description.length > 18
            ? txn.description.slice(0, 18) + '..'
            : txn.description;

          return (
            <Text key={txn.id} style={[textStyle, { opacity: 0.6 }]}>
              {`${prefix} \u00A3${txn.amount.toFixed(2).padStart(5)}  ${desc.padEnd(20)} ${formatDate(txn.timestamp)}`}
            </Text>
          );
        })
      ) : (
        <Text style={[textStyle, { opacity: 0.5 }]}>
          {'  no transactions this week'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
